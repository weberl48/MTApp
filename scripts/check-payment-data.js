const XLSX = require('xlsx');
const path = require('path');

const workbook = XLSX.readFile(path.join(__dirname, '../../May Creative Arts Session Tracker (Responses) (2).xlsx'));

console.log('=== Checking for payment/invoice data in Excel ===\n');

// Look at first few sheets for payment columns
workbook.SheetNames.slice(0, 5).forEach(sheetName => {
  console.log(`\n--- Sheet: ${sheetName} ---`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (data.length > 0) {
    console.log('Headers/First row:', data[0]);
    console.log('\nSample rows with numbers:');

    // Look for rows with dollar amounts
    for (let i = 1; i < Math.min(5, data.length); i++) {
      const row = data[i];
      const numbersInRow = row.filter(cell => {
        const num = parseFloat(cell);
        return !isNaN(num) && num > 0 && num < 500;
      });
      if (numbersInRow.length > 0) {
        console.log(`Row ${i}:`, row);
        console.log('  Numbers found:', numbersInRow);
      }
    }
  }
});

// Check for common payment-related column patterns
console.log('\n\n=== Scanning all sheets for payment patterns ===');
const paymentPatterns = [];

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  data.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      const str = String(cell);
      // Look for dollar amounts or payment-related text
      if (str.match(/\$\d+/) || str.match(/paid|invoice|payment|amount|total|cost/i)) {
        paymentPatterns.push({
          sheet: sheetName,
          row: rowIdx,
          col: colIdx,
          value: str.substring(0, 100)
        });
      }
    });
  });
});

console.log(`Found ${paymentPatterns.length} potential payment references`);
paymentPatterns.slice(0, 20).forEach(p => {
  console.log(`  ${p.sheet}[${p.row},${p.col}]: ${p.value}`);
});

// Look at the numeric columns to understand payment structure
console.log('\n\n=== Analyzing numeric columns ===');
const sheet1 = workbook.Sheets[workbook.SheetNames[0]];
const data1 = XLSX.utils.sheet_to_json(sheet1, { header: 1, defval: '' });

// Collect all numeric values by column
const numericByCol = {};
data1.forEach((row, rowIdx) => {
  row.forEach((cell, colIdx) => {
    const num = parseFloat(cell);
    if (!isNaN(num) && num > 0 && num < 1000) {
      if (!numericByCol[colIdx]) numericByCol[colIdx] = [];
      numericByCol[colIdx].push(num);
    }
  });
});

Object.keys(numericByCol).forEach(col => {
  const nums = numericByCol[col];
  if (nums.length > 3) {
    const unique = [...new Set(nums)].sort((a, b) => a - b);
    console.log(`Column ${col}: ${nums.length} values, unique: ${unique.slice(0, 10).join(', ')}${unique.length > 10 ? '...' : ''}`);
  }
});
