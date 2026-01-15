// סקריפט פינג ל-Supabase למניעת השבתה
// מריץ קריאת GET ל-API פעם ביום (להרצה ב-cron או ידנית)

const fetch = require('node-fetch');

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co/rest/v1/health'; // שנה לכתובת שלך
const SUPABASE_API_KEY = 'YOUR_ANON_KEY'; // שנה למפתח שלך

async function pingSupabase() {
  try {
    const res = await fetch(SUPABASE_URL, {
      headers: {
        'apikey': SUPABASE_API_KEY,
        'Authorization': `Bearer ${SUPABASE_API_KEY}`,
      },
    });
    if (res.ok) {
      console.log('Supabase ping successful:', await res.text());
    } else {
      console.error('Supabase ping failed:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Error pinging Supabase:', err);
  }
}

pingSupabase();
