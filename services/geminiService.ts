import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CVAnalysis, JobOpportunity } from "../types";

const ANALYSIS_MODEL = "gemini-2.5-flash";
const SEARCH_MODEL = "gemini-2.5-flash";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Phase 1: Deep Parsing
 * Analyzes the raw CV text to extract skills, roles, and generate boolean search strings.
 */
export const analyzeCV = async (cvInput: string | { mimeType: string, data: string }): Promise<CVAnalysis> => {
  // Initialize client per request to ensure fresh state/key usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemPrompt = `
    You are the "Antigravity Job Agent". Your task is to perform a deep semantic analysis of the provided CV.
    
    1. Extract specific Hard Skills and Soft Skills.
    2. Identify the Experience Level (e.g., Junior, Mid-Senior, C-Suite).
    3. Infer "Role Permutations": If they are a "Content Writer", also consider "Copywriter", "Strategist", etc.
    4. Identify "Adjacent Industries" where their skills apply.
    5. Create 3 distinct "Antigravity Boolean Search Strings" for job aggregators (like LinkedIn/Indeed).
       - String 1 (Strict): (Role A OR Role B) AND (Skill 1 AND Skill 2)
       - String 2 (Creative): Focus on the problem they solve, not just titles.
       - String 3 (Niche): Focus on adjacent industries or specific high-value skills.
  `;

  let contents: any[] = [];

  if (typeof cvInput === 'string') {
      // Text Mode
      const safeText = cvInput.length > 40000 ? cvInput.substring(0, 40000) : cvInput;
      contents = [
          { text: systemPrompt },
          { text: `CV TEXT:\n${safeText}` }
      ];
  } else {
      // Image Mode (Multimodal)
      contents = [
          { text: systemPrompt },
          { inlineData: { mimeType: cvInput.mimeType, data: cvInput.data } }
      ];
  }

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      hardSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
      softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
      experienceLevel: { type: Type.STRING },
      suggestedRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
      adjacentIndustries: { type: Type.ARRAY, items: { type: Type.STRING } },
      antigravityBooleanStrings: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING, description: "Short name for this search strategy" },
            query: { type: Type.STRING, description: "The actual boolean string" },
            explanation: { type: Type.STRING, description: "Why this strategy works" }
          },
          required: ["label", "query", "explanation"]
        }
      }
    },
    required: ["hardSkills", "softSkills", "experienceLevel", "suggestedRoles", "antigravityBooleanStrings"]
  };

  let lastError: any;

  // Retry logic for analysis (3 attempts)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: ANALYSIS_MODEL,
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      if (!response.text) throw new Error("No analysis generated");
      return JSON.parse(response.text) as CVAnalysis;
    } catch (error) {
      console.warn(`CV Analysis attempt ${attempt + 1} failed:`, error);
      lastError = error;
      if (attempt < 2) await delay(1000 * (attempt + 1)); // Backoff: 1s, 2s
    }
  }

  console.error("CV Analysis failed after retries:", lastError);
  throw lastError;
};

/**
 * Phase 2: The Web Sweep
 * Uses Google Search Grounding to find actual opportunities based on the analyzed profile.
 */
export const searchOpportunities = async (
  analysis: CVAnalysis, 
  country: string,
  userSelectedRole?: string
): Promise<JobOpportunity[]> => {
  // Initialize client per request
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const targetRole = userSelectedRole || analysis.suggestedRoles[0];
  const skillsStr = analysis.hardSkills.slice(0, 5).join(", ");
  
  // Refined prompt for stability and multi-platform targeting
  const prompt = `
    Act as a high-tech career headhunter. 
    Find 3 LIVE, active job listings for the role of "${targetRole}" (or similar) that would value these skills: ${skillsStr}.
    Experience Level: ${analysis.experienceLevel}.
    Target Location: ${country}.
    
    SEARCH PROTOCOL:
    - Only search for jobs located in or accepting applicants from ${country}.
    - Aggressively scan for opportunities from major platforms: LinkedIn, Indeed, Glassdoor, Wellfound (AngelList), and Otta.
    - Also look for direct company career pages (Greenhouse, Lever, Ashby).
    - Prioritize roles posted within the last 14 days.
    
    For each finding, provide:
    1. Job Title
    2. Company Name
    3. Match Confidence (0-100%)
    4. A one-sentence reason why this candidate fits based on the skills: ${skillsStr}.
    
    Strictly format your response as a list of blocks separated by "|||". 
    Inside each block, use this format:
    Title: [Job Title]
    Company: [Company Name]
    Score: [Number]
    Reason: [Reasoning]
    
    Do not add any other conversational text. Just the blocks.
  `;

  try {
    let response;
    
    // Retry logic for search (Reduced to 2 attempts for speed)
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            response = await ai.models.generateContent({
                model: SEARCH_MODEL,
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });
            break; // Success
        } catch (e) {
            console.warn(`Search attempt ${attempt + 1} failed`, e);
            if (attempt === 1) throw e; // Throw to outer catch to trigger fallback
            // Removed delay to fail-fast to simulation if API is struggling
        }
    }

    if (!response) throw new Error("Search failed to return response");

    // Extract grounding chunks for valid URLs
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const text = response.text || "";

    // Parse the text blocks
    const rawJobs = text.split("|||").filter(block => block.trim().length > 10);
    
    const jobs: JobOpportunity[] = rawJobs.map((block, index) => {
      const titleMatch = block.match(/Title:\s*(.+)/);
      const companyMatch = block.match(/Company:\s*(.+)/);
      const scoreMatch = block.match(/Score:\s*(\d+)/);
      const reasonMatch = block.match(/Reason:\s*(.+)/);

      const title = titleMatch?.[1]?.trim() || "Opportunity";
      const company = companyMatch?.[1]?.trim() || "Unknown Company";

      // Default URL: Smart Google Search pointing to likely platforms with country context
      let appUrl = `https://www.google.com/search?q=${encodeURIComponent(`${title} ${company} job apply ${country}`)}`;
      
      // Attempt to find a better link in grounding chunks
      if (groundingChunks.length > 0) {
        const relevantChunk = groundingChunks.find(chunk => {
          const chunkTitle = chunk.web?.title?.toLowerCase() || "";
          const companyName = company.toLowerCase();
          // Check if company name is in the chunk title
          return companyName.length > 2 && chunkTitle.includes(companyName);
        });
        
        if (relevantChunk?.web?.uri) {
          appUrl = relevantChunk.web.uri;
        }
      }

      return {
        id: `job-${index}-${Date.now()}`,
        title: title,
        company: company,
        matchScore: parseInt(scoreMatch?.[1] || "75"),
        reasoning: reasonMatch?.[1]?.trim() || "Skills alignment detected.",
        applicationUrl: appUrl,
        isSimulated: false
      };
    });

    // If parsing failed or no jobs found, throw to trigger fallback
    if (jobs.length === 0) {
        throw new Error("No structured jobs parsed from response");
    }

    return jobs;
  } catch (error) {
    console.warn("Search API failed or returned no results, switching to simulation.", error);
    
    // Fallback: Return simulated results if search fails. 
    // We intentionally diversify the platforms (LinkedIn, Indeed, Google) to simulate a broad sweep with Country param.
    return [
      {
        id: 'sim-1',
        title: targetRole,
        company: 'Confidential Tech Partner',
        matchScore: 92,
        reasoning: `Your experience with ${analysis.hardSkills[0]} is in high demand for this role type in ${country}.`,
        applicationUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(targetRole)}&location=${encodeURIComponent(country)}`,
        isSimulated: true
      },
      {
        id: 'sim-2',
        title: `${targetRole} Lead`,
        company: 'Global Innovations Corp',
        matchScore: 88,
        reasoning: `Strong alignment with your background in ${analysis.adjacentIndustries[0] || 'tech'}.`,
        applicationUrl: `https://www.indeed.com/jobs?q=${encodeURIComponent(targetRole + " " + (analysis.adjacentIndustries[0] || ""))}&l=${encodeURIComponent(country)}`,
        isSimulated: true
      },
      {
        id: 'sim-3',
        title: `Senior ${targetRole}`,
        company: 'Future Systems Ltd',
        matchScore: 85,
        reasoning: `Based on your ${analysis.experienceLevel} level and soft skills in ${analysis.softSkills[0]}.`,
        applicationUrl: `https://www.google.com/search?ibp=htl;jobs&q=${encodeURIComponent("Senior " + targetRole + " " + country + " jobs")}`,
        isSimulated: true
      }
    ];
  }
};

