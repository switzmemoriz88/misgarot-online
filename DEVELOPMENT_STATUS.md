# 📊 Misgarot Online - סטטוס פיתוח

> עודכן לאחרונה: 17 בינואר 2026

---

## ✅ מה עובד (Production Ready)

### 🔐 אימות והרשאות
- [x] התחברות עם אימייל וסיסמה
- [x] התחברות עם Google OAuth
- [x] הרשמה חדשה עם אימות מייל
- [x] שכחתי סיסמה
- [x] AuthContext מרכזי
- [x] ProtectedRoute / AdminRoute
- [x] התנתקות

### 👥 ניהול משתמשים
- [x] טבלת users ב-Supabase
- [x] תפקידים: admin / photographer / client
- [x] פרופיל משתמש (שם, טלפון, עסק)
- [x] דף הגדרות פרופיל

### 🖼️ עורך מסגרות (Editor)
- [x] Canvas עם React Konva
- [x] מצב רוחב (2500×1875)
- [x] מצב אורך (1875×2500)
- [x] הוספת טקסט, תמונות, צורות
- [x] גרירה, סיבוב, שינוי גודל
- [x] Undo/Redo
- [x] שכבות (Layers Panel)
- [x] מסגרות נעולות (isLocked)
- [x] ייצוא ל-PNG

### 🗂️ גלריית מסגרות
- [x] טבלת frames ב-Supabase
- [x] קטגוריות אירועים
- [x] תצוגת מסגרות
- [x] סינון לפי קטגוריה

### 📦 Storage
- [x] Buckets: frames, designs, avatars, exports, logos
- [x] העלאת תמונות
- [x] תמונות ממוזערות (thumbnails)

---

## 🔄 בפיתוח (In Progress)

### 📧 שליחת מיילים
- [x] Edge Function send-designs
- [ ] אינטגרציה מלאה עם Resend
- [ ] תבניות מייל יפות
- [ ] מעקב אחר שליחות

### 👥 ניהול לקוחות
- [x] טבלת clients
- [x] הוספת לקוח חדש
- [ ] Share Link - קישור קסם ללקוח
- [ ] פורטל לקוחות מלא

### 🎨 אלמנטים (Elements)
- [x] טבלת element_categories
- [x] טבלת elements
- [x] UI ניהול באדמין
- [ ] העלאת אלמנטים
- [ ] גלריית אלמנטים בעורך

### 💳 מנויים (Subscriptions)
- [x] טבלת subscriptions
- [x] אינטגרציית PayPal (חלקית)
- [ ] Webhook לעדכון סטטוס
- [ ] דף מחירים פעיל

---

## 📋 לביצוע (TODO)

### עדיפות גבוהה 🔴
1. [ ] Share Link ללקוחות - שליחה ידנית עם קישור
2. [ ] ייצוא והורדת עיצובים
3. [ ] שמירת עיצובים למסד נתונים

### עדיפות בינונית 🟡
4. [ ] Dashboard סטטיסטיקות
5. [ ] ניהול הזמנות
6. [ ] לוגו עסק בעיצובים

### עדיפות נמוכה 🟢
7. [ ] Dark mode
8. [ ] ייבוא מ-Canva/PSD
9. [ ] תבניות מוכנות

---

## 🗄️ מבנה מסד נתונים (Supabase)

### טבלאות פעילות
| טבלה | תיאור | סטטוס |
|------|--------|--------|
| users | משתמשים (צלמים, אדמין, לקוחות) | ✅ |
| categories | קטגוריות אירועים | ✅ |
| frames | מסגרות מעוצבות | ✅ |
| clients | לקוחות של צלמים | ✅ |
| designs | עיצובים שנשמרו | ✅ |
| orders | הזמנות ושליחות | ✅ |
| subscriptions | מנויים PayPal | ✅ |
| element_categories | קטגוריות אלמנטים | ✅ |
| elements | אלמנטים גרפיים | ✅ |
| email_logs | לוג שליחת מיילים | ✅ |

### Storage Buckets
| Bucket | תיאור | פומבי |
|--------|--------|-------|
| frames | מסגרות מוכנות | ✅ |
| designs | עיצובי משתמשים | ❌ |
| avatars | תמונות פרופיל | ✅ |
| exports | קבצים לשליחה | ❌ |
| logos | לוגואים | ✅ |
| elements | אלמנטים גרפיים | ✅ |

---

## 🔧 הגדרות נדרשות

### Environment Variables (Frontend)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_PAYPAL_CLIENT_ID=xxx
```

### Supabase
- Project: misgarot-online
- Region: Europe (Frankfurt)
- Auth: Email + Google OAuth

---

## 📝 הערות חשובות

1. **אלמנטים נעולים (isLocked)** - מסגרות נשארות במקום, לא עוברות בין מצבי רוחב/אורך
2. **Session Storage** - עיצובים נשמרים ב-sessionStorage עד שמירה למסד
3. **RLS Policies** - כל הטבלאות מוגנות, משתמש רואה רק את שלו

---

## 🚀 להרצה מקומית

```bash
cd frontend
npm install
npm run dev
```

פתח: http://localhost:5173
