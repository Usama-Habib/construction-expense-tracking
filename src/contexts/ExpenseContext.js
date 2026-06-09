import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  getDoc,
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
const CACHE_EXPIRY_MINUTES = 10; // Cache expires after 30 minutes

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
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }
    
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
  } catch (error) {
    console.error('❌ Error setting cache:', error);
  }
};

const clearCache = () => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
};

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [budget, setBudget] = useState({ total: 0, categories: {} });
  const [lastSync, setLastSync] = useState(null);
  
  // Project configuration and progress tracking
  const [projectConfig, setProjectConfig] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [paymentStages, setPaymentStages] = useState(null);

  // Load data from Firestore or cache
  const loadData = async (forceRefresh = false) => {
    // Prevent multiple simultaneous loads
    if (isLoadingData && !forceRefresh) {
      return;
    }
    
    setIsLoadingData(true);
    setLoading(true);
    try {
      // Try to use cached data first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          setExpenses(cachedData.expenses || []);
          setCategories(cachedData.categories || DEFAULT_CATEGORIES);
          // Normalize cached vendors to ensure consistent structure
          const normalizedVendors = (cachedData.vendors || []).map(v => ({
            id: v.id,
            name: String(v.name || ''),
            contact: String(v.contact || ''),
            email: String(v.email || ''),
            notes: String(v.notes || ''),
          }));
          setVendors(normalizedVendors);
          setPaymentMethods(cachedData.paymentMethods || DEFAULT_PAYMENT_METHODS);
          setBudget(cachedData.budget || { total: 0, categories: {} });
          setProjectConfig(cachedData.projectConfig || null);
          setProgressData(cachedData.progressData || null);
          setPaymentStages(cachedData.paymentStages || null);
          setLastSync(new Date(parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY))));
          setLoading(false);
          return;
        }
      }
      
      // Load expenses
      const expensesQuery = query(collection(db, 'expenses'), orderBy('date', 'desc'));
      const expensesSnapshot = await getDocs(expensesQuery);
      const expensesData = expensesSnapshot.docs.map(doc => {
        const data = doc.data();
        // Always use Firestore document ID, not any custom id field
        return {
          ...data,
          id: doc.id, // Override any custom id field with Firestore document ID
          customId: data.id, // Preserve original custom ID if it exists
          date: data.date || new Date().toISOString().split('T')[0]
        };
      });
      setExpenses(expensesData);

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
      const vendorsData = vendorsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Normalize vendor data to ensure consistent structure
        return {
          id: doc.id,
          name: String(data.name || ''),
          contact: String(data.contact || ''),
          email: String(data.email || ''),
          notes: String(data.notes || ''),
        };
      });
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

      // Load project configuration
      const projectConfigSnapshot = await getDocs(collection(db, 'projectConfig'));
      let finalProjectConfig = null;
      if (!projectConfigSnapshot.empty) {
        finalProjectConfig = projectConfigSnapshot.docs[0].data();
        setProjectConfig(finalProjectConfig);
      }

      // Load progress data
      const progressDataSnapshot = await getDocs(collection(db, 'progressData'));
      let finalProgressData = null;
      if (!progressDataSnapshot.empty) {
        finalProgressData = progressDataSnapshot.docs[0].data();
        setProgressData(finalProgressData);
      }

      // Load payment stages
      const paymentStagesSnapshot = await getDocs(collection(db, 'paymentStages'));
      let finalPaymentStages = null;
      if (!paymentStagesSnapshot.empty) {
        finalPaymentStages = paymentStagesSnapshot.docs[0].data();
        setPaymentStages(finalPaymentStages.stages || finalPaymentStages);
      }

      // Cache the loaded data
      setCachedData({
        expenses: expensesData,
        categories: finalCategories,
        vendors: vendorsData,
        paymentMethods: finalPaymentMethods,
        budget: finalBudget,
        projectConfig: finalProjectConfig,
        progressData: finalProgressData,
        paymentStages: finalPaymentStages
      });
      setLastSync(new Date());
      
    } catch (error) {
      console.error('❌ Error loading data from Firestore:', error);
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  };

  // Manual refresh function
  const refreshData = async () => {
    clearCache();
    await loadData(true);
  };

  // Validate and clean up orphaned expenses (exist locally but not in Firestore)
  const validateAndCleanExpenses = async () => {
    try {
      // Get all Firestore expense IDs
      const expensesSnapshot = await getDocs(collection(db, 'expenses'));
      const firestoreIds = new Set(expensesSnapshot.docs.map(doc => doc.id));
      
      // Get local expense IDs
      const localIds = expenses.map(e => e.id);
      
      // Find orphaned IDs (in local but not in Firestore)
      const orphanedIds = localIds.filter(id => !firestoreIds.has(id));
      
      if (orphanedIds.length > 0) {
        console.warn(`⚠️ Found ${orphanedIds.length} orphaned expenses:`, orphanedIds);
        
        // Remove orphaned expenses from local state
        const cleanedExpenses = expenses.filter(exp => firestoreIds.has(exp.id));
        setExpenses(cleanedExpenses);
        
        // Update cache with cleaned data
        const cachedData = getCachedData() || {};
        setCachedData({ ...cachedData, expenses: cleanedExpenses });
        
        return { cleaned: true, count: orphanedIds.length, ids: orphanedIds };
      } else {
        return { cleaned: false, count: 0 };
      }
    } catch (error) {
      console.error('❌ Error validating expenses:', error);
      throw error;
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to sort expenses by date (descending - newest first)
  const sortExpensesByDate = (expensesArray) => {
    return [...expensesArray].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Descending order (newest first)
    });
  };

  // Expense CRUD operations
  const addExpense = async (expense) => {
    try {
      // Remove any custom id field to avoid confusion with Firestore document ID
      const { id, customId, ...expenseData } = expense;
      
      const newExpense = {
        ...expenseData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'expenses'), newExpense);
      const addedExpense = { id: docRef.id, ...newExpense };
      const updatedExpenses = sortExpensesByDate([addedExpense, ...expenses]);
      setExpenses(updatedExpenses);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, expenses: updatedExpenses });
      
      return addedExpense;
    } catch (error) {
      console.error('❌ Error adding expense:', error);
      throw error;
    }
  };

  const updateExpense = async (id, updates) => {
    try {
      if (!id) {
        throw new Error('Invalid expense ID: ID is missing or undefined');
      }
      
      // Remove any custom id field to avoid overwriting Firestore document ID
      const { id: customId, customId: oldCustomId, ...updateData } = updates;
      
      const expenseRef = doc(db, 'expenses', id);
      
      // Check if document exists before updating
      const docSnap = await getDoc(expenseRef);
      
      if (!docSnap.exists()) {
        console.error(`❌ Document with ID "${id}" does not exist in Firestore`);
        
        // Clear cache since it's out of sync
        clearCache();
        // Refresh data from Firestore
        await loadData(true);
        throw new Error(`Expense "${id}" was deleted or never saved to Firestore. Please refresh and try again with a valid expense.`);
      }
      
      const updatedData = { ...updateData, updatedAt: new Date() };
      
      await updateDoc(expenseRef, updatedData);
      
      const updatedExpenses = sortExpensesByDate(
        expenses.map(exp => 
          exp.id === id ? { ...exp, ...updatedData } : exp
        )
      );
      setExpenses(updatedExpenses);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, expenses: updatedExpenses });
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
    const updatedExpenses = sortExpensesByDate([...newExpenses, ...expenses]);
    setExpenses(updatedExpenses);
  };

  // Category operations
  const addCategory = async (category) => {
    try {
      const docRef = await addDoc(collection(db, 'categories'), category);
      const newCategory = { id: docRef.id, ...category };
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, categories: updatedCategories });
    } catch (error) {
      console.error('❌ Error adding category:', error);
    }
  };

  const updateCategory = async (id, updates) => {
    try {
      await updateDoc(doc(db, 'categories', id), updates);
      const updatedCategories = categories.map(cat => cat.id === id ? { ...cat, ...updates } : cat);
      setCategories(updatedCategories);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, categories: updatedCategories });
    } catch (error) {
      console.error('❌ Error updating category:', error);
    }
  };

  const deleteCategory = async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      const updatedCategories = categories.filter(cat => cat.id !== id);
      setCategories(updatedCategories);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, categories: updatedCategories });
    } catch (error) {
      console.error('❌ Error deleting category:', error);
    }
  };

  // Vendor operations
  const addVendor = async (vendor) => {
    try {
      const vendorData = {
        name: String(vendor.name || vendor || ''),
        contact: String(vendor.contact || ''),
        email: String(vendor.email || ''),
        notes: String(vendor.notes || ''),
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'vendors'), vendorData);
      const newVendor = { id: docRef.id, ...vendorData };
      const updatedVendors = [...vendors, newVendor];
      setVendors(updatedVendors);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, vendors: updatedVendors });
      
      return newVendor;
    } catch (error) {
      console.error('❌ Error adding vendor:', error);
      throw error;
    }
  };

  const updateVendor = async (id, updates) => {
    try {
      // Normalize updates to ensure all values are strings
      const normalizedUpdates = {
        name: String(updates.name || ''),
        contact: String(updates.contact || ''),
        email: String(updates.email || ''),
        notes: String(updates.notes || ''),
      };
      await updateDoc(doc(db, 'vendors', id), normalizedUpdates);
      const updatedVendors = vendors.map(v => v.id === id ? { ...v, ...normalizedUpdates } : v);
      setVendors(updatedVendors);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, vendors: updatedVendors });
    } catch (error) {
      console.error('❌ Error updating vendor:', error);
    }
  };

  const deleteVendor = async (id) => {
    try {
      await deleteDoc(doc(db, 'vendors', id));
      const updatedVendors = vendors.filter(v => v.id !== id);
      setVendors(updatedVendors);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, vendors: updatedVendors });
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

  // Project configuration operations
  const saveProjectConfig = async (config) => {
    try {
      const projectConfigSnapshot = await getDocs(collection(db, 'projectConfig'));
      
      if (projectConfigSnapshot.empty) {
        // Create new config document
        await addDoc(collection(db, 'projectConfig'), config);
      } else {
        // Update existing config document
        const configDocId = projectConfigSnapshot.docs[0].id;
        await updateDoc(doc(db, 'projectConfig', configDocId), config);
      }
      
      setProjectConfig(config);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, projectConfig: config });
    } catch (error) {
      console.error('❌ Error saving project config:', error);
      throw error;
    }
  };

  // Progress data operations
  const saveProgressData = async (progress) => {
    try {
      const progressDataSnapshot = await getDocs(collection(db, 'progressData'));
      
      if (progressDataSnapshot.empty) {
        // Create new progress document
        await addDoc(collection(db, 'progressData'), progress);
      } else {
        // Update existing progress document
        const progressDocId = progressDataSnapshot.docs[0].id;
        await updateDoc(doc(db, 'progressData', progressDocId), progress);
      }
      
      setProgressData(progress);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, progressData: progress });
    } catch (error) {
      console.error('❌ Error saving progress data:', error);
      throw error;
    }
  };

  // Payment stages operations
  const savePaymentStages = async (stages) => {
    try {
      const paymentStagesSnapshot = await getDocs(collection(db, 'paymentStages'));
      
      const dataToSave = { stages, lastUpdated: new Date().toISOString() };
      
      if (paymentStagesSnapshot.empty) {
        // Create new payment stages document
        await addDoc(collection(db, 'paymentStages'), dataToSave);
      } else {
        // Update existing payment stages document
        const stagesDocId = paymentStagesSnapshot.docs[0].id;
        await updateDoc(doc(db, 'paymentStages', stagesDocId), dataToSave);
      }
      
      setPaymentStages(stages);
      
      // Update cache
      const cachedData = getCachedData() || {};
      setCachedData({ ...cachedData, paymentStages: stages });
    } catch (error) {
      console.error('❌ Error saving payment stages:', error);
      throw error;
    }
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
    projectConfig,
    progressData,
    paymentStages,
    
    // Expense operations
    addExpense,
    updateExpense,
    deleteExpense,
    bulkAddExpenses,
    
    // Data refresh
    refreshData,
    validateAndCleanExpenses,
    
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
    
    // Project tracking
    saveProjectConfig,
    saveProgressData,
    savePaymentStages,
    
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
