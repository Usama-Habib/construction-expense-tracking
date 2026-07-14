import * as XLSX from 'xlsx';
import { richTextToPlainText } from './richTextUtils';

// Helper functions to calculate amounts (same as Dashboard/ExpenseEntry)
const getAmount = (exp) => parseFloat(exp.totalAmount || exp.amount) || 0;
const getPaidAmount = (exp) => {
  if (exp.paidAmount !== undefined && exp.paidAmount !== null && exp.paidAmount !== '') {
    return parseFloat(exp.paidAmount) || 0;
  }
  if (exp.paymentStatus === 'Clear' || exp.paymentStatus === 'Paid') {
    return parseFloat(exp.totalAmount || exp.amount) || 0;
  }
  return 0;
};
const getRemainingAmount = (exp) => {
  if (exp.remainingAmount !== undefined && exp.remainingAmount !== null && exp.remainingAmount !== '') {
    return parseFloat(exp.remainingAmount) || 0;
  }
  const total = getAmount(exp);
  const paid = getPaidAmount(exp);
  return total - paid;
};

/**
 * Apply styling to worksheet
 */
const applyWorksheetStyling = (worksheet, range) => {
  const headerRange = XLSX.utils.decode_range(range);
  
  // Apply bold to header row
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
  }
  
  // Apply borders to all cells
  for (let row = headerRange.s.r; row <= headerRange.e.r; row++) {
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) continue;
      
      if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
      worksheet[cellAddress].s.border = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      };
    }
  }
  
  // Set column widths
  const colWidths = [];
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    colWidths.push({ wch: 15 });
  }
  worksheet['!cols'] = colWidths;
  
  return worksheet;
};

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
    'Area/Floor': exp.area || '',
    Vendor: exp.vendor || '',
    Notes: richTextToPlainText(exp.notesHtml || exp.notes || exp.description || ''),
    'Has Image': exp.imageData ? 'Yes' : 'No',
    'Image Size KB': exp.imageSizeKb || '',
    Quantity: exp.quantity || '',
    'Total Amount': getAmount(exp),
    'Paid Amount': getPaidAmount(exp),
    'Remaining Amount': getRemainingAmount(exp),
    'Payment Status': exp.paymentStatus || '',
    'Payment Method': exp.paymentMethod || '',
    'Created At': exp.createdAt,
  }));
  const ws1 = XLSX.utils.json_to_sheet(expenseData);
  
  // Add total row
  const totalRow = {
    Date: 'TOTAL',
    Category: '',
    'Sub-Category': '',
    'Area/Floor': '',
    Vendor: '',
    Notes: '',
    'Has Image': '',
    'Image Size KB': '',
    Quantity: '',
    'Total Amount': expenses.reduce((sum, exp) => sum + getAmount(exp), 0),
    'Paid Amount': expenses.reduce((sum, exp) => sum + getPaidAmount(exp), 0),
    'Remaining Amount': expenses.reduce((sum, exp) => sum + getRemainingAmount(exp), 0),
    'Payment Status': '',
    'Payment Method': '',
    'Created At': '',
  };
  XLSX.utils.sheet_add_json(ws1, [totalRow], { skipHeader: true, origin: -1 });
  
  // Apply styling
  const range1 = ws1['!ref'];
  applyWorksheetStyling(ws1, range1);
  
  XLSX.utils.book_append_sheet(wb, ws1, 'Expenses');

  // Sheet 2: Category Summary
  const categoryTotals = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'Uncategorized';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + getAmount(exp);
  });
  
  const grandTotal = expenses.reduce((sum, exp) => sum + getAmount(exp), 0);
  const categorySummary = Object.entries(categoryTotals).map(([category, total]) => ({
    Category: category,
    'Total Amount': total,
    Percentage: ((total / grandTotal) * 100).toFixed(2) + '%',
  }));
  
  const ws2 = XLSX.utils.json_to_sheet(categorySummary);
  const range2 = ws2['!ref'];
  applyWorksheetStyling(ws2, range2);
  XLSX.utils.book_append_sheet(wb, ws2, 'Category Summary');

  // Sheet 3: Vendor Summary
  const vendorTotals = {};
  expenses.forEach(exp => {
    const vendor = exp.vendor || 'Unknown';
    vendorTotals[vendor] = (vendorTotals[vendor] || 0) + getAmount(exp);
  });
  
  const vendorSummary = Object.entries(vendorTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([vendor, total]) => ({
      Vendor: vendor,
      'Total Amount': total,
      'Transaction Count': expenses.filter(exp => exp.vendor === vendor).length,
    }));
  
  const ws3 = XLSX.utils.json_to_sheet(vendorSummary);
  const range3 = ws3['!ref'];
  applyWorksheetStyling(ws3, range3);
  XLSX.utils.book_append_sheet(wb, ws3, 'Vendor Summary');

  // Sheet 4: Monthly Trend
  const monthlyData = {};
  expenses.forEach(exp => {
    const date = new Date(exp.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + getAmount(exp);
  });
  
  const monthlyTrend = Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({
      Month: month,
      'Total Amount': total,
    }));
  
  const ws4 = XLSX.utils.json_to_sheet(monthlyTrend);
  const range4 = ws4['!ref'];
  applyWorksheetStyling(ws4, range4);
  XLSX.utils.book_append_sheet(wb, ws4, 'Monthly Trend');

  // Sheet 5: Categories List
  const categoryList = categories.map(cat => ({
    Category: cat.name,
    Icon: cat.icon,
    Color: cat.color,
    'Sub-Categories': (cat.subCategories || [])
      .map((sub) => (typeof sub === 'string' ? sub : sub.name))
      .filter(Boolean)
      .join(', '),
    'Disabled Sub-Categories': (cat.subCategories || [])
      .filter((sub) => typeof sub === 'object' && sub.enabled === false)
      .map((sub) => sub.name)
      .join(', '),
  }));
  const ws5 = XLSX.utils.json_to_sheet(categoryList);
  const range5 = ws5['!ref'];
  applyWorksheetStyling(ws5, range5);
  XLSX.utils.book_append_sheet(wb, ws5, 'Category List');

  // Sheet 6: Vendors List
  const vendorList = vendors.map(v => ({
    Vendor: v.name,
    Contact: v.contact || '',
    Email: v.email || '',
    Notes: v.notes || '',
  }));
  const ws6 = XLSX.utils.json_to_sheet(vendorList);
  const range6 = ws6['!ref'];
  applyWorksheetStyling(ws6, range6);
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
            area: row['Area/Floor'] || '',
            vendor: row.Vendor || '',
            notes: row.Notes || row.Description || '',
            notesHtml: row.Notes || row.Description || '',
            quantity: row.Quantity || '',
            totalAmount: parseFloat(row['Total Amount']) || parseFloat(row.Amount) || 0,
            paidAmount: parseFloat(row['Paid Amount']) || 0,
            remainingAmount: parseFloat(row['Remaining Amount']) || 0,
            paymentStatus: row['Payment Status'] || 'Pending',
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
      'Area/Floor': 'Foundation',
      Vendor: 'ABC Suppliers',
      Notes: '50 bags of cement',
      'Has Image': 'No',
      'Image Size KB': '',
      Quantity: '50 bags',
      'Total Amount': 500,
      'Paid Amount': 300,
      'Remaining Amount': 200,
      'Payment Status': 'Pending',
      'Payment Method': 'Cash',
    },
    {
      Date: new Date().toISOString().split('T')[0],
      Category: 'Labor',
      'Sub-Category': 'Skilled',
      'Area/Floor': 'Ground',
      Vendor: 'John Contractor',
      Notes: 'Daily wage - 5 workers',
      'Has Image': 'No',
      'Image Size KB': '',
      Quantity: '5 workers',
      'Total Amount': 750,
      'Paid Amount': 750,
      'Remaining Amount': 0,
      'Payment Status': 'Clear',
      'Payment Method': 'Bank Transfer',
    },
  ];
  
  const ws = XLSX.utils.json_to_sheet(sampleData);
  const range = ws['!ref'];
  applyWorksheetStyling(ws, range);
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  
  XLSX.writeFile(wb, 'Construction_Expense_Template.xlsx');
};
