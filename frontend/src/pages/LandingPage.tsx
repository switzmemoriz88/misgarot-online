import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuthContext } from '../contexts';

/**
 * Landing Page - דף מכירה לצלמים
 * עמוד הבית הראשי עם כל המידע על המוצר
 */

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user, profile, isAdmin } = useAuthContext();

  // FAQ items
  const faqs = [
    {
      question: 'מה זה מסגרת מגנט?',
      answer: 'מסגרת מגנט היא מוצר פופולרי באירועים - תמונה מודפסת עם מגנט בגב, שהאורחים יכולים לקחת הביתה ולתלות על המקרר. זו מתנה יפה שמזכירה את האירוע.',
    },
    {
      question: 'איך עובד העורך?',
      answer: 'העורך שלנו פשוט ואינטואיטיבי. בוחרים קטגוריה (חתונה, בר מצווה וכו\'), בוחרים מסגרת מוכנה, מוסיפים טקסט ותמונות, ומייצאים קובץ מוכן להדפסה.',
    },
    {
      question: 'באיזה פורמטים אפשר לייצא?',
      answer: 'תומכים ב-PNG באיכות גבוהה להדפסה, PDF לשליחה לבית דפוס, וגם ZIP עם כל הקבצים לנוחיות.',
    },
    {
      question: 'האם אפשר לשמור עיצובים ולחזור אליהם?',
      answer: 'כן! כל העיצובים נשמרים אוטומטית. אפשר גם לשמור עיצוב כתבנית אישית לשימוש חוזר באירועים דומים.',
    },
    {
      question: 'האם יש תמיכה בעברית?',
      answer: 'כמובן! המערכת בנויה מהיסוד לעברית - RTL מלא, פונטים עבריים, וממשק בעברית.',
    },
    {
      question: 'האם אפשר לבטל בכל עת?',
      answer: 'כן! אין התחייבות. אפשר לבטל את המנוי בכל רגע מהגדרות החשבון. המנוי ימשיך עד סוף התקופה ששולמה.',
    },
    {
      question: 'מה קורה אחרי 14 יום ניסיון?',
      answer: 'אחרי 14 יום ניסיון חינם, המנוי מתחיל באופן אוטומטי ב-98₪ לחודש. תקבל תזכורת לפני סיום תקופת הניסיון.',
    },
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'יוסי כהן',
      role: 'צלם אירועים',
      image: '👨‍💼',
      text: 'חוסך לי שעות עבודה בכל אירוע. התבניות מקצועיות והעורך פשוט לשימוש.',
    },
    {
      name: 'מיכל לוי',
      role: 'סטודיו לצילום',
      image: '👩‍💼',
      text: 'עברנו מעיצוב ידני בפוטושופ ל-Misgarot Online. הלקוחות מרוצים והעבודה הרבה יותר יעילה.',
    },
    {
      name: 'דוד אברהם',
      role: 'צלם חתונות',
      image: '👨‍💼',
      text: 'האפשרות לשמור תבניות אישיות היא גאונית. יצרתי סט לכל סוג אירוע ועכשיו העבודה זורמת.',
    },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 border-2 border-indigo-600 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" className="stroke-indigo-600" />
                  <circle cx="12" cy="12" r="3" className="stroke-purple-500" />
                  <path d="M3 9h18M3 15h18M9 3v18M15 3v18" className="stroke-indigo-400" strokeWidth="1" opacity="0.5" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Misgarot Online
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">יתרונות</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">מחירים</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">שאלות נפוצות</a>
            </div>
            
            <div className="flex items-center gap-3">
              {user ? (
                // משתמש מחובר
                <>
                  <Link to="/categories" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    עיצוב מסגרת
                  </Link>
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">
                      {isAdmin ? '👑' : '👤'}
                    </span>
                    <span>
                      {profile?.business_name || profile?.name || user.email?.split('@')[0]}
                    </span>
                    {isAdmin && (
                      <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">Admin</span>
                    )}
                  </Link>
                </>
              ) : (
                // משתמש לא מחובר
                <>
                  <Link to="/categories" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    נסה בחינם
                  </Link>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    התחברות
                  </Link>
                  <Link 
                    to="/login" 
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    הרשמה
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
                <span>✨</span>
                <span>הכלי המוביל לצלמי אירועים בישראל</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                עיצוב מסגרות מגנט
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  בקלות ובמהירות
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                תבניות מוכנות לכל אירוע, עורך חכם ואינטואיטיבי,
                <br />
                וייצוא באיכות מקצועית - הכל במקום אחד.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/login" 
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-center"
                >
                  הרשמה - 14 יום חינם →
                </Link>
                <Link 
                  to="/categories"
                  className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-medium text-lg rounded-xl border-2 border-gray-200 transition-all text-center"
                >
                  🎨 התחל לעצב בלי הרשמה
                </Link>
              </div>
              
              <div className="flex items-center gap-6 mt-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  ללא כרטיס אשראי
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  ללא התחייבות
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  ביטול בכל עת
                </div>
              </div>
            </div>
            
            {/* Hero Image/Demo - Magnet Frame Illustration */}
            <div className="relative">
              {/* Main Frame Container */}
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl p-6 md:p-10 shadow-2xl">
                {/* The Magnet Frame */}
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-white">
                  {/* Frame Content - Wedding Photo Simulation */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 relative overflow-hidden">
                    {/* Decorative Corner Elements */}
                    <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-rose-300 rounded-tl-lg opacity-60"></div>
                    <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-rose-300 rounded-tr-lg opacity-60"></div>
                    <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-rose-300 rounded-bl-lg opacity-60"></div>
                    <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-rose-300 rounded-br-lg opacity-60"></div>
                    
                    {/* Couple Illustration */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center transform -translate-y-4">
                        {/* Couple Icons */}
                        <div className="flex items-end justify-center gap-1 mb-4">
                          {/* Bride */}
                          <div className="relative">
                            <div className="text-6xl md:text-7xl">👰</div>
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                              <span className="text-lg">💕</span>
                            </div>
                          </div>
                          {/* Groom */}
                          <div className="text-6xl md:text-7xl">🤵</div>
                        </div>
                        
                        {/* Hearts floating - repositioned */}
                        <div className="absolute top-6 left-12 text-pink-400 text-xl animate-pulse">❤</div>
                        <div className="absolute top-12 right-14 text-rose-300 text-lg animate-pulse delay-100">💗</div>
                      </div>
                    </div>
                    
                    {/* Names and Date at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-transparent pt-12 pb-5 text-center px-4">
                      <div className="font-serif text-2xl md:text-3xl font-bold text-gray-800 tracking-wide flex flex-col items-center" dir="ltr">
                        <div>Sarah <span className="text-rose-400 mx-1">&</span> David</div>
                        <div className="text-gray-500 font-light tracking-widest text-sm mt-1">25.12.2025</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 animate-bounce">
                <span className="text-2xl">✨</span>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 animate-pulse">
                <span className="text-2xl">🎨</span>
              </div>
              <div className="absolute top-1/2 -left-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform -rotate-12">
                מוכן להדפסה!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600">500+</div>
              <div className="text-gray-600">צלמים פעילים</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">50,000+</div>
              <div className="text-gray-600">עיצובים נוצרו</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">200+</div>
              <div className="text-gray-600">תבניות מוכנות</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">4.9⭐</div>
              <div className="text-gray-600">דירוג ממוצע</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              למה צלמים בוחרים ב-Misgarot Online?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              הכלי שנבנה במיוחד עבור צלמי אירועים בישראל
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                ✨
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">תבניות מקצועיות</h3>
              <p className="text-gray-600">
                מאות תבניות מוכנות לכל סוג אירוע - חתונות, בר/בת מצווה, בריתות, ימי הולדת ועוד.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                🎨
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">עורך חכם</h3>
              <p className="text-gray-600">
                גרור ושחרר, שנה צבעים, הוסף טקסט ותמונות. ממשק פשוט שכל אחד יכול להשתמש.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                📱
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">רוחב + אורך</h3>
              <p className="text-gray-600">
                עיצוב מסגרת רוחב ואורך באותו סגנון - מושלם לכל סוגי התמונות.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                📤
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">ייצוא מקצועי</h3>
              <p className="text-gray-600">
                PNG באיכות גבוהה להדפסה, PDF לבית דפוס, הכל בלחיצת כפתור.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                💾
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">שמירה אוטומטית</h3>
              <p className="text-gray-600">
                העיצובים נשמרים אוטומטית. אף פעם לא תאבד עבודה.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-6">
                🇮🇱
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">בנוי לעברית</h3>
              <p className="text-gray-600">
                ממשק מלא בעברית, תמיכה ב-RTL, פונטים עבריים איכותיים.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              איך זה עובד?
            </h2>
            <p className="text-xl text-gray-600">
              3 צעדים פשוטים לעיצוב מקצועי
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                1️⃣
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">בחר קטגוריה</h3>
              <p className="text-gray-600">
                חתונה, בר מצווה, יום הולדת - בחר את סוג האירוע
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                2️⃣
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">בחר מסגרת</h3>
              <p className="text-gray-600">
                עשרות עיצובים מוכנים לכל קטגוריה - בחר את המושלם
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                3️⃣
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">התאם וייצא</h3>
              <p className="text-gray-600">
                הוסף טקסט, שנה צבעים, וייצא קובץ מוכן להדפסה
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link 
              to="/categories" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              🎨 התחל לעצב עכשיו - בלי הרשמה
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              מה אומרים הצלמים?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="text-4xl mb-4">"</div>
                <p className="text-gray-700 mb-6">{testimonial.text}</p>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - תמחור פשוט וברור */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              חבילה אחת. הכל כלול.
            </h2>
            <p className="text-xl text-gray-600">
              14 יום ניסיון חינם, אחר כך 98₪ לחודש
            </p>
          </div>
          
          {/* Single Pricing Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6">
                ✨ 14 יום ניסיון חינם
              </div>
              <div className="mb-4">
                <span className="text-6xl md:text-7xl font-bold">₪98</span>
                <span className="text-xl text-white/80">/לחודש</span>
              </div>
              <p className="text-white/80 text-lg">
                ללא התחייבות • ביטול בכל עת
              </p>
            </div>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {[
                'עיצובים ללא הגבלה',
                'כל התבניות הפרימיום',
                'ייצוא PNG + PDF באיכות גבוהה',
                'ללא סימן מים',
                'שמירת תבניות אישיות',
                'גישה לכל הקטגוריות',
                'שמירה אוטומטית',
                'תמיכה בעברית מלאה',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </div>
            
            {/* CTA Button */}
            <Link 
              to="/login"
              className="block w-full py-4 bg-white text-indigo-600 font-bold text-xl rounded-xl hover:bg-gray-100 transition-all text-center shadow-lg"
            >
              הרשמה - 14 יום חינם →
            </Link>
            
            <p className="text-center text-white/80 text-sm mt-4">
              ✓ ללא כרטיס אשראי &nbsp;•&nbsp; ✓ ללא התחייבות &nbsp;•&nbsp; ✓ ביטול בכל עת
            </p>
            
            {/* Try without signup */}
            <div className="text-center mt-6 pt-6 border-t border-white/20">
              <Link 
                to="/categories"
                className="text-white/90 hover:text-white underline transition-colors"
              >
                🎨 או התחל לעצב עכשיו בלי הרשמה
              </Link>
            </div>
          </div>
          
          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>תשלום מאובטח</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>ביטול בכל עת</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <span>ללא התחייבות</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              שאלות נפוצות
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-right"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            מוכן להתחיל לעצב?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            הצטרף למאות צלמים שכבר משתמשים ב-Misgarot Online
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/categories" 
              className="px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-xl hover:bg-gray-100 transition-all shadow-lg"
            >
              התחל עיצוב בחינם
            </Link>
            <Link 
              to="/login" 
              className="px-8 py-4 bg-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-all border-2 border-white/30"
            >
              יש לי כבר חשבון
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🖼️</span>
                <span className="text-xl font-bold">Misgarot Online</span>
              </div>
              <p className="text-gray-400">
                הכלי המוביל לעיצוב מסגרות מגנט לצלמי אירועים בישראל
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">מוצר</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">יתרונות</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">מחירים</a></li>
                <li><Link to="/categories" className="hover:text-white transition-colors">התחל עכשיו</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">תמיכה</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#faq" className="hover:text-white transition-colors">שאלות נפוצות</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">צור קשר</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">מדריכים</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">משפטי</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/terms" className="hover:text-white transition-colors">תנאי שימוש</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">מדיניות פרטיות</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 Misgarot Online. כל הזכויות שמורות.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
