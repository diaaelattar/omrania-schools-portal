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
    'تاريخ الإرسال': submission.submitted_at
      ? new Date(submission.submitted_at).toLocaleString('ar-EG')
      : '',
  };
  for (const field of fields) {
    const value = submission.data?.[field.key];
    row[field.label] = Array.isArray(value) ? value.join('، ') : (value ?? '');
  }
  return row;
}
