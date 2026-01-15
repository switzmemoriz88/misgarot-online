# 📧 הגדרת שליחת מיילים - TODO

## מתי לבצע: אחרי רכישת דומיין

---

## שלב 1: הירשם ל-Resend
- [ ] לך ל-https://resend.com/signup
- [ ] הירשם עם Google או אימייל
- [ ] לך ל-**API Keys** → **Create API Key**
- [ ] שמור את ה-API Key במקום בטוח

---

## שלב 2: הוסף את הדומיין ל-Resend
- [ ] ב-Resend Dashboard לך ל-**Domains**
- [ ] לחץ **Add Domain**
- [ ] הכנס את הדומיין שלך (למשל: `misgarot.online`)
- [ ] הוסף את רשומות ה-DNS שהם נותנים:
  - [ ] רשומת SPF (TXT)
  - [ ] רשומת DKIM (TXT)
  - [ ] רשומת DMARC (TXT - אופציונלי)
- [ ] חכה לאימות (יכול לקחת עד 24 שעות)

---

## שלב 3: עדכן את כתובת השולח בקוד
- [ ] פתח את הקובץ: `supabase/functions/send-magic-link/index.ts`
- [ ] שנה את השורה:
```typescript
from: 'Misgarot Online <onboarding@resend.dev>',
```
ל:
```typescript
from: 'Misgarot Online <noreply@YOUR-DOMAIN.com>',
```

---

## שלב 4: הוסף את ה-API Key ל-Supabase
- [ ] ב-Supabase Dashboard: **Project Settings** → **Edge Functions** → **Secrets**
- [ ] הוסף secret:
  - Name: `RESEND_API_KEY`
  - Value: (ה-API Key מ-Resend)

---

## שלב 5: העלה את ה-Edge Function
- [ ] פתח Terminal בתיקיית הפרויקט
- [ ] הריצו:
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy send-magic-link
```

---

## שלב 6: בדוק שזה עובד
- [ ] צור לקוח חדש בדף `/clients`
- [ ] בדוק אם המייל הגיע
- [ ] בדוק ב-Console אם יש שגיאות

---

## 💡 טיפים
- Resend חינמי עד 3,000 מיילים בחודש
- אימות דומיין יכול לקחת עד 24 שעות
- אפשר לעקוב אחרי מיילים שנשלחו ב-Resend Dashboard

---

## קבצים רלוונטיים
- `supabase/functions/send-magic-link/index.ts` - Edge Function לשליחת מייל
- `frontend/src/pages/ClientsPage.tsx` - קריאה ל-Function

