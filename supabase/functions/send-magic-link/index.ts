// =====================================================
// 📧 Send Magic Link Email - Edge Function
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  clientName: string
  magicLink: string
  photographerName?: string
  eventDate?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, clientName, magicLink, photographerName, eventDate }: EmailRequest = await req.json()

    if (!to || !clientName || !magicLink) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, clientName, magicLink' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format event date if provided
    const formattedDate = eventDate 
      ? new Date(eventDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : ''

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Misgarot Online <onboarding@resend.dev>',
        to: [to],
        subject: `${photographerName || 'הצלם שלך'} מזמין אותך לעצב את המסגרת שלך! 💒`,
        html: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💒 מסגרות אונליין</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">הזמנה לעיצוב המסגרת שלך</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">שלום ${clientName}! 👋</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                ${photographerName ? `<strong>${photographerName}</strong> הזמין אותך` : 'הוזמנת'} לעצב את מסגרת המגנטים לאירוע שלך!
              </p>
              
              ${eventDate ? `
              <div style="background-color: #fdf4ff; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #a855f7; margin: 0; font-size: 14px;">📅 תאריך האירוע</p>
                <p style="color: #7c3aed; margin: 8px 0 0 0; font-size: 24px; font-weight: bold;">${formattedDate}</p>
              </div>
              ` : ''}
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                לחץ על הכפתור למטה כדי להיכנס למערכת ולהתחיל לעצב:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold;">
                      🎨 התחל לעצב
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #9ca3af; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
                הקישור תקף ל-7 ימים
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                מסגרות אונליין - עיצוב מסגרות מגנטים בקלות
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                אם לא ביקשת את המייל הזה, אפשר להתעלם ממנו
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: data }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Email sent successfully:', data)
    
    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
