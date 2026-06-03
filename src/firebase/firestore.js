import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';

// Collection references
const expensesCollection = collection(db, 'expenses');
const categoriesCollection = collection(db, 'categories');
const vendorsCollection = collection(db, 'vendors');
const settingsCollection = collection(db, 'settings');

// ==================== EXPENSES ====================

export const getAllExpenses = async () => {
  try {
    const q = query(expensesCollection, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || doc.data().date // Handle Firestore Timestamp
    }));
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

export const addExpense = async (expenseData) => {
  try {
    const docRef = await addDoc(expensesCollection, {
      ...expenseData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...expenseData };
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const updateExpense = async (id, expenseData) => {
  try {
    const expenseRef = doc(db, 'expenses', id);
    await updateDoc(expenseRef, {
      ...expenseData,
      updatedAt: Timestamp.now()
    });
    return { id, ...expenseData };
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (id) => {
  try {
    const expenseRef = doc(db, 'expenses', id);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// ==================== CATEGORIES ====================

export const getAllCategories = async () => {
  try {
    const snapshot = await getDocs(categoriesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const addCategory = async (categoryData) => {
  try {
    const docRef = await addDoc(categoriesCollection, categoryData);
    return { id: docRef.id, ...categoryData };
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

// ==================== VENDORS ====================

export const getAllVendors = async () => {
  try {
    const snapshot = await getDocs(vendorsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
};

export const addVendor = async (vendorData) => {
  try {
    const docRef = await addDoc(vendorsCollection, vendorData);
    return { id: docRef.id, ...vendorData };
  } catch (error) {
    console.error('Error adding vendor:', error);
    throw error;
  }
};

// ==================== SETTINGS ====================

export const getSettings = async () => {
  try {
    const settingsDoc = doc(db, 'settings', 'app');
    const snapshot = await getDoc(settingsDoc);
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

export const updateSettings = async (settingsData) => {
  try {
    const settingsDoc = doc(db, 'settings', 'app');
    await updateDoc(settingsDoc, settingsData);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// ==================== BULK IMPORT ====================

export const bulkImportExpenses = async (expenses) => {
  try {
    const promises = expenses.map(expense => addExpense(expense));
    await Promise.all(promises);
    return { success: true, count: expenses.length };
  } catch (error) {
    console.error('Error bulk importing expenses:', error);
    throw error;
  }
};