/**
 * Feature: Outreach Generator
 * Creates a custom message to apply for the role.
 */
export const generateOutreach = async (
  job: JobOpportunity, 
  analysis: CVAnalysis
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Write a short, high-impact "Cold Outreach" message (LinkedIn connection note style, max 300 characters) to a recruiter at ${job.company} regarding the ${job.title} role.
    
    My Core Skills: ${analysis.hardSkills.slice(0,3).join(', ')}.
    Why I fit: ${job.reasoning}.
    My Level: ${analysis.experienceLevel}.
    
    Tone: Professional, confident, "Antigravity" (defying norms, standing out). 
    Do not use placeholders like "[Your Name]". Sign off with "A passionate candidate" or similar if needed, or just leave it open.
    The goal is to get them to look at my profile.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "I am very interested in this role and believe my skills are a great match.";
  } catch (e) {
    console.error("Outreach generation failed", e);
    return "I am writing to express my strong interest in the " + job.title + " position. My background aligns perfectly with your needs.";
  }
};

/**
 * Feature: Job Alert Confirmation
 * Generates a mock "confirmation" message to verify the alert is active.
 */
export const generateAlertConfirmation = async (
  role: string,
  country: string,
  email: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    The user has just subscribed to "Antigravity Job Alerts".
    Role: ${role}
    Location: ${country}
    Email: ${email}
    
    Generate a short, futuristic "Mission Confirmation" message (max 2 sentences).
    Confirm that the "Passive Radar" is now scanning for this role and results will be encrypted and sent to the provided frequency (email).
    Tone: High-tech, professional, empowering.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || `Radar active. Scanning for ${role} in ${country}. Reports will be sent to ${email}.`;
  } catch (e) {
    return `Radar active. Scanning for ${role} in ${country}. Reports will be sent to ${email}.`;
  }
};

