import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const ExpenseContext = createContext();

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within ExpenseProvider');
  }
  return context;
};

// Default categories matching Excel file structure
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Contractor', color: '#667eea', icon: '👷', subCategories: ['Payment'] },
  { id: 'cat-2', name: 'Material', color: '#FF6B6B', icon: '🏗️', subCategories: ['Rohra', 'Sand', 'Cement', 'Crush', 'Steel', 'Bricks', 'Chemical', 'Natural Sand'] },
  { id: 'cat-3', name: 'Misc', color: '#BB8FCE', icon: '📦', subCategories: ['Others', 'Transportation'] },
];

const DEFAULT_PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Check', 'Online Payment'];

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [budget, setBudget] = useState({ total: 0, categories: {} });

  // Load data from Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('🔥 Loading data from Firestore...');
        
        // Load expenses
        const expensesQuery = query(collection(db, 'expenses'), orderBy('date', 'desc'));
        const expensesSnapshot = await getDocs(expensesQuery);
        const expensesData = expensesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date || new Date().toISOString().split('T')[0]
        }));
        setExpenses(expensesData);
        console.log(`✅ Loaded ${expensesData.length} expenses from Firestore`);

        // Load categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        if (categoriesData.length > 0) {
          setCategories(categoriesData);
        }

        // Load vendors
        const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
        const vendorsData = vendorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVendors(vendorsData);

        // Load settings
        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        if (!settingsSnapshot.empty) {
          const settingsData = settingsSnapshot.docs[0].data();
          if (settingsData.paymentMethods) {
            setPaymentMethods(settingsData.paymentMethods);
          }
          if (settingsData.budget) {
            setBudget({ total: settingsData.budget, categories: {} });
          }
        }
      } catch (error) {
        console.error('❌ Error loading data from Firestore:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Expense CRUD operations
  const addExpense = async (expense) => {
    try {
      const newExpense = {
        ...expense,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'expenses'), newExpense);
      const addedExpense = { id: docRef.id, ...newExpense };
      setExpenses(prev => [addedExpense, ...prev]);
      console.log('✅ Expense added to Firestore');
      return addedExpense;
    } catch (error) {
      console.error('❌ Error adding expense:', error);
      throw error;
    }
  };

  const updateExpense = async (id, updates) => {
    try {
      const expenseRef = doc(db, 'expenses', id);
      const updatedData = { ...updates, updatedAt: new Date() };
      await updateDoc(expenseRef, updatedData);
      setExpenses(prev => prev.map(exp => 
        exp.id === id ? { ...exp, ...updatedData } : exp
      ));
      console.log('✅ Expense updated in Firestore');
    } catch (error) {
      console.error('❌ Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      console.log('✅ Expense deleted from Firestore');
    } catch (error) {
      console.error('❌ Error deleting expense:', error);
      throw error;
    }
  };

  const bulkAddExpenses = (expenseArray) => {
    const newExpenses = expenseArray.map(expense => ({
      ...expense,
      id: expense.id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: expense.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending'
    }));
    setExpenses(prev => [...newExpenses, ...prev]);
  };

  // Category operations
  const addCategory = async (category) => {
    try {
      const docRef = await addDoc(collection(db, 'categories'), category);
      const newCategory = { id: docRef.id, ...category };
      setCategories(prev => [...prev, newCategory]);
      console.log('✅ Category added to Firestore');
    } catch (error) {
      console.error('❌ Error adding category:', error);
    }
  };

  const updateCategory = async (id, updates) => {
    try {
      await updateDoc(doc(db, 'categories', id), updates);
      setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
      console.log('✅ Category updated in Firestore');
    } catch (error) {
      console.error('❌ Error updating category:', error);
    }
  };

  const deleteCategory = async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(prev => prev.filter(cat => cat.id !== id));
      console.log('✅ Category deleted from Firestore');
    } catch (error) {
      console.error('❌ Error deleting category:', error);
    }
  };

  // Vendor operations
  const addVendor = async (vendor) => {
    try {
      const docRef = await addDoc(collection(db, 'vendors'), { name: vendor, createdAt: new Date() });
      const newVendor = { id: docRef.id, name: vendor };
      setVendors(prev => [...prev, newVendor]);
      console.log('✅ Vendor added to Firestore');
    } catch (error) {
      console.error('❌ Error adding vendor:', error);
    }
  };

  const updateVendor = async (id, updates) => {
    try {
      await updateDoc(doc(db, 'vendors', id), updates);
      setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
      console.log('✅ Vendor updated in Firestore');
    } catch (error) {
      console.error('❌ Error updating vendor:', error);
    }
  };

  const deleteVendor = async (id) => {
    try {
      await deleteDoc(doc(db, 'vendors', id));
      setVendors(prev => prev.filter(v => v.id !== id));
      console.log('✅ Vendor deleted from Firestore');
    } catch (error) {
      console.error('❌ Error deleting vendor:', error);
    }
  };

  // Analytics functions (backward compatible with old 'amount' and new 'totalAmount')
  const getAmount = (exp) => parseFloat(exp.totalAmount || exp.amount) || 0;
  const getPaidAmount = (exp) => {
    // Only return paidAmount if it exists, don't fallback to total
    if (exp.paidAmount !== undefined && exp.paidAmount !== null && exp.paidAmount !== '') {
      return parseFloat(exp.paidAmount) || 0;
    }
    // If paidAmount doesn't exist but paymentStatus is Clear/Paid, assume fully paid
    if (exp.paymentStatus === 'Clear' || exp.paymentStatus === 'Paid') {
      return parseFloat(exp.totalAmount || exp.amount) || 0;
    }
    return 0;
  };
  const getRemainingAmount = (exp) => {
    if (exp.remainingAmount !== undefined && exp.remainingAmount !== null && exp.remainingAmount !== '') {
      return parseFloat(exp.remainingAmount) || 0;
    }
    // Calculate remaining from total - paid
    const total = getAmount(exp);
    const paid = getPaidAmount(exp);
    return Math.max(0, total - paid);
  };
  
  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + getAmount(exp), 0);
  };

  const getTotalPaid = () => {
    return expenses.reduce((sum, exp) => sum + getPaidAmount(exp), 0);
  };

  const getTotalRemaining = () => {
    return expenses.reduce((sum, exp) => sum + getRemainingAmount(exp), 0);
  };

  const getExpensesByCategory = () => {
    const categoryTotals = {};
    expenses.forEach(exp => {
      const cat = exp.category || 'Uncategorized';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + getAmount(exp);
    });
    return categoryTotals;
  };

  const getExpensesByVendor = () => {
    const vendorTotals = {};
    expenses.forEach(exp => {
      const vendor = exp.vendor || 'Unknown';
      vendorTotals[vendor] = (vendorTotals[vendor] || 0) + getAmount(exp);
    });
    return vendorTotals;
  };

  const getMonthlyTrend = () => {
    const monthlyData = {};
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + getAmount(exp);
    });
    return monthlyData;
  };

  const getExpensesInRange = (startDate, endDate) => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= new Date(startDate) && expDate <= new Date(endDate);
    });
  };

  const value = {
    // State
    expenses,
    categories,
    vendors,
    paymentMethods,
    budget,
    loading,
    
    // Expense operations
    addExpense,
    updateExpense,
    deleteExpense,
    bulkAddExpenses,
    
    // Category operations
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Vendor operations
    addVendor,
    updateVendor,
    deleteVendor,
    
    // Payment methods
    setPaymentMethods,
    
    // Budget
    setBudget,
    
    // Analytics
    getTotalExpenses,
    getTotalPaid,
    getTotalRemaining,
    getExpensesByCategory,
    getExpensesByVendor,
    getMonthlyTrend,
    getExpensesInRange,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};
