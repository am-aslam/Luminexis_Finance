import XLSX from 'xlsx';
import path from 'path';

const excelPath = path.resolve('../../Luminexis_Expenses_Report.xlsx');
console.log('Reading Excel from:', excelPath);

try {
  const workbook = XLSX.readFile(excelPath);
  console.log('Sheets found:', workbook.SheetNames);

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);
    console.log(`\n--- Sheet: ${sheetName} (${json.length} rows) ---`);
    if (json.length > 0) {
      console.log('Rows:');
      console.log(JSON.stringify(json, null, 2));
    }
  });
} catch (err) {
  console.error('Error reading excel file:', err.message);
}
