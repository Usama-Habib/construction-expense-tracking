const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('Construction Cost.xlsx');
const worksheet = workbook.Sheets['Expense Entries'];
const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log(`Found ${jsonData.length} rows in Expense Entries`);

// Transform to complete expense format
const expenses = jsonData
  .filter(row => row['Total Amount'] && row['Total Amount'] > 0)
  .map((row, index) => {
    // Parse Excel date (days since 1900)
    let dateStr = '2026-01-01';
    if (row['Date']) {
      const excelDate = XLSX.SSF.parse_date_code(row['Date']);
      dateStr = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
    }
    
    return {
      id: `exp-${index + 1}`,
      entryId: row['Entry ID'] || (index + 1),
      date: dateStr,
      category: row['Main Category'] || '',
      subCategory: row['Subcategory'] || '',
      area: row['Area/Section'] || '',
      description: row['Description'] || '',
      vendor: row['Vendor'] || '',
      quantity: row['Quantity'] || '',
      unit: row['Unit'] || '',
      rate: row['Rate'] || '',
      totalAmount: parseFloat(row['Total Amount']) || 0,
      paidAmount: parseFloat(row['Paid Amount']) || 0,
      remainingAmount: parseFloat(row['Remaining Amount']) || 0,
      paymentStatus: row['Payment Status'] || 'Unpaid',
      paymentMethod: row['Payment Method'] || '',
      notes: row['Notes'] || '',
      cumulativeExpense: parseFloat(row['Cumulative Expense']) || 0
    };
  });

console.log(`\nProcessed ${expenses.length} valid expenses`);
console.log(`Total Amount: $${expenses.reduce((sum, e) => sum + e.totalAmount, 0).toLocaleString()}`);
console.log(`Total Paid: $${expenses.reduce((sum, e) => sum + e.paidAmount, 0).toLocaleString()}`);
console.log(`Total Remaining: $${expenses.reduce((sum, e) => sum + e.remainingAmount, 0).toLocaleString()}`);

// Sample expense
if (expenses.length > 0) {
  console.log('\nSample expense with ALL fields:');
  console.log(JSON.stringify(expenses[0], null, 2));
}

// Extract unique vendors
const vendors = [...new Set(expenses.map(e => e.vendor).filter(v => v))].map(name => ({
  id: `vendor-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name: name
}));

// Create output file
const output = {
  expenses,
  vendors,
  stats: {
    totalExpenses: expenses.length,
    totalAmount: expenses.reduce((sum, e) => sum + e.totalAmount, 0),
    totalPaid: expenses.reduce((sum, e) => sum + e.paidAmount, 0),
    totalRemaining: expenses.reduce((sum, e) => sum + e.remainingAmount, 0)
  }
};

// Save to JSON file
fs.writeFileSync(
  'complete-expenses.json',
  JSON.stringify(output, null, 2)
);

// Create initialData.js with complete fields
const jsContent = `// Complete expense data from Construction Cost.xlsx
// Includes ALL fields: Quantity, Unit, Rate, Paid Amount, Remaining Amount, Cumulative
// Total: ${expenses.length} expenses

export const INITIAL_EXPENSES = ${JSON.stringify(expenses, null, 2)};

export const INITIAL_VENDORS = ${JSON.stringify(vendors, null, 2)};
`;

fs.writeFileSync('src/data/initialData.js', jsContent);

console.log('\n✓ Created complete-expenses.json');
console.log('✓ Updated src/data/initialData.js with ALL fields');
console.log(`\nNext step: Update the app to use these new fields!`);
