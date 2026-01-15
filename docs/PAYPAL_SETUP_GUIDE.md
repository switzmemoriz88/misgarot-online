# 💳 PayPal Integration - הנחיות מלאות

## מתי להתחיל: במהלך השבוע (דצמבר 2025)

---

## 📋 מה צריך לעשות ב-PayPal:

### שלב 1: יצירת תוכניות מנוי

1. **היכנס ל-PayPal Business**: https://paypal.com/mep/dashboard
2. לחץ על **"כלים לעסקים"** (בתפריט הימני)
3. חפש **"מנויים"** או **"Subscriptions"**
4. צור **2 תוכניות חדשות**:

#### תוכנית 1: ניסיון חינם
```
שם: Misgarot Online - Trial 14 Days
מחיר: 0₪
תקופה: 14 יום
אחרי סיום: מנוי נסגר אוטומטית
```

#### תוכנית 2: מנוי חודשי
```
שם: Misgarot Online - Pro Monthly
מחיר: 98₪ לחודש
חיוב: אוטומטי מתחדש
ביטול: בכל עת
```

### שלב 2: קבלת Plan IDs

אחרי יצירת התוכניות, PayPal נותן **Plan ID** לכל אחת.

**צורה:** `P-5ML4271244454362WXNWU5NQ`

📝 **שמור את ה-IDs!**

---

### שלב 3: יצירת App ב-Developer Portal

1. **היכנס ל**: https://developer.paypal.com/
2. לחץ על **"Apps & Credentials"**
3. לחץ **"Create App"**
4. שם: `Misgarot Online V2`
5. סוג: **Merchant**

### שלב 4: קבלת Client ID ו-Secret

אחרי יצירת ה-App תקבל:
- **Client ID**: `AZxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Secret**: `ELxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **השיקר הוא רגיש! אל תשתף אותו!**

---

## 📝 מה לשלוח לי (Copilot):

```
Plan ID (Trial): P-xxxxxxxxxx
Plan ID (Pro): P-xxxxxxxxxx
Client ID: AZxxxxxxxxxx
Secret: ELxxxxxxxxxx
```

---

## 🔨 מה אני (Copilot) אבנה:

1. **דף תמחור/מנויים** - בחירת חבילה
2. **Route Protection** - הגנה על Dashboard
3. **PayPal Webhook** - קבלת עדכוני תשלום
4. **עדכון מנוי ב-Database** - אחרי תשלום מוצלח

---

## 🛡️ אבטחה - מה לא ישתנה:

| דבר | סטטוס |
|-----|-------|
| מנויים קיימים (מערכת ישנה) | ✅ לא נפגעים |
| עסקאות קיימות | ✅ לא נפגעות |
| יתרה בחשבון | ✅ נשארת |
| היסטוריה | ✅ נשארת |

---

## 💡 טיפים:

1. **תן שמות ברורים** - `Misgarot Online V2` כדי להבדיל מהישן
2. **אפשר להתחיל ב-Sandbox** - סביבת בדיקות לפני Live
3. **לא נוגעים בקיים** - התוכניות החדשות נפרדות לגמרי

---

## 📅 תזכורת

- [ ] יצירת תוכניות מנוי ב-PayPal
- [ ] קבלת Plan IDs
- [ ] יצירת App ב-Developer Portal
- [ ] קבלת Client ID + Secret
- [ ] שליחת הפרטים ל-Copilot

---

**נוצר:** דצמבר 2025
**עודכן:** 7/12/2025
