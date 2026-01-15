# הגדרת תבניות אימייל ב-Supabase

## שלב 1: לך ל-Supabase Dashboard

## שלב 2: עבור ל-Authentication → Email Templates

## שלב 3: בחר "Confirm signup" והחלף ל:

### Subject:
```
✨ אמת את החשבון שלך - Misgarot Online
```

### Body (HTML):
העתק את התוכן מהקובץ `confirm_signup.html`

---

## אם אתה בפיתוח לוקאלי (localhost):

### אפשרות 1: בטל אימות אימייל (מומלץ לפיתוח)
1. Authentication → Providers → Email
2. כבה "Confirm email"
3. עכשיו משתמשים יוכלו להתחבר ישירות

### אפשרות 2: השתמש ב-Inbucket (לבדיקות)
Supabase מריץ Inbucket באופן לוקאלי בכתובת:
http://localhost:54324

שם תוכל לראות את כל האימיילים שנשלחים.

---

## בפרודקשן:

### הגדר SMTP אמיתי:
1. לך ל-Project Settings → Auth
2. גלול ל-SMTP Settings
3. הזן את פרטי השרת שלך:
   - Host: smtp.gmail.com (או ספק אחר)
   - Port: 587
   - User: your-email@gmail.com
   - Password: App Password מ-Google

### מומלץ: Resend, SendGrid, או Mailgun
- קל להגדרה
- מחירים סבירים
- תמיכה בתבניות HTML

---

## לבדיקה מיידית:

רוצה לבדוק את המערכת בלי אימות אימייל?
1. לך ל-Supabase Dashboard
2. Authentication → Users
3. לחץ על המשתמש שלך
4. לחץ "Confirm user" ידנית
