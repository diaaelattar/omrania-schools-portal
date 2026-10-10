-- ============================================================
-- إضافة تصنيف نوع المدرسة (رسمي / خاص)
-- تشغيل هذا الكود في Supabase SQL Editor
-- ============================================================

-- 1. إضافة عمود type مع القيمة الافتراضية 'public' (رسمي)
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'public';

-- 2. التأكد من قيد التحقق (إما public أو private)
ALTER TABLE schools 
DROP CONSTRAINT IF EXISTS schools_type_check;

ALTER TABLE schools 
ADD CONSTRAINT schools_type_check CHECK (type IN ('public', 'private'));

-- 3. إنشاء فهرس لتسريع عمليات الفرز والتصفية
CREATE INDEX IF NOT EXISTS idx_schools_type ON schools(type);
