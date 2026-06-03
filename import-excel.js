const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const filePath = process.argv[2] || 'Construction Cost.xlsx';
console.log(`Reading Excel file: ${filePath}`);

const workbook = XLSX.readFile(filePath);
console.log(`Found sheets: ${workbook.SheetNames.join(', ')}`);

// Process all sheets
const allData = {};

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== Processing sheet: ${sheetName} ===`);
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  console.log(`Found ${jsonData.length} rows`);
  if (jsonData.length > 0) {
    console.log('Sample row:', JSON.stringify(jsonData[0], null, 2));
    console.log('Columns:', Object.keys(jsonData[0]).join(', '));
  }
  
  allData[sheetName] = jsonData;
});

// Transform data to match app format
const expenses = [];
let expenseId = 1;

// Try to find the main expenses data
Object.keys(allData).forEach(sheetName => {
  const data = allData[sheetName];
  
  data.forEach(row => {
    // Try to identify expense rows (look for date and amount columns)
    const dateKeys = Object.keys(row).filter(k => 
      k.toLowerCase().includes('date') || 
      k.toLowerCase().includes('تاریخ')
    );
    
    const amountKeys = Object.keys(row).filter(k => 
      k.toLowerCase().includes('amount') || 
      k.toLowerCase().includes('cost') || 
      k.toLowerCase().includes('price') || 
      k.toLowerCase().includes('total') ||
      k.toLowerCase().includes('رقم') ||
      k.toLowerCase().includes('قیمت')
    );
    
    const categoryKeys = Object.keys(row).filter(k => 
      k.toLowerCase().includes('category') || 
      k.toLowerCase().includes('item') || 
      k.toLowerCase().includes('description') ||
      k.toLowerCase().includes('قسم')
    );
    
    const quantityKeys = Object.keys(row).filter(k => 
      k.toLowerCase().includes('quantity') || 
      k.toLowerCase().includes('qty') || 
      k.toLowerCase().includes('count') ||
      k.toLowerCase().includes('تعداد')
    );
    
    const notesKeys = Object.keys(row).filter(k => 
      k.toLowerCase().includes('note') || 
      k.toLowerCase().includes('remark') || 
      k.toLowerCase().includes('comment') ||
      k.toLowerCase().includes('نوٹ')
    );
    
    // If we found potential columns, create an expense record
    if (amountKeys.length > 0 && row[amountKeys[0]]) {
      const dateValue = dateKeys.length > 0 ? row[dateKeys[0]] : null;
      const amountValue = row[amountKeys[0]];
      
      // Skip if amount is not a number or is 0
      const amount = parseFloat(String(amountValue).replace(/[^\d.-]/g, ''));
      if (isNaN(amount) || amount === 0) return;
      
      // Parse date
      let parsedDate = new Date().toISOString().split('T')[0];
      if (dateValue) {
        try {
          if (typeof dateValue === 'number') {
            // Excel date number
            const excelDate = XLSX.SSF.parse_date_code(dateValue);
            parsedDate = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
          } else {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              parsedDate = date.toISOString().split('T')[0];
            }
          }
        } catch (e) {
          console.log('Date parse error:', e.message);
        }
      }
      
      // Build description from all fields
      let description = '';
      const category = categoryKeys.length > 0 ? String(row[categoryKeys[0]]) : 'Materials';
      
      // Add all non-empty fields to description
      Object.keys(row).forEach(key => {
        if (row[key] && 
            !amountKeys.includes(key) && 
            !dateKeys.includes(key) &&
            String(row[key]).trim() !== '') {
          description += `${key}: ${row[key]} | `;
        }
      });
      
      // Get quantity if available
      const quantity = quantityKeys.length > 0 ? row[quantityKeys[0]] : '';
      if (quantity) {
        description = `Qty: ${quantity} | ` + description;
      }
      
      // Get notes
      const notes = notesKeys.length > 0 ? row[notesKeys[0]] : '';
      if (notes) {
        description += `Notes: ${notes}`;
      }
      
      description = description.replace(/\s*\|\s*$/, '').trim();
      
      expenses.push({
        id: expenseId++,
        date: parsedDate,
        category: category || 'Materials',
        subCategory: '',
        vendor: row.Vendor || row.Supplier || row.supplier || '',
        description: description || 'Imported from Excel',
        amount: amount,
        paymentMethod: row['Payment Method'] || row.Payment || 'Cash',
        createdAt: new Date().toISOString(),
      });
    }
  });
});

// Output results
console.log(`\n=== CONVERSION COMPLETE ===`);
console.log(`Total expenses extracted: ${expenses.length}`);
console.log(`Total amount: $${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}`);

// Save to JSON file
const outputPath = path.join(__dirname, 'imported-expenses.json');
fs.writeFileSync(outputPath, JSON.stringify(expenses, null, 2));
console.log(`\nData saved to: ${outputPath}`);

// Show sample
if (expenses.length > 0) {
  console.log('\nSample expense:');
  console.log(JSON.stringify(expenses[0], null, 2));
}

// Generate initialization code
const initCode = `
// Add this to ExpenseContext.js or create an initialData.js file
export const initialExpenses = ${JSON.stringify(expenses, null, 2)};
`;

const initPath = path.join(__dirname, 'initialExpenses.js');
fs.writeFileSync(initPath, initCode);
console.log(`\nInitialization code saved to: ${initPath}`);
