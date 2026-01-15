// ==========================================
// 🎨 MISGAROT ONLINE - Send Designs Edge Function
// ==========================================
// Edge Function לשליחת עיצובים במייל
// Deploy: supabase functions deploy send-designs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Email template types
interface EmailData {
  clientName: string;
  clientEmail: string;
  photographerEmail: string;
  landscapeUrl: string;
  portraitUrl: string;
  designName?: string;
}

// Beautiful HTML Email Template
const createEmailHtml = (
  recipientType: "client" | "photographer",
  data: EmailData
): string => {
  const isClient = recipientType === "client";
  const greeting = isClient ? `שלום ${data.clientName}!` : `שלום צלם יקר!`;
  const message = isClient
    ? "העיצובים שלך מוכנים! הנה המסגרות שעוצבו עבורך:"
    : `עיצוב חדש נשלח ללקוח ${data.clientName}. הנה העתק לארכיון שלך:`;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>העיצובים שלך מ-Misgarot Online</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; direction: rtl;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎨 Misgarot Online
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                עיצוב מסגרות מקצועי לאירועים
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 24px; font-weight: 600;">
                ${greeting}
              </h2>
              
              <p style="margin: 0 0 30px; color: #64748b; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
              
              ${
                data.designName
                  ? `
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">שם העיצוב:</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${data.designName}</p>
              </div>
              `
                  : ""
              }
              
              <!-- Download Buttons -->
              <div style="margin: 30px 0;">
                <p style="margin: 0 0 15px; color: #1e293b; font-size: 16px; font-weight: 600;">
                  📥 הורדת העיצובים:
                </p>
                
                <table role="presentation" style="width: 100%; border-collapse: separate; border-spacing: 0 10px;">
                  <tr>
                    <td>
                      <a href="${data.landscapeUrl}" 
                         style="display: block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 12px; text-align: center; font-size: 16px; font-weight: 600;">
                        🖼️ הורד מסגרת לרוחב (2500×1875)
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a href="${data.portraitUrl}" 
                         style="display: block; background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 12px; text-align: center; font-size: 16px; font-weight: 600;">
                        📱 הורד מסגרת לאורך (1875×2500)
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; border-right: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  💡 <strong>טיפ:</strong> הקבצים בפורמט PNG באיכות גבוהה, מותאמים להדפסה על מגנטים.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">
                נשלח באמצעות Misgarot Online
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © ${new Date().getFullYear()} כל הזכויות שמורות
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// Plain text version
const createEmailText = (
  recipientType: "client" | "photographer",
  data: EmailData
): string => {
  const isClient = recipientType === "client";
  const greeting = isClient ? `שלום ${data.clientName}!` : `שלום צלם יקר!`;
  const message = isClient
    ? "העיצובים שלך מוכנים!"
    : `עיצוב חדש נשלח ללקוח ${data.clientName}`;

  return `
${greeting}

${message}

${data.designName ? `שם העיצוב: ${data.designName}` : ""}

הורדת העיצובים:
- מסגרת לרוחב (2500×1875): ${data.landscapeUrl}
- מסגרת לאורך (1875×2500): ${data.portraitUrl}

---
נשלח באמצעות Misgarot Online
  `.trim();
};

// Send email using Resend API
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Misgarot Online <noreply@misgarot.online>",
        to: [to],
        subject: subject,
        html: html,
        text: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return { success: false, error: errorData.message || "Failed to send email" };
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: String(error) };
  }
}

// Main handler
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const {
      clientName,
      clientEmail,
      photographerEmail,
      landscapeUrl,
      portraitUrl,
      designName,
    } = body as EmailData;

    // Validation
    if (!clientEmail || !photographerEmail || !landscapeUrl || !portraitUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: clientEmail, photographerEmail, landscapeUrl, portraitUrl",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Email data
    const emailData: EmailData = {
      clientName: clientName || "לקוח יקר",
      clientEmail,
      photographerEmail,
      landscapeUrl,
      portraitUrl,
      designName,
    };

    // Prepare results
    const results = {
      client: { success: false, error: undefined as string | undefined },
      photographer: { success: false, error: undefined as string | undefined },
    };

    // Send to client
    const clientHtml = createEmailHtml("client", emailData);
    const clientText = createEmailText("client", emailData);
    results.client = await sendEmail(
      clientEmail,
      `🎨 העיצובים שלך מוכנים! | Misgarot Online`,
      clientHtml,
      clientText
    );

    // Send to photographer
    const photographerHtml = createEmailHtml("photographer", emailData);
    const photographerText = createEmailText("photographer", emailData);
    results.photographer = await sendEmail(
      photographerEmail,
      `📋 עיצוב נשלח ל-${emailData.clientName} | Misgarot Online`,
      photographerHtml,
      photographerText
    );

    // Initialize Supabase client to log the order
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get user from auth header if available
      const authHeader = req.headers.get("Authorization");
      let userId = null;

      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }

      // Create order record
      if (userId) {
        const { error: orderError } = await supabase.from("orders").insert({
          user_id: userId,
          client_name: emailData.clientName,
          client_email: clientEmail,
          photographer_email: photographerEmail,
          landscape_url: landscapeUrl,
          portrait_url: portraitUrl,
          status: results.client.success && results.photographer.success ? "completed" : "pending",
          sent_at: new Date().toISOString(),
        });

        if (orderError) {
          console.error("Failed to create order record:", orderError);
        }

        // Log emails
        const emailLogs = [];

        if (results.client.success || results.client.error) {
          emailLogs.push({
            recipient_email: clientEmail,
            recipient_type: "client",
            subject: `🎨 העיצובים שלך מוכנים! | Misgarot Online`,
            status: results.client.success ? "sent" : "failed",
            error_message: results.client.error,
            sent_at: results.client.success ? new Date().toISOString() : null,
          });
        }

        if (results.photographer.success || results.photographer.error) {
          emailLogs.push({
            recipient_email: photographerEmail,
            recipient_type: "photographer",
            subject: `📋 עיצוב נשלח ל-${emailData.clientName} | Misgarot Online`,
            status: results.photographer.success ? "sent" : "failed",
            error_message: results.photographer.error,
            sent_at: results.photographer.success ? new Date().toISOString() : null,
          });
        }

        // We don't have order_id yet, so skip email_logs for now
        // In production, we'd need to update this with a transaction
      }
    }

    // Return results
    const overallSuccess = results.client.success && results.photographer.success;

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        results: results,
        message: overallSuccess
          ? "העיצובים נשלחו בהצלחה!"
          : "חלק מהמיילים לא נשלחו, אנא נסה שוב",
      }),
      {
        status: overallSuccess ? 200 : 207,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
