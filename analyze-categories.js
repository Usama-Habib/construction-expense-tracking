const data = require('./complete-expenses.json');

const subs = {};
data.expenses.forEach(e => {
  if (!subs[e.category]) subs[e.category] = new Set();
  if (e.subCategory) subs[e.category].add(e.subCategory);
});

console.log('Categories and Subcategories from Excel:\n');
Object.keys(subs).forEach(cat => {
  console.log(`${cat}:`);
  [...subs[cat]].forEach(sub => console.log(`  - ${sub}`));
  console.log('');
});
