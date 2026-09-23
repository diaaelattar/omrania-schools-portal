// السكريبت لتفعيل أو إنشاء نموذج إحصاء العاملين وإمكانيات المبنى
// التشغيل: node scripts/activate-census.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('❌ متغيرات البيئة غير مكتملة في .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log('🔄 جاري البحث عن نماذج الإحصاء المتعلقة بالعاملين أو المبنى...');

  const { data: existingForms, error: searchErr } = await supabase
    .from('form_templates')
    .select('id, slug, title, is_active')
    .or('title.ilike.%العاملين%,title.ilike.%المبنى%');

  if (searchErr) {
    console.error('❌ خطأ أثناء البحث:', searchErr.message);
  }

  if (existingForms && existingForms.length > 0) {
    for (const f of existingForms) {
      const { error: updErr } = await supabase
        .from('form_templates')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', f.id);
      if (updErr) {
        console.error(`❌ فشل تفعيل "${f.title}":`, updErr.message);
      } else {
        console.log(`✅ تم تفعيل النموذج القائم: "${f.title}" (${f.slug})`);
      }
    }
    return;
  }

  console.log('ℹ️ لم يتم العثور على نموذج قائم، جاري إنشاء نموذج إحصاء العاملين وإمكانيات المبنى...');

  const schema = {
    fields: [
      { key: 'classrooms_count', label: 'عدد الفصول الدراسية بالمدرسة', type: 'number', required: true },
      { key: 'labs_count', label: 'عدد المعامل وقاعات التطوير', type: 'number', required: true },
      { key: 'admin_rooms_count', label: 'عدد الغرف والمكاتب الإدارية', type: 'number', required: true },
      { key: 'building_status', label: 'الحالة الإنشائية للمبنى', type: 'select', options: ['ممتاز', 'جيد', 'يحتاج صيانة بسيطة', 'يحتاج صيانة شاملة'], required: true },
      { key: 'internet_status', label: 'حالة شبكة الإنترنت والاتصالات', type: 'select', options: ['متصل ويعمل بكفاءة', 'متصل وبه أعطال', 'غير متوفر'], required: true },
      { key: 'appointed_teachers', label: 'إجمالي المعلمين المعينين (أساسي)', type: 'number', required: true },
      { key: 'contract_teachers', label: 'معلمي الحصة والمتعاقدين', type: 'number', required: false },
      { key: 'administrators_count', label: 'إجمالي الإداريين', type: 'number', required: true },
      { key: 'workers_count', label: 'إجمالي العمال والخدمات المعاونة', type: 'number', required: true },
      { key: 'notes', label: 'ملاحظات إضافية أو عجز التخصصات بالمدرسة', type: 'textarea', required: false }
    ]
  };

  const { data: newForm, error: insErr } = await supabase
    .from('form_templates')
    .insert({
      slug: 'staff-building-census',
      title: 'إحصاء العاملين وإمكانيات المبنى',
      description: 'استمارة تجميع بيانات القوى البشرية (المعلمين والإداريين والعمال) ومرافق وإمكانيات المبنى المدرسي للعام الحالي',
      schema,
      is_active: true
    })
    .select('id, title')
    .single();

  if (insErr) {
    console.error('❌ فشل إنشاء النموذج:', insErr.message);
  } else {
    console.log(`✅ تم إنشاء وتفعيل نموذج جديد بنجاح: "${newForm.title}" (ID: ${newForm.id})`);
  }
}

main().catch((err) => {
  console.error('❌ خطأ غير متوقع:', err.message);
  process.exit(1);
});
