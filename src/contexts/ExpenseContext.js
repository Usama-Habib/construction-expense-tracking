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

// Cache configuration
const CACHE_KEY = 'expense_cache';
const CACHE_TIMESTAMP_KEY = 'expense_cache_timestamp';
const CACHE_EXPIRY_MINUTES = 5; // Cache expires after 5 minutes

// Cache helper functions
const getCachedData = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cachedData || !timestamp) {
      return null;
    }
    
    const cacheAge = Date.now() - parseInt(timestamp);
    const cacheExpiryMs = CACHE_EXPIRY_MINUTES * 60 * 1000;
    
    if (cacheAge > cacheExpiryMs) {
      console.log('⚠️ Cache expired, will fetch from Firestore');
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }
    
    console.log(`✅ Using cached data (age: ${Math.floor(cacheAge / 1000)}s)`);
    return JSON.parse(cachedData);
  } catch (error) {
    console.error('❌ Error reading cache:', error);
    return null;
  }
};

const setCachedData = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log('✅ Data cached successfully');
  } catch (error) {
    console.error('❌ Error setting cache:', error);
  }
};

const clearCache = () => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  console.log('🗑️ Cache cleared');
};

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [budget, setBudget] = useState({ total: 0, categories: {} });
  const [lastSync, setLastSync] = useState(null);

  // Load data from Firestore or cache
  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Try to use cached data first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          setExpenses(cachedData.expenses || []);
          setCategories(cachedData.categories || DEFAULT_CATEGORIES);
          setVendors(cachedData.vendors || []);
          setPaymentMethods(cachedData.paymentMethods || DEFAULT_PAYMENT_METHODS);
          setBudget(cachedData.budget || { total: 0, categories: {} });
          setLastSync(new Date(parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY))));
          setLoading(false);
          return;
        }
      }
      
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
      const finalCategories = categoriesData.length > 0 ? categoriesData : DEFAULT_CATEGORIES;
      setCategories(finalCategories);

      // Load vendors
      const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
      const vendorsData = vendorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVendors(vendorsData);

      // Load settings
      let finalPaymentMethods = DEFAULT_PAYMENT_METHODS;
      let finalBudget = { total: 0, categories: {} };
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      if (!settingsSnapshot.empty) {
        const settingsData = settingsSnapshot.docs[0].data();
        if (settingsData.paymentMethods) {
          finalPaymentMethods = settingsData.paymentMethods;
          setPaymentMethods(settingsData.paymentMethods);
        }
        if (settingsData.budget) {
          finalBudget = { total: settingsData.budget, categories: {} };
          setBudget(finalBudget);
        }
      }

      // Cache the loaded data
      setCachedData({
        expenses: expensesData,
        categories: finalCategories,
        vendors: vendorsData,
        paymentMethods: finalPaymentMethods,
        budget: finalBudget
      });
      setLastSync(new Date());
      
    } catch (error) {
      console.error('❌ Error loading data from Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const refreshData = async () => {
    console.log('🔄 Manual refresh triggered');
    clearCache();
    await loadData(true);
  };

  // Load data on mount
  useEffect(() => {
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
      const updatedExpenses = [addedExpense, ...expenses];
      setExpenses(updatedExpenses);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, expenses: updatedExpenses });
      
      console.log('✅ Expense added to Firestore and cache');
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
      const updatedExpenses = expenses.map(exp => 
        exp.id === id ? { ...exp, ...updatedData } : exp
      );
      setExpenses(updatedExpenses);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, expenses: updatedExpenses });
      
      console.log('✅ Expense updated in Firestore and cache');
    } catch (error) {
      console.error('❌ Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      const updatedExpenses = expenses.filter(exp => exp.id !== id);
      setExpenses(updatedExpenses);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, expenses: updatedExpenses });
      
      console.log('✅ Expense deleted from Firestore and cache');
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
    lastSync,
    
    // Expense operations
    addExpense,
    updateExpense,
    deleteExpense,
    bulkAddExpenses,
    
    // Data refresh
    refreshData,
    
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
