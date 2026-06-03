# 🏗️ Construction Expense Tracking System

A modern, full-featured expense tracking application built specifically for construction projects. Track materials, contractor payments, and project expenses with real-time analytics and reporting.

## ✨ Features

### 📊 Dashboard Analytics
- **6 Key Performance Indicators (KPIs)**
  - Total Paid Amount
  - Remaining Amount
  - Transaction Count
  - Contractor Cost (Paid)
  - Material Cost
  - Total Expenses
- **3 Interactive Charts**
  - Material Cost Breakdown (Pie Chart)
  - Monthly Payment Analysis (Bar Chart)
  - Expense Trend Over Time (Area Chart)
- **Smart Filters**
  - Duration: Last Week, This Month, This Quarter, This Year, All Time
  - Area/Floor: Foundation, Ground, First Floor, Second Floor
  - Payment Status: All, Paid, Pending, Partial

### 💰 Expense Management
- **Mobile-Optimized Interface**
  - Card-based view for mobile devices
  - Table view for desktop
  - Touch-friendly action buttons
- **Quick Add Mode** - Fast expense entry with essential fields only
- **Full Form Mode** - Complete expense tracking with all details
- **Smart Filtering & Search**
  - Search across description, vendor, category
  - Filter by category, subcategory, area, date range
  - Live summary statistics

### 📈 Reports & Analytics
- **Export Capabilities**
  - Export filtered expenses to Excel
  - Download template for bulk import
- **Import Features**
  - Bulk import from Excel files
  - Data validation and error handling
- **Real-time Summaries**
  - Total expenses, paid, remaining
  - Category-wise breakdown
  - Vendor-wise analysis
  - Monthly trends

### 🏢 Management Tools
- **Category Management** - Add, edit, delete expense categories
- **Vendor Management** - Track and manage vendors/suppliers
- **Payment Methods** - Configure available payment methods
- **Budget Setting** - Set and track project budget

## 🚀 Technology Stack

### Frontend
- **React 19.2.7** - Modern UI framework
- **Material-UI 9.0.1** - Component library
- **Recharts 3.8.1** - Data visualization
- **React Router 7.16.0** - Navigation

### Backend & Database
- **Firebase/Firestore** - Real-time NoSQL database
- **Cloud Storage** - Secure file storage

### Data Handling
- **XLSX 0.18.5** - Excel import/export
- **LocalStorage Caching** - Optimized data loading

## 📁 Project Structure

