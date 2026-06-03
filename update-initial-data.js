const fs = require('fs');

// Read the initialData.js file
const filePath = './src/data/initialData.js';
let content = fs.readFileSync(filePath, 'utf8');

// Function to add area and paymentStatus to each expense
function processExpense(expenseStr) {
  try {
    // Parse the expense object
    const obj = JSON.parse(expenseStr);
    
    // Extract area from description or notes if present
    let area = "Foundation"; // Default
    const desc = (obj.description || '') + ' ' + (obj.notes || '');
    if (desc.includes('Ground')) area = "Ground Floor";
    else if (desc.includes('First')) area = "First Floor";
    else if (desc.includes('Second')) area = "Second Floor";
    else if (desc.includes('Foundation')) area = "Foundation";
    
    // Extract payment status from notes
    let paymentStatus = "Paid"; // Default
    const notes = obj.notes || '';
    if (notes.includes('Unpaid') || notes.includes('PENDING')) paymentStatus = "Unpaid";
    else if (notes.includes('Partial')) paymentStatus = "Partial";
    else if (notes.includes('Clear') || notes.includes('Paid')) paymentStatus = "Paid";
    
    // Add fields if they don't exist
    if (!obj.area) obj.area = area;
    if (!obj.paymentStatus) obj.paymentStatus = paymentStatus;
    
    // Return formatted object
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    console.error('Error processing expense:', e);
    return expenseStr;
  }
}

// Find and replace all expense objects
const expenseRegex = /\{\s*"id":[^}]+\}/gs;
content = content.replace(expenseRegex, (match) => {
  return processExpense(match);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Updated all expenses with area and paymentStatus fields!');
