// ==========================================
// send-design-email - שליחת עיצובים במייל
// ==========================================
// Edge Function ששולחת מיילים עם PNG attachments
// ==========================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "designs@misgarot.online";

interface EmailRequest {
  type: "to_self" | "to_client";
  photographerEmail: string;
  photographerName?: string;
  clientEmail?: string;
  clientName?: string;
  landscapePng: string; // base64
  portraitPng: string; // base64
  designId?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: EmailRequest = await req.json();
    const { type, photographerEmail, photographerName, clientEmail, clientName, landscapePng, portraitPng, designId } = body;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Convert base64 to attachment format
    const landscapeAttachment = {
      filename: "מסגרת_רוחב.png",
      content: landscapePng.replace(/^data:image\/png;base64,/, ""),
    };

    const portraitAttachment = {
      filename: "מסגרת_אורך.png",
      content: portraitPng.replace(/^data:image\/png;base64,/, ""),
    };

    const results = [];

    // ========================================
    // Type: to_self - שליחה לצלם בלבד
    // ========================================
    if (type === "to_self") {
      const emailHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .preview-card { background: #f8f9fa; border-radius: 12px; padding: 15px; text-align: center; }
            .preview-card img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .preview-card .label { margin-top: 10px; font-weight: 600; color: #374151; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎨 העיצובים שלך מוכנים!</h1>
            </div>
            <div class="content">
              <p>שלום ${photographerName || 'יקר/ה'},</p>
              <p>העיצובים נשמרו בהצלחה! מצורפים קבצי PNG באיכות גבוהה.</p>
              
              <div class="preview-grid">
                <div class="preview-card">
                  <div class="label">🖼️ מסגרת רוחב</div>
                </div>
                <div class="preview-card">
                  <div class="label">📱 מסגרת אורך</div>
                </div>
              </div>
              
              <p><strong>הקבצים מצורפים למייל זה.</strong></p>
              
              <a href="https://misgarot.online/dashboard" class="btn">
                צפה במערכת הניהול →
              </a>
            </div>
            <div class="footer">
              <p>Misgarot Online - עיצוב מסגרות מגנט בקלות</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: photographerEmail,
          subject: "🎨 העיצובים שלך מוכנים! | Misgarot Online",
          html: emailHtml,
          attachments: [landscapeAttachment, portraitAttachment],
        }),
      });

      const result = await response.json();
      results.push({ type: "photographer", success: response.ok, result });
    }

    // ========================================
    // Type: to_client - שליחה ללקוח + התראה לצלם
    // ========================================
    if (type === "to_client" && clientEmail && clientName) {
      // Email to client (couple)
      const clientEmailHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #ec4899, #f472b6); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .header .emoji { font-size: 48px; margin-bottom: 10px; }
            .content { padding: 30px; }
            .message { background: linear-gradient(135deg, #fdf2f8, #fce7f3); border-radius: 12px; padding: 20px; margin: 20px 0; border-right: 4px solid #ec4899; }
            .preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .preview-card { background: #f8f9fa; border-radius: 12px; padding: 15px; text-align: center; }
            .preview-card .label { margin-top: 10px; font-weight: 600; color: #374151; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .photographer { background: #ede9fe; border-radius: 8px; padding: 12px; margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">💑</div>
              <h1>מזל טוב! הסקיצות שלכם מוכנות</h1>
            </div>
            <div class="content">
              <p>שלום ${clientName},</p>
              
              <div class="message">
                <p>🎉 הצלם שלכם הכין עבורכם עיצוב מסגרות מגנט מיוחד לאירוע!</p>
                <p>מצורפות סקיצות של המסגרות בפורמט PNG.</p>
              </div>
              
              <div class="preview-grid">
                <div class="preview-card">
                  <div class="label">🖼️ מסגרת רוחב</div>
                </div>
                <div class="preview-card">
                  <div class="label">📱 מסגרת אורך</div>
                </div>
              </div>
              
              <p><strong>📎 הקבצים מצורפים למייל זה.</strong></p>
              
              <div class="photographer">
                <p>💼 הצלם שלכם: ${photographerName || photographerEmail}</p>
              </div>
            </div>
            <div class="footer">
              <p>Misgarot Online - עיצוב מסגרות מגנט בקלות</p>
              <p style="font-size: 12px; color: #9ca3af;">מייל זה נשלח מטעם הצלם שלכם</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const clientResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: clientEmail,
          subject: `💑 ${clientName} - הסקיצות שלכם מוכנות! | Misgarot Online`,
          html: clientEmailHtml,
          attachments: [landscapeAttachment, portraitAttachment],
        }),
      });

      const clientResult = await clientResponse.json();
      results.push({ type: "client", success: clientResponse.ok, result: clientResult });

      // Notification email to photographer
      const photographerNotificationHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981, #34d399); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .info-card { background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0; border-right: 4px solid #10b981; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981, #34d399); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ עיצוב נשלח ללקוח בהצלחה!</h1>
            </div>
            <div class="content">
              <p>שלום ${photographerName || 'יקר/ה'},</p>
              
              <div class="info-card">
                <p><strong>📧 נשלח אל:</strong> ${clientName}</p>
                <p><strong>📬 כתובת:</strong> ${clientEmail}</p>
                <p><strong>📅 תאריך:</strong> ${new Date().toLocaleDateString('he-IL')}</p>
              </div>
              
              <p>הלקוח קיבל את הסקיצות למייל שלו. העיצוב נשמר גם במערכת הניהול שלך.</p>
              
              <a href="https://misgarot.online/dashboard" class="btn">
                צפה במערכת הניהול →
              </a>
            </div>
            <div class="footer">
              <p>Misgarot Online - עיצוב מסגרות מגנט בקלות</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const photographerResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: photographerEmail,
          subject: `✅ עיצוב נשלח ל-${clientName} בהצלחה! | Misgarot Online`,
          html: photographerNotificationHtml,
          attachments: [landscapeAttachment, portraitAttachment],
        }),
      });

      const photographerResult = await photographerResponse.json();
      results.push({ type: "photographer_notification", success: photographerResponse.ok, result: photographerResult });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
