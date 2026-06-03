// Migration script to import complete Excel data to Firestore
// Run this ONCE after setting up Firebase configuration

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

// Firebase configuration (matches src/firebase/config.js)
const firebaseConfig = {
  apiKey: "AIzaSyAA8gaIW_6mWrF5AVnea24y9Wm41LivslA",
  authDomain: "expensetracking-4d4ae.firebaseapp.com",
  projectId: "expensetracking-4d4ae",
  storageBucket: "expensetracking-4d4ae.firebasestorage.app",
  messagingSenderId: "939383424247",
  appId: "1:939383424247:web:9226a882fe4bad02417ff2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Read complete expense data
const data = JSON.parse(readFileSync('./complete-expenses.json', 'utf8'));

const migrateToFirestore = async () => {
  console.log('🚀 Starting Firebase migration...\n');

  try {
    // Import Expenses
    console.log('📊 Importing expenses...');
    let expenseCount = 0;
    for (const expense of data.expenses) {
      await addDoc(collection(db, 'expenses'), {
        ...expense,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      expenseCount++;
      if (expenseCount % 10 === 0) {
        console.log(`   Imported ${expenseCount}/${data.expenses.length} expenses...`);
      }
    }
    console.log(`✅ Imported ${expenseCount} expenses\n`);

    // Import Vendors
    console.log('🏪 Importing vendors...');
    const vendors = data.vendors || [];
    for (const vendor of vendors) {
      await addDoc(collection(db, 'vendors'), {
        name: vendor,
        createdAt: new Date()
      });
    }
    console.log(`✅ Imported ${vendors.length} vendors\n`);

    // Import Categories (matching Excel)
    console.log('📂 Importing categories...');
    const categories = [
      { 
        name: 'Contractor', 
        color: '#667eea', 
        icon: '👷', 
        subCategories: ['Payment'] 
      },
      { 
        name: 'Material', 
        color: '#FF6B6B', 
        icon: '🏗️', 
        subCategories: ['Rohra', 'Sand', 'Cement', 'Crush', 'Steel', 'Bricks', 'Chemical', 'Natural Sand'] 
      },
      { 
        name: 'Misc', 
        color: '#BB8FCE', 
        icon: '📦', 
        subCategories: ['Others', 'Transportation'] 
      }
    ];

    for (const category of categories) {
      await addDoc(collection(db, 'categories'), category);
    }
    console.log(`✅ Imported ${categories.length} categories\n`);

    // Import Settings
    console.log('⚙️ Setting up app settings...');
    await setDoc(doc(db, 'settings', 'app'), {
      budget: 2000000,
      currency: 'USD',
      paymentMethods: ['Cash', 'Bank Transfer', 'Check', 'Credit Card'],
      areas: ['Foundation', 'Ground', 'First', 'Second'],
      paymentStatuses: ['Pending', 'Clear', 'Partial'],
      lastUpdated: new Date()
    });
    console.log('✅ App settings configured\n');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✨ MIGRATION COMPLETE! ✨');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Expenses:   ${expenseCount}`);
    console.log(`🏪 Vendors:    ${vendors.length}`);
    console.log(`📂 Categories: ${categories.length}`);
    console.log('═══════════════════════════════════════');
    console.log('\n💡 Next steps:');
    console.log('1. Update src/firebase/config.js with your Firebase credentials');
    console.log('2. The app will now use Firestore instead of localStorage');
    console.log('3. All your Excel data is preserved in the cloud!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateToFirestore();
