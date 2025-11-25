import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch Active Alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('is_active', true);

    if (alertsError) throw alertsError;

    console.log(`Processing ${alerts.length} alerts...`);

    const results = [];

    // 3. Process each alert
    for (const alert of alerts) {
      console.log(`Checking jobs for: ${alert.role} in ${alert.country}`);
      
      let jobs = [];
      try {
        // Call Gemini with Search Grounding
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

        const prompt = `
          Find 3 LIVE, active job listings for the role of "${alert.role}" in "${alert.country}".
          Prioritize jobs posted in the last 24 hours.
          Return ONLY a JSON array of objects with keys: title, company, url.
          Example: [{"title": "Software Engineer", "company": "Google", "url": "..."}]
        `;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "MODE_DYNAMIC", dynamic_threshold: 0.7 } } }]
          })
        });

        const geminiData = await geminiRes.json();
        
        // Parse the response to extract jobs (simplified parsing for demo)
        // In production, we'd use a structured schema or more robust parsing
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Attempt to find JSON in the text
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
            jobs = JSON.parse(jsonMatch[0]);
        } else {
            // Fallback if JSON parsing fails, just link to a search
            jobs = [{
                title: `${alert.role} Opportunities`,
                company: "Various",
                url: `https://www.google.com/search?q=${encodeURIComponent(`${alert.role} jobs in ${alert.country}`)}`
            }];
        }

      } catch (err) {
        console.error(`Search failed for ${alert.email}:`, err);
        continue;
      }

      if (jobs.length === 0) continue;

      // 4. Send Email (using Resend)
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        const jobListHtml = jobs.map(j => `<li><a href="${j.url}"><strong>${j.title}</strong> at ${j.company}</a></li>`).join('');
        
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'JobNado AI <noreply@jobnadoai.xyz>',
            to: alert.email,
            subject: `JobNado Alert: ${jobs.length} New ${alert.role} Jobs`,
            html: `
              <h1>JobNado AI</h1>
              <p>Daily scan complete for <strong>${alert.country}</strong>.</p>
              <ul>${jobListHtml}</ul>
              <p><small>To unsubscribe, reply to this email.</small></p>
            `
          })
        });
        
        if (res.ok) {
            results.push({ email: alert.email, status: 'sent', jobsFound: jobs.length });
            // Update last_alerted_at
            await supabase
                .from('job_alerts')
                .update({ last_alerted_at: new Date().toISOString() })
                .eq('id', alert.id);
        } else {
            results.push({ email: alert.email, status: 'failed', error: await res.text() });
        }
      } else {
        results.push({ email: alert.email, status: 'skipped (no email key)' });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