```
construction-tracking/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/
│   │   └── Layout.js           # App layout with navigation
│   ├── contexts/
│   │   └── ExpenseContext.js   # Global state management
│   ├── firebase/
│   │   ├── config.js           # Firebase configuration
│   │   └── firestore.js        # Firestore utilities
│   ├── pages/
│   │   ├── Dashboard.js        # Analytics dashboard
│   │   ├── ExpenseEntry.js     # Expense CRUD operations
│   │   ├── Reports.js          # Reports & export
│   │   └── Management.js       # Settings & configuration
│   ├── utils/
│   │   └── excelUtils.js       # Excel import/export logic
│   ├── App.js                  # Main app component
│   ├── index.js                # App entry point
│   └── index.css               # Global styles
├── package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd construction-tracking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Storage (optional, for file uploads)
   - Copy your Firebase config from Project Settings
   - Update `src/firebase/config.js` with your credentials:
   
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   
   App will open at [http://localhost:3000](http://localhost:3000)

## 🎯 Usage Guide

### Adding Expenses

1. **Quick Add** (⚡ Icon)
   - Date, Category, Total Amount
   - Quantity & Unit (for materials)
   - Fast entry for on-site updates

2. **Full Form** (+ Icon)
   - All quick add fields
   - Vendor, Description
   - Paid Amount, Remaining Amount
   - Payment Method, Area/Floor
   - Payment Status, Notes

### Viewing & Filtering

- **Mobile**: Card-based view with prominent Edit/Delete buttons
- **Desktop**: Table view with all details
- Use filters to narrow down expenses by:
  - Category (Contractor, Material, Misc)
  - Sub-category (specific material types)
  - Area/Floor
  - Date range
- Search across description, vendor, category

### Importing Data

1. Go to **Reports** page
2. Click **Download Template** to get Excel format
3. Fill in your expense data
4. Click **Import from Excel** and select your file
5. Review and confirm import

### Exporting Reports

1. Apply filters on **Expense Entry** page
2. Go to **Reports** page
3. Click **Export to Excel**
4. Excel file downloads with filtered data

## ⚡ Performance Optimizations

### Smart Caching
- **5-minute cache** for Firestore data
- Automatic cache invalidation on CRUD operations
- Instant page loads from localStorage
- Manual refresh available via `refreshData()`

### Mobile Optimization
- Card-based view for touch interfaces
- Large, accessible buttons
- No horizontal scrolling
- Bottom padding for FAB buttons

### Responsive Design
- Mobile-first approach
- Breakpoints: xs (mobile), sm (tablet), md (desktop)
- Adaptive layouts and font sizes

## 📊 Data Model

### Expense Object
```javascript
{
  id: string,
  date: string,                    // YYYY-MM-DD
  category: string,                // Contractor, Material, Misc
  subCategory: string,             // Cement, Bricks, etc.
  vendor: string,
  description: string,
  quantity: number,
  unit: string,                    // bags, pcs, etc.
  totalAmount: number,
  paidAmount: number,
  remainingAmount: number,
  paymentMethod: string,           // Cash, Bank Transfer, etc.
  area: string,                    // Foundation, Ground Floor, etc.
  paymentStatus: string,           // Clear, Partial, Pending
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔒 Security Considerations

### Production Deployment
- Add Firebase Security Rules for Firestore
- Enable Authentication (optional)
- Use environment variables for Firebase config
- Enable CORS for API requests

### Recommended Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{expenseId} {
      allow read, write: if true; // Add auth checks here
    }
    match /categories/{categoryId} {
      allow read, write: if true;
    }
    match /vendors/{vendorId} {
      allow read, write: if true;
    }
  }
}
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Deploy to Other Platforms
- **Netlify**: Connect GitHub repo or drag/drop `build` folder
- **Vercel**: Import project from GitHub
- **AWS S3**: Upload `build` folder to S3 bucket

## 🧪 Testing Recommendations

Before production deployment, test:

1. **Import/Export Features**
   - Download template
   - Import sample Excel file with 10-20 expenses
   - Verify data accuracy
   - Export to Excel and verify output

2. **CRUD Operations**
   - Add expenses via Quick Add and Full Form
   - Edit existing expenses
   - Delete expenses
   - Verify Firestore sync

3. **Filters & Search**
   - Test all filter combinations
   - Verify search functionality
   - Check filtered export accuracy

4. **Responsive Design**
   - Test on mobile (< 600px)
   - Test on tablet (600-960px)
   - Test on desktop (> 960px)

5. **Cache Behavior**
   - Refresh page (should load from cache)
   - Wait 5+ minutes and refresh (should fetch from Firestore)
   - Add expense (cache should update)

## 📝 Environment Variables (Optional)

Create a `.env` file for production:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

Then update `firebase/config.js` to use these variables.

## 🐛 Troubleshooting

### Common Issues

**Firestore Connection Error**
- Check Firebase config in `src/firebase/config.js`
- Verify Firestore is enabled in Firebase Console
- Check browser console for detailed error

**Cache Not Working**
- Clear browser localStorage
- Check browser console for cache logs
- Verify `localStorage` is enabled

**Import Fails**
- Ensure Excel file matches template format
- Check for invalid date formats
- Verify numeric fields contain numbers only

**Mobile View Issues**
- Clear browser cache
- Test in Chrome DevTools mobile mode
- Check responsive breakpoints

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Support

For issues, questions, or feature requests, please open an issue on GitHub.

## 🎉 Acknowledgments

- Material-UI for the component library
- Recharts for beautiful charts
- Firebase for backend infrastructure
- React team for the awesome framework

---

**Built with ❤️ for Construction Management**
