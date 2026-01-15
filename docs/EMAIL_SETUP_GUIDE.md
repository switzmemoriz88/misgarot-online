# 📧 הגדרת שליחת מיילים עם Resend

## מה זה Resend?
Resend הוא שירות שליחת מיילים מודרני עם API פשוט. יש להם תוכנית חינמית עם 100 מיילים ביום.

## שלב 1: יצירת חשבון Resend

1. היכנס ל-[resend.com](https://resend.com)
2. צור חשבון חדש
3. אמת את כתובת המייל שלך

## שלב 2: קבלת API Key

1. בדשבורד של Resend, לך ל-**API Keys**
2. לחץ **Create API Key**
3. העתק את ה-Key (מתחיל ב-`re_`)

## שלב 3: הגדרת Domain (אופציונלי אבל מומלץ)

כדי לשלוח מיילים מכתובת משלך (לא `onboarding@resend.dev`):

1. ב-Resend לך ל-**Domains**
2. הוסף את הדומיין שלך (לדוגמה: `misgarot.co.il`)
3. הוסף את רשומות ה-DNS שמופיעות
4. חכה לאימות

## שלב 4: הגדרת Supabase

### הוספת Secrets ל-Supabase

```bash
# בטרמינל, מתיקיית הפרויקט
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
supabase secrets set FROM_EMAIL=noreply@misgarot.co.il
supabase secrets set SITE_URL=https://misgarot.co.il
```

### או דרך הדשבורד:

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-**Settings** → **Edge Functions**
4. תחת **Secrets**, הוסף:
   - `RESEND_API_KEY` = הקוד שהעתקת
   - `FROM_EMAIL` = הכתובת לשליחה
   - `SITE_URL` = כתובת האתר

## שלב 5: Deploy ה-Edge Function

```bash
cd supabase
supabase functions deploy send-welcome-email
```

## שלב 6: בדיקה

אתה יכול לבדוק את הפונקציה עם:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-welcome-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "clientEmail": "test@example.com",
    "clientName": "לקוח בדיקה",
    "photographerName": "צלם בדיקה",
    "password": "123456"
  }'
```

---

## פתרון בעיות

### "שליחת המייל נכשלה"
- ודא שה-API Key נכון
- ודא שהדומיין מאומת (אם משתמש בדומיין משלך)
- בדוק את הלוגים ב-Supabase Dashboard → Logs → Edge Functions

### "הלקוח נוצר אבל לא קיבל מייל"
- המייל עשוי להיות בספאם
- ודא שכתובת המייל תקינה
- בדוק את ה-Dashboard של Resend לראות את סטטוס המייל

### מיילים הולכים לספאם
- הוסף את הדומיין שלך ב-Resend
- הגדר SPF, DKIM, DMARC
- השתמש בכתובת מייל אמיתית (לא noreply)

---

## תוכנית חינמית של Resend

- 100 מיילים ביום
- 3,000 מיילים בחודש
- מספיק בשביל להתחיל!

לתוכניות גדולות יותר: https://resend.com/pricing
