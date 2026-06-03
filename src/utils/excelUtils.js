import * as XLSX from 'xlsx';

/**
 * Export expenses to Excel file
 */
export const exportToExcel = (expenses, categories, vendors) => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Expenses
  const expenseData = expenses.map(exp => ({
    Date: exp.date,
    Category: exp.category,
    'Sub-Category': exp.subCategory || '',
    Vendor: exp.vendor || '',
    Description: exp.description || '',
    Amount: parseFloat(exp.amount) || 0,
    'Payment Method': exp.paymentMethod || '',
    'Created At': exp.createdAt,
  }));
  const ws1 = XLSX.utils.json_to_sheet(expenseData);
  
  // Add total row
  const totalRow = {
    Date: 'TOTAL',
    Category: '',
    'Sub-Category': '',
    Vendor: '',
    Description: '',
    Amount: expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0),
    'Payment Method': '',
    'Created At': '',
  };
  XLSX.utils.sheet_add_json(ws1, [totalRow], { skipHeader: true, origin: -1 });
  
  XLSX.utils.book_append_sheet(wb, ws1, 'Expenses');

  // Sheet 2: Category Summary
  const categoryTotals = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'Uncategorized';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (parseFloat(exp.amount) || 0);
  });
  
  const categorySummary = Object.entries(categoryTotals).map(([category, total]) => ({
    Category: category,
    'Total Amount': total,
    Percentage: ((total / expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)) * 100).toFixed(2) + '%',
  }));
  
  const ws2 = XLSX.utils.json_to_sheet(categorySummary);
  XLSX.utils.book_append_sheet(wb, ws2, 'Category Summary');

  // Sheet 3: Vendor Summary
  const vendorTotals = {};
  expenses.forEach(exp => {
    const vendor = exp.vendor || 'Unknown';
    vendorTotals[vendor] = (vendorTotals[vendor] || 0) + (parseFloat(exp.amount) || 0);
  });
  
  const vendorSummary = Object.entries(vendorTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([vendor, total]) => ({
      Vendor: vendor,
      'Total Amount': total,
      'Transaction Count': expenses.filter(exp => exp.vendor === vendor).length,
    }));
  
  const ws3 = XLSX.utils.json_to_sheet(vendorSummary);
  XLSX.utils.book_append_sheet(wb, ws3, 'Vendor Summary');

  // Sheet 4: Monthly Trend
  const monthlyData = {};
  expenses.forEach(exp => {
    const date = new Date(exp.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (parseFloat(exp.amount) || 0);
  });
  
  const monthlyTrend = Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({
      Month: month,
      'Total Amount': total,
    }));
  
  const ws4 = XLSX.utils.json_to_sheet(monthlyTrend);
  XLSX.utils.book_append_sheet(wb, ws4, 'Monthly Trend');

  // Sheet 5: Categories List
  const categoryList = categories.map(cat => ({
    Category: cat.name,
    Icon: cat.icon,
    Color: cat.color,
    'Sub-Categories': cat.subCategories.join(', '),
  }));
  const ws5 = XLSX.utils.json_to_sheet(categoryList);
  XLSX.utils.book_append_sheet(wb, ws5, 'Category List');

  // Sheet 6: Vendors List
  const vendorList = vendors.map(v => ({
    Vendor: v.name,
    Contact: v.contact || '',
    Email: v.email || '',
    Notes: v.notes || '',
  }));
  const ws6 = XLSX.utils.json_to_sheet(vendorList);
  XLSX.utils.book_append_sheet(wb, ws6, 'Vendor List');

  // Generate filename with date
  const filename = `Construction_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Write file
  XLSX.writeFile(wb, filename);
  
  return filename;
};

/**
 * Import expenses from Excel file
 */
export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Read the Expenses sheet
        const expenseSheet = workbook.Sheets['Expenses'] || workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(expenseSheet);
        
        // Transform to our expense format
        const expenses = jsonData
          .filter(row => row.Date && row.Date !== 'TOTAL') // Skip total row and invalid rows
          .map(row => ({
            date: row.Date,
            category: row.Category || 'Miscellaneous',
            subCategory: row['Sub-Category'] || '',
            vendor: row.Vendor || '',
            description: row.Description || '',
            amount: parseFloat(row.Amount) || 0,
            paymentMethod: row['Payment Method'] || 'Cash',
          }));
        
        resolve({
          success: true,
          expenses,
          count: expenses.length,
        });
      } catch (error) {
        reject({
          success: false,
          error: error.message,
        });
      }
    };
    
    reader.onerror = () => {
      reject({
        success: false,
        error: 'Failed to read file',
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Download template Excel file
 */
export const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();
  
  // Sample data
  const sampleData = [
    {
      Date: new Date().toISOString().split('T')[0],
      Category: 'Materials',
      'Sub-Category': 'Cement',
      Vendor: 'ABC Suppliers',
      Description: '50 bags of cement',
      Amount: 500,
      'Payment Method': 'Cash',
    },
    {
      Date: new Date().toISOString().split('T')[0],
      Category: 'Labor',
      'Sub-Category': 'Skilled',
      Vendor: 'John Contractor',
      Description: 'Daily wage - 5 workers',
      Amount: 750,
      'Payment Method': 'Bank Transfer',
    },
  ];
  
  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  
  XLSX.writeFile(wb, 'Construction_Expense_Template.xlsx');
};
