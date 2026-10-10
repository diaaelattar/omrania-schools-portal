-- ============================================================
-- تفعيل / إنشاء نموذج إحصاء نسب الحضور والغياب اليومي للتعليم الابتدائي
-- يدعم نظام 5 أيام العادي ونظام التناوب (4 & 2)
-- لتفعيله: شغّل هذا الكود في Supabase SQL Editor
-- ============================================================

INSERT INTO form_templates (slug, title, description, schema, is_active)
VALUES (
  'daily-attendance',
  'إحصاء نسب الحضور والغياب اليومي للطلاب',
  'استمارة تسجيل الحضور والغياب اليومي لصفوف المرحلة الابتدائية (الأول حتى السادس) - تدعم نظام 5 أيام العادي ونظام التناوب 4 & 2',
  '{
    "fields": [
      { "key": "attendance_date", "label": "تاريخ اليوم الدراسي", "type": "date", "required": true },
      
      { "key": "grade1_total", "label": "الصف الأول: إجمالي المقيدين", "type": "number", "required": true },
      { "key": "grade1_present", "label": "الصف الأول: عدد الحاضرين", "type": "number", "required": true },
      { "key": "grade1_absent", "label": "الصف الأول: عدد الغياب", "type": "number", "required": false },

      { "key": "grade2_total", "label": "الصف الثاني: إجمالي المقيدين", "type": "number", "required": true },
      { "key": "grade2_present", "label": "الصف الثاني: عدد الحاضرين", "type": "number", "required": true },
      { "key": "grade2_absent", "label": "الصف الثاني: عدد الغياب", "type": "number", "required": false },

      { "key": "grade3_total", "label": "الصف الثالث: إجمالي المقيدين", "type": "number", "required": true },
      { "key": "grade3_present", "label": "الصف الثالث: عدد الحاضرين", "type": "number", "required": true },
      { "key": "grade3_absent", "label": "الصف الثالث: عدد الغياب", "type": "number", "required": false },

      { "key": "grade4_total", "label": "الصف الرابع: إجمالي المقيدين", "type": "number", "required": true },
      { "key": "grade4_present", "label": "الصف الرابع: عدد الحاضرين", "type": "number", "required": true },
      { "key": "grade4_absent", "label": "الصف الرابع: عدد الغياب", "type": "number", "required": false },

      { "key": "grade5_total", "label": "الصف الخامس: إجمالي المقيدين", "type": "number", "required": true },
      { "key": "grade5_present", "label": "الصف الخامس: عدد الحاضرين", "type": "number", "required": true },
      { "key": "grade5_absent", "label": "الصف الخامس: عدد الغياب", "type": "number", "required": false },

      { "key": "grade6_total", "label": "الصف السادس: إجمالي المقيدين", "type": "number", "required": true },
      { "key": "grade6_present", "label": "الصف السادس: عدد الحاضرين", "type": "number", "required": true },
      { "key": "grade6_absent", "label": "الصف السادس: عدد الغياب", "type": "number", "required": false },

      { "key": "notes", "label": "ملاحظات إضافية حول اليوم الدراسي", "type": "textarea", "required": false }
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

-- التأكد من تفعيل أي نموذج يحمل اسم الغياب أو الحضور
UPDATE form_templates 
SET is_active = true, updated_at = now()
WHERE title LIKE '%الغياب%' OR title LIKE '%الحضور%';
