-- ============================================================
-- تفعيل / إنشاء إحصاء العاملين وإمكانيات المبنى
-- شغّل هذا الكود في Supabase SQL Editor لتفعيل النموذج مباشرة
-- ============================================================

INSERT INTO form_templates (slug, title, description, schema, is_active)
VALUES (
  'staff-building-census',
  'إحصاء العاملين وإمكانيات المبنى',
  'استمارة تجميع بيانات القوى البشرية (المعلمين والإداريين والعمال) ومرافق وإمكانيات المبنى المدرسي للعام الحالي',
  '{
    "fields": [
      { "key": "classrooms_count", "label": "عدد الفصول الدراسية بالمدرسة", "type": "number", "required": true },
      { "key": "labs_count", "label": "عدد المعامل وقاعات التطوير", "type": "number", "required": true },
      { "key": "admin_rooms_count", "label": "عدد الغرف والمكاتب الإدارية", "type": "number", "required": true },
      { "key": "building_status", "label": "الحالة الإنشائية للمبنى", "type": "select", "options": ["ممتاز", "جيد", "يحتاج صيانة بسيطة", "يحتاج صيانة شاملة"], "required": true },
      { "key": "internet_status", "label": "حالة شبكة الإنترنت والاتصالات", "type": "select", "options": ["متصل ويعمل بكفاءة", "متصل وبه أعطال", "غير متوفر"], "required": true },
      { "key": "appointed_teachers", "label": "إجمالي المعلمين المعينين (أساسي)", "type": "number", "required": true },
      { "key": "contract_teachers", "label": "معلمي الحصة والمتعاقدين", "type": "number", "required": false },
      { "key": "administrators_count", "label": "إجمالي الإداريين", "type": "number", "required": true },
      { "key": "workers_count", "label": "إجمالي العمال والخدمات المعاونة", "type": "number", "required": true },
      { "key": "notes", "label": "ملاحظات إضافية أو عجز التخصصات بالمدرسة", "type": "textarea", "required": false }
    ]
  }'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    schema = EXCLUDED.schema,
    is_active = true,
    updated_at = now();

-- التأكد من تفعيل أي نموذج يحمل اسم العاملين أو المبنى لو كان مسجلاً بـ slug مختلف
UPDATE form_templates 
SET is_active = true, updated_at = now()
WHERE title LIKE '%العاملين%' OR title LIKE '%المبنى%';
