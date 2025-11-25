import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, role, country, frequency, message } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'JobNado AI <noreply@jobnadoai.xyz>',
        to: email,
        subject: `JobNado Radar Activated: ${role}`,
        html: `
          <div style="background-color:#0f172a;padding:40px;font-family:'Courier New',monospace;color:#e2e8f0;border-radius:16px;">
            <div style="text-align:center;margin-bottom:30px;">
              <h1 style="color:#818cf8;letter-spacing:4px;margin:0;">ANTIGRAVITY</h1>
              <span style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:2px;">Orbital Job Uplink</span>
            </div>
            <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:20px;margin-bottom:24px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
              <p style="margin:0;line-height:1.6;font-size:16px;color:#fff;">${message}</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;font-size:12px;color:#94a3b8;border-top:1px solid #334155;padding-top:20px;">
              <div>TARGET: <span style="color:#cbd5e1">${role}</span></div>
              <div>SECTOR: <span style="color:#cbd5e1">${country}</span></div>
              <div>FREQ: <span style="color:#cbd5e1">${frequency}</span></div>
              <div>UPLINK: <span style="color:#cbd5e1">Active</span></div>
            </div>
            <div style="text-align:center;margin-top:30px;font-size:10px;color:#475569;">
              POWERED BY GEMINI 2.5 FLASH
            </div>
          </div>
        `
      })
    });

    if (res.ok) {
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      const errorText = await res.text();
      return new Response(JSON.stringify({ error: errorText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
