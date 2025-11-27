# JobNado AI 🌪️

### The Antigravity Career Engine

JobNado AI is an advanced career acceleration platform that uses Google's Gemini 1.5 Flash to decode CVs, infer hidden role opportunities, and perform live, grounded searches for job openings. It features an automated "Job Radar" system that scans for new roles daily and alerts users via email.

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: [React](https://react.dev/) (Vite)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom "Gravity" Design System)
- **Animations**: Native CSS Keyframes + Tailwind Utilities
- **SEO**: `react-helmet-async` for dynamic meta tags
- **State Management**: React Hooks + `localStorage` persistence

### Backend & Infrastructure

- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Edge Functions**: Deno-based serverless functions (Supabase Edge Runtime)
- **Cron Jobs**: `pg_cron` (via Supabase) for daily job scans
- **Hosting**: [Vercel](https://vercel.com/)

### AI & Services

- **Core Intelligence**: [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/)
  - _CV Analysis_: Multimodal vision/text processing.
  - _Web Sweep_: Grounded Google Search retrieval for live job listings.
- **Email Service**: [Resend](https://resend.com/) (via Supabase Edge Functions)
- **Analytics**: Vercel Analytics + Google Tag (gtag.js)
- **Monetization**: Google AdSense

---

## 🏗️ Architecture

### 1. The "Antigravity" Engine (Frontend)

The React application acts as the command center. It manages the user flow through three distinct phases:

1.  **Analysis Phase**: The user uploads a CV (text or image). This is sent to Gemini 1.5 Flash, which extracts skills, experience, and—crucially—infers _suggested roles_ that might not be explicitly stated.
2.  **Web Sweep (Search) Phase**: The app uses Gemini's "Grounding with Google Search" tool to find live, active job listings for the selected role and location. This bypasses stale job boards by querying the live web.
3.  **Results Phase**: Opportunities are presented as "Job Cards" with a calculated "Match Score".

### 2. Job Radar (Backend)

The "Job Radar" is a set-and-forget alert system:

- **Subscription**: Users subscribe to a role/location via the `JobAlertsModal`. This saves a record to the `job_alerts` table in Supabase.
- **Confirmation**: A `send-confirmation` Edge Function triggers immediately to verify the subscription via email.
- **Daily Scan**: A Supabase Cron Job (`check-alerts`) runs every day at 9:00 AM. It:
  1.  Reads active alerts from the database.
  2.  Invokes Gemini 1.5 Flash to perform a fresh "Web Sweep" for each alert.
  3.  Formats the results into a branded HTML email.
  4.  Sends the digest via Resend.

---

## ✨ Key Features

- **CV Decoding**: Upload a PDF, text, or even a _screenshot_ of a resume. Gemini Vision parses it instantly.
- **Role Permutation**: The AI suggests alternative job titles you might be qualified for but hadn't considered.
- **Web Sweep**: Real-time, grounded job search that finds listings posted in the last 24 hours.
- **Job Radar**: Automated daily email alerts for new opportunities.
- **Interview Prep**: AI-generated interview questions and answers tailored to specific job descriptions.
- **Cover Letter Generator**: Instantly drafts a cover letter matching your CV to a specific job.
- **State Persistence**: Refreshes and back-button navigation are handled gracefully without data loss.

---

## 🚀 Local Development

### Prerequisites

- Node.js (v18+)
- Supabase CLI (for Edge Functions)
- Docker (required for local Edge Function testing)

### Setup

1.  **Clone the repository**

    ```bash
    git clone <repo-url>
    cd Antigravity-Job-Seeker
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root:

    ```env
    VITE_GEMINI_API_KEY=your_gemini_key
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```

### Edge Functions (Optional)

To test the backend functions locally:

```bash
supabase start
supabase functions serve --no-verify-jwt
```

---

## 📝 License

Proprietary / Closed Source.
