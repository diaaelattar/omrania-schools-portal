import * as XLSX from 'xlsx';

// rows: array of plain objects (each key becomes a column header)
export function buildXlsxBuffer(rows, sheetName = 'Data') {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// Flattens a submission row (school info + dynamic form answers) into one object
// ready for json_to_sheet, using the form's field labels as column headers.
export function flattenSubmission(fields, submission, school) {
  const row = {
    'كود المدرسة': school?.code || '',
    'اسم المدرسة': school?.name || '',
    'نوع المدرسة': school?.type === 'private' ? 'خاص' : 'رسمي',
    'تاريخ الإرسال': submission.submitted_at
      ? new Date(submission.submitted_at).toLocaleString('ar-EG')
      : '',
  };
  for (const field of fields) {
    const value = submission.data?.[field.key];
    row[field.label] = Array.isArray(value) ? value.join('، ') : (value ?? '');
  }
  if (submission.data?._rest_grades && Array.isArray(submission.data._rest_grades) && submission.data._rest_grades.length > 0) {
    row['صفوف الراحة (نظام 4 & 2)'] = submission.data._rest_grades.join(' + ');
  } else if (submission.data?._operating_system) {
    row['صفوف الراحة (نظام 4 & 2)'] = 'حضور كامل (لا يوجد راحة)';
  }
  return row;
}
