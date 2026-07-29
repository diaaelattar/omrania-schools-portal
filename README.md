# بوابة تجميع بيانات المدارس

نظام لتجميع بيانات دورية من المدارس عبر نماذج ديناميكية، مع تصدير إكسيل ومزامنة اختيارية مع Google Sheets. مبني بـ Next.js 14 + Supabase، ومُجهز للنشر المجاني على Vercel.

## 1) تجهيز Supabase (مجاني)

1. افتح [supabase.com](https://supabase.com) وأنشئ مشروع جديد.
2. من **SQL Editor** شغّل محتوى ملف `supabase/schema.sql` بالكامل (مرة واحدة فقط).
3. من **Project Settings → API** خد:
   - `Project URL` → هيبقى `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key (سري جدًا، متحطوش في الكود أبدًا) → هيبقى `SUPABASE_SERVICE_ROLE_KEY`

## 2) تجهيز المشروع محليًا

```bash
npm install
cp .env.example .env.local
```

افتح `.env.local` واملأ:
- `NEXT_PUBLIC_SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` من الخطوة اللي فاتت
- `SESSION_SECRET` — أي نص عشوائي طويل (مثلاً شغّل `openssl rand -base64 32`)
- `ADMIN_USERNAME` و `ADMIN_PASSWORD` — بيانات أول حساب أدمن

ثم أنشئ حساب الأدمن:

```bash
node scripts/seed-admin.js
```

جرّب محليًا:

```bash
npm run dev
```

- دخول الأدمن: `http://localhost:3000/admin/login`
- دخول المدرسة: `http://localhost:3000/school/login`

## 3) رفع المشروع على GitHub

```bash
git init
git add .
git commit -m "school data portal"
git branch -M main
git remote add origin <رابط الريبو بتاعك>
git push -u origin main
```

**تنبيه مهم:** ملف `.env.local` متضمّنش في الرفع (مُتجاهل تلقائيًا) — منعرفش نرفعه على GitHub أبدًا لأنه فيه مفاتيح سرية.

## 4) النشر على Vercel (مجاني)

1. ادخل [vercel.com](https://vercel.com) وسجّل بحساب GitHub.
2. **Add New Project** → اختر الريبو.
3. في **Environment Variables** ضيف نفس المتغيرات اللي في `.env.local` (كلها، ماعدا حاجة).
4. اضغط **Deploy**.

بعد النشر، الموقع هيبقى شغال على رابط زي `your-project.vercel.app`. تقدر تربطه بدومين مجاني أو دومين خاص بيك لاحقًا من إعدادات Vercel.

## 5) الاستخدام اليومي

### إضافة مدرسة جديدة
من `/admin/schools` → أدخل كود واسم المدرسة، اسم مستخدم، وكلمة مرور مبدئية. المدرسة هتتطلب منها تغييرها أول ما تدخل.

### فتح فترة تجميع بيانات جديدة
من `/admin/forms` → أنشئ نموذج جديد وحدد الحقول المطلوبة بصيغة JSON (فيه مثال جاهز في الصفحة). لما تخلص الفترة اضغط "إيقاف" بدل ما تحذف النموذج عشان تفضل البيانات محفوظة.

أنواع الحقول المتاحة حاليًا: `text`, `number`, `textarea`, `select` (لازم `options`), `date`. لو احتجت نوع حقل جديد (رفع ملف، اختيار متعدد...) قولّي وأضيفه في الكود.

### تصدير البيانات
من `/admin/submissions` اختر النموذج → زرار "تصدير إلى إكسيل" بيحمّلك ملف `.xlsx` فوري فيه كل الردود.

### مزامنة تلقائية مع Google Sheets (اختياري)
لو عايز شيت جوجل يتحدث لوحده مع كل عملية إرسال:
1. اعمل Google Cloud Service Account وفعّل Google Sheets API.
2. شارك الشيت بتاعك مع إيميل الـ Service Account (صلاحية Editor).
3. املأ `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID` في متغيرات البيئة (محليًا وعلى Vercel).
لو سبتها فاضية، الميزة دي بتتجاهل تلقائيًا والنظام بيشتغل عادي بتصدير الإكسيل بس.

## هيكل المشروع باختصار

```
app/
  admin/        صفحات لوحة تحكم الأدمن
  school/       صفحات المدرسة
  api/          كل الـ API routes (auth, schools, forms, submissions, export)
  components/   عناصر مشتركة (نموذج ديناميكي، زرار خروج)
lib/            أدوات مساعدة (auth, supabase, xlsx, google sheets)
supabase/       ملف الـ schema
scripts/        سكريبت إنشاء أول أدمن
```