/**
 * Feature: AI Interview Prep
 * Generates 5 tough, role-specific interview questions.
 */
export const generateInterviewQuestions = async (
  job: JobOpportunity,
  analysis: CVAnalysis
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert technical interviewer for a top-tier company.
    Candidate Role: ${job.title} at ${job.company}.
    Candidate Skills: ${analysis.hardSkills.join(', ')}.
    Experience Level: ${analysis.experienceLevel}.

    Generate 5 challenging, specific interview questions for this candidate.
    - Mix of technical/hard-skill questions and behavioral/soft-skill questions.
    - Tailor them to the specific role and company if known.
    - Questions should be "Antigravity" style: probing deep understanding, not just textbook definitions.

    Return ONLY the 5 questions as a JSON array of strings. Example: ["Question 1", "Question 2", ...]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response.text) throw new Error("No questions generated");
    return JSON.parse(response.text) as string[];
  } catch (e) {
    console.error("Interview question generation failed", e);
    return [
      "Tell me about a time you had to learn a new technology quickly to solve a critical problem.",
      `How would you apply your skills in ${analysis.hardSkills[0]} to improve our current processes at ${job.company}?`,
      "Describe a situation where you disagreed with a stakeholder. How did you resolve it?",
      "What is the most complex project you've worked on, and what was your specific contribution?",
      `Why do you think you are the best fit for the ${job.title} role?`
    ];
  }
};

/**
 * Feature: AI Interview Prep (Mock Mode)
 * Evaluates a user's answer to a specific question.
 */
export const evaluateInterviewAnswer = async (
  question: string,
  answer: string
): Promise<{ score: number; feedback: string; improvedAnswer: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert interview coach.
    Question: "${question}"
    Candidate Answer: "${answer}"

    Evaluate this answer.
    1. Score it from 0-100 based on clarity, depth, and relevance.
    2. Provide concise, constructive feedback (max 2 sentences).
    3. Provide a "Gold Standard" improved version of the answer that sounds natural but professional.

    Return JSON format:
    {
      "score": number,
      "feedback": "string",
      "improvedAnswer": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response.text) throw new Error("No evaluation generated");
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Answer evaluation failed", e);
    return {
      score: 75,
      feedback: "Good effort, but could be more specific with examples.",
      improvedAnswer: "I would recommend structuring your answer using the STAR method (Situation, Task, Action, Result) to clearly demonstrate your impact."
    };
  }
};

/**
 * Feature: Auto-Cover Letter
 * Generates a tailored cover letter based on CV and Job Description.
 */
export const generateCoverLetter = async (
  job: JobOpportunity,
  analysis: CVAnalysis
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a professional career coach and expert copywriter.
    
    Candidate Profile:
    - Skills: ${analysis.hardSkills.join(', ')}
    - Experience Level: ${analysis.experienceLevel}
    - Soft Skills: ${analysis.softSkills.join(', ')}

    Target Job:
    - Role: ${job.title}
    - Company: ${job.company}
    - Context: ${job.reasoning}

    Task: Write a compelling, professional cover letter for this candidate applying to this job.
    
    Guidelines:
    - Tone: Professional, confident, yet authentic.
    - Structure:
      1. Hook: specific interest in ${job.company} and the role.
      2. Body: Connect specific candidate skills to the job's requirements (inferred from title/reasoning).
      3. Closing: Call to action.
    - Length: Concise (approx 250-300 words).
    - Do NOT use placeholders like "[Your Name]" or "[Date]" - use generic placeholders like "Candidate Name" if absolutely necessary, but try to write it so it's ready to copy-paste with minimal editing.
    - Focus on VALUE ADD. Why should they hire this person?

    Return ONLY the cover letter text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Could not generate cover letter.";
  } catch (e) {
    console.error("Cover letter generation failed", e);
    return "Dear Hiring Manager,\n\nI am writing to express my strong interest in this position. My skills and experience align well with the requirements...\n\n(Generation failed, please try again)";
  }
};

/**
 * Feature: Salary Estimator
 * Estimates salary range for a specific role and location.
 */