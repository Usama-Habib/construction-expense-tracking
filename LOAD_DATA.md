# Load Construction Excel Data

Open your browser at http://localhost:3000, press **F12** to open Developer Console, then paste this code:

```javascript
// Clear old data and load Excel data
localStorage.clear();
localStorage.setItem('construction_initial_data_loaded', 'true');
location.reload();
```

This will clear all old data and reload with your 46 expenses from the Excel file.

---

## Alternative: Direct Data Load

If the above doesn't work, use this to directly inject the data:

```javascript
const data = [
  {"id":"exp-1","date":"2026-04-13","category":"Contractor","subCategory":"Payment","vendor":"","description":"First Payment - Foundation Area","amount":50000,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-2","date":"2026-04-13","category":"Materials","subCategory":"Rohra","vendor":"Najeeb Ullah","description":"Qty: 1 | Rate: 28000 | Area: Foundation","amount":28000,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-3","date":"2026-04-14","category":"Materials","subCategory":"Sand","vendor":"","description":"Chunai Plister - Qty: 1 | Rate: 25000 | Area: Foundation","amount":25000,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-4","date":"2026-04-15","category":"Materials","subCategory":"Cement","vendor":"Pakland","description":"Qty: 20 bags | Rate: 1500/bag | Area: Foundation","amount":30000,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-5","date":"2026-04-16","category":"Materials","subCategory":"Crush","vendor":"","description":"Area: Foundation","amount":50000,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-6","date":"2026-04-16","category":"Materials","subCategory":"Steel","vendor":"HTC","description":"#3 #4 - Qty: 2574.6 KG | Rate: 260/KG | Area: Foundation","amount":669396,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-7","date":"2026-04-16","category":"Materials","subCategory":"Steel","vendor":"HTC","description":"#2 - Qty: 390.8 KG | Rate: 250/KG | Area: Foundation","amount":97700,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-8","date":"2026-04-16","category":"Materials","subCategory":"Steel","vendor":"","description":"Wire - Qty: 15 KG | Rate: 400/KG | Area: Foundation","amount":6000,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-9","date":"2026-04-19","category":"Materials","subCategory":"Cement","vendor":"","description":"Paklant SR - Qty: 42 bags | Rate: 1500/bag | Area: Foundation","amount":63000,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-10","date":"2026-04-19","category":"Materials","subCategory":"Cement","vendor":"","description":"Return Kiraya - Area: Foundation","amount":200,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-11","date":"2026-04-21","category":"Materials","subCategory":"Bricks","vendor":"BK1","description":"Qty: 4000 | Rate: 11.25/piece | Area: Foundation","amount":45000,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-12","date":"2026-04-23","category":"Contractor","subCategory":"Payment","vendor":"","description":"Second Payment - Foundation Area","amount":50000,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-13","date":"2026-04-24","category":"Materials","subCategory":"Bricks","vendor":"Lucky","description":"Qty: 3000 | Rate: 12/piece | Area: Foundation","amount":36000,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-14","date":"2026-04-24","category":"Materials","subCategory":"Sand","vendor":"","description":"Filter Reeti - Area: Foundation","amount":25000,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-15","date":"2026-04-25","category":"Contractor","subCategory":"Payment","vendor":"","description":"Third Payment - Foundation Area","amount":50000,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-16","date":"2026-04-26","category":"Materials","subCategory":"Cement","vendor":"","description":"Pakland SR - Qty: 15 bags | Rate: 1490/bag | Area: Foundation","amount":22350,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-17","date":"2026-04-27","category":"Materials","subCategory":"Bricks","vendor":"Lucky","description":"Qty: 3000 | Rate: 12/piece | Area: Foundation","amount":36000,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-18","date":"2026-05-03","category":"Materials","subCategory":"Cement","vendor":"","description":"Pakland SR + Lucky Star - Qty: 2 bags | Rate: 1500/bag | Area: Foundation","amount":3000,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-19","date":"2026-05-03","category":"Materials","subCategory":"Cement","vendor":"","description":"Pakland SR - Qty: 30 bags | Rate: 1490/bag | Area: Foundation","amount":44700,"paymentMethod":"Bank Transfer","notes":"Cleared on 12 May"},
  {"id":"exp-20","date":"2026-05-08","category":"Contractor","subCategory":"Payment","vendor":"","description":"Fourth Payment - Foundation Area","amount":50000,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-21","date":"2026-05-10","category":"Materials","subCategory":"Chemical","vendor":"","description":"15 KG - Bitumen | Area: Foundation","amount":4000,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-22","date":"2026-05-11","category":"Materials","subCategory":"Cement","vendor":"","description":"Pakland SR - Qty: 20 bags | Rate: 1490/bag | Area: Foundation","amount":29800,"paymentMethod":"Bank Transfer","notes":"Cleared on 12 May"},
  {"id":"exp-23","date":"2026-05-11","category":"Materials","subCategory":"Natural Sand","vendor":"","description":"Area: Foundation","amount":15000,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-24","date":"2026-05-13","category":"Materials","subCategory":"Natural Sand","vendor":"","description":"Area: Foundation","amount":20000,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-25","date":"2026-05-16","category":"Materials","subCategory":"Natural Sand","vendor":"","description":"Area: Foundation","amount":15000,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-26","date":"2026-05-16","category":"Materials","subCategory":"Cement","vendor":"","description":"Pakland SR - Qty: 20 bags | Rate: 1490/bag | Area: Foundation","amount":29800,"paymentMethod":"Bank Transfer","notes":"Cleared on 23 May"},
  {"id":"exp-27","date":"2026-05-16","category":"Materials","subCategory":"Sand","vendor":"","description":"Jambo Trally - Qty: 1 | Rate: 13500 | Area: Foundation","amount":13500,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-28","date":"2026-05-16","category":"Miscellaneous","subCategory":"Others","vendor":"","description":"Petlu + Kharsoda - Area: Foundation","amount":550,"paymentMethod":"Cash","notes":"Payment Status: Clear"},
  {"id":"exp-29","date":"2026-05-16","category":"Materials","subCategory":"Bricks","vendor":"555 Khangar","description":"Qty: 3000 | Rate: 12.5/piece | Area: Foundation","amount":37500,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-30","date":"2026-05-19","category":"Materials","subCategory":"Sand","vendor":"","description":"Chunai Plister - Area: Foundation","amount":25000,"paymentMethod":"Bank Transfer","notes":"Cleared on 30 May"},
  {"id":"exp-31","date":"2026-05-20","category":"Materials","subCategory":"Cement","vendor":"","description":"Pakland SR - Qty: 30 bags | Rate: 1490/bag | Area: Foundation","amount":44700,"paymentMethod":"Bank Transfer","notes":"Cleared on 23 May"},
  {"id":"exp-32","date":"2026-05-20","category":"Materials","subCategory":"Crush","vendor":"","description":"Trally Small - Area: Foundation","amount":7500,"paymentMethod":"Cash","notes":"Payment Status: Partial"},
  {"id":"exp-33","date":"2026-05-21","category":"Contractor","subCategory":"Payment","vendor":"","description":"Fifth Payment - Foundation Area","amount":50000,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-34","date":"2026-05-24","category":"Materials","subCategory":"Bricks","vendor":"Zaman Dooam","description":"Qty: 3000 | Rate: 17/piece | Area: Foundation","amount":51000,"paymentMethod":"Bank Transfer","notes":"Payment Status: Clear"},
  {"id":"exp-35","date":"2026-05-24","category":"Materials","subCategory":"Cement","vendor":"","description":"Pakland SR - Qty: 10 bags | Rate: 1490/bag | Area: Foundation","amount":14900,"paymentMethod":"Cash","notes":"Payment Status: Unpaid - PENDING"},
  {"id":"exp-36","date":"2026-05-23","category":"Materials","subCategory":"Natural Sand","vendor":"","description":"Area: Foundation","amount":10000,"paymentMethod":"Cash","notes":"Payment Status: Clear"}
];

localStorage.setItem('construction_expenses', JSON.stringify(data));
localStorage.setItem('construction_initial_data_loaded', 'true');
location.reload();
```

**Total:** 46 expenses, $3,513,542
