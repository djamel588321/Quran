// Vercel serverless function — sends one daily reminder email to your inbox,
// works even if your phone is off or the app is closed, since this runs on
// Vercel's servers on a schedule (see vercel.json in the project root).
//
// SETUP (one time):
// 1. Put this file at  api/daily-reminder-email.js  in your project (the
//    "api" folder is what makes Vercel treat it as a serverless function).
// 2. In Vercel project settings → Environment Variables, add:
//      RESEND_API_KEY   -> your key from resend.com
//      CRON_SECRET      -> any long random string you make up yourself
// 3. Add the vercel.json in the project root (see accompanying file) so
//    Vercel calls this endpoint automatically every morning.
// 4. Redeploy. You can also test it any time by visiting:
//    https://YOUR-PROJECT.vercel.app/api/daily-reminder-email
//    (a manual browser visit will get a 401 once CRON_SECRET is set —
//    that's expected and correct, see the note in the handler below.)

const TO_EMAIL = 'djamel588321@gmail.com';
const SENDER_EMAIL = 'reminders@your-verified-domain.com'; // must be a domain verified in your Resend account

export default async function handler(req, res) {
  // Vercel automatically sends "Authorization: Bearer <CRON_SECRET>" when it
  // triggers this via the schedule in vercel.json. This check just makes sure
  // random internet traffic can't trigger your email — safe to remove the
  // whole "if" block below while testing locally if it gets in your way.
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set.');
    return res.status(500).json({ error: 'Missing RESEND_API_KEY' });
  }

  const dateStr = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1C2B2B;direction:rtl;text-align:right;">
    <div style="background-color:#0F3D3E;padding:20px 25px;border-radius:6px 6px 0 0;">
      <div style="color:#C9A24B;font-weight:700;font-size:20px;">🌙 رحلتي اليومية</div>
      <div style="color:#CBD9D8;font-size:13px;margin-top:3px;">تذكير اليوم &middot; ${dateStr}</div>
    </div>
    <div style="padding:20px 15px;line-height:1.9;">
      <p><strong>🌙 الخلوة والمناجاة (٥:٣٠ صباحًا):</strong> الوضوء، ركعتان، والاستغفار.</p>
      <p><strong>🕌 صلاة الفجر (٥:٥٠ صباحًا):</strong> ابدأ يومك بصفحة جديدة.</p>
      <p><strong>☀️ التطبيق العملي للندم (١:٠٠ ظهرًا):</strong> معاملة زوجتك بلطف، وصدقة بسيطة اليوم.</p>
      <p><strong>📖 غذاء الروح (٨:٠٠ مساءً):</strong> قراءة الورد القرآني اليومي.</p>
      <p style="color:#7C8C8C;font-size:12px;margin-top:20px;">افتح تطبيق "رحلتي اليومية" لتسجيل ما أنجزته اليوم والحفاظ على تسلسلك.</p>
    </div>
  </div>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `رحلتي اليومية <${SENDER_EMAIL}>`,
        to: [TO_EMAIL],
        subject: `🌙 تذكير رحلتك اليومية — ${dateStr}`,
        html
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Resend error:', response.status, data);
      return res.status(500).json(data);
    }
    return res.status(200).json({ sent: true, id: data.id || null });
  } catch (err) {
    console.error('Send failed:', err);
    return res.status(500).json({ error: String(err) });
  }
}
