import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  Avatar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import SpeedIcon from '@mui/icons-material/Speed';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ImageIcon from '@mui/icons-material/Image';
import StarIcon from '@mui/icons-material/Star';
import { useExpense } from '../contexts/ExpenseContext';
import BasicRichTextEditor from '../components/BasicRichTextEditor';
import { sanitizeRichText, richTextToPlainText } from '../utils/richTextUtils';
import { compressImageFile } from '../utils/imageUtils';

const DEFAULT_AREA_KEY = 'expense_default_area';
const AREA_OPTIONS = ['Foundation', 'Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Roof/Top', 'General'];

const parseNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPaymentSnapshot = (totalValue, paidValue) => {
  const total = parseNumber(totalValue);
  const paid = parseNumber(paidValue);
  const remaining = total - paid;

  let status = 'Pending';
  if (paid >= total && total > 0) {
    status = 'Clear';
  } else if (paid > 0 && paid < total) {
    status = 'Partial';
  }

  return {
    total,
    paid,
    remaining: remaining > 0.001 ? remaining : 0,
    remainingDisplay: remaining > 0.001 ? remaining.toFixed(2) : '0',
    status,
  };
};

const getSubCategoryName = (subCategory) => {
  if (typeof subCategory === 'string') return subCategory;
  return subCategory?.name || '';
};

const isSubCategoryEnabled = (subCategory) => {
  if (typeof subCategory === 'string') return true;
  return subCategory?.enabled !== false;
};

const ExpenseEntry = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { expenses, categories, vendors, paymentMethods, addExpense, updateExpense, deleteExpense, refreshData, validateAndCleanExpenses, addVendor } = useExpense();
  const [defaultArea, setDefaultArea] = useState(() => localStorage.getItem(DEFAULT_AREA_KEY) || 'Ground Floor');
  
  const [showForm, setShowForm] = useState(false); // Hide form by default
  const [showFilters, setShowFilters] = useState(!isMobile); // Auto-hide on mobile
  const [quickAddMode, setQuickAddMode] = useState(false); // Quick add mode
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    subCategory: '',
    vendor: '',
    totalAmount: '',
    paidAmount: '',
    remainingAmount: '',
    paymentMethod: '',
    area: localStorage.getItem(DEFAULT_AREA_KEY) || 'Ground Floor',
    paymentStatus: 'Pending',
    notes: '',
    notesHtml: '',
    imageData: '',
    imageName: '',
    imageMimeType: '',
    imageSizeKb: 0,
    quantity: '',
    unit: '',
    rate: '',
  });

  const [editingId, setEditingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isPaidAutoSync, setIsPaidAutoSync] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [imagePreview, setImagePreview] = useState({ open: false, src: '', name: '' });
  
  // Filter state
  const [filters, setFilters] = useState({
    searchText: '',
    category: '',
    subCategory: '',
    area: '',
    dateFrom: '',
    dateTo: '',
  });

  const selectedCategory = categories.find(cat => cat.name === formData.category);
  const allSubCategories = selectedCategory?.subCategories || [];
  const isMaterialCategory = formData.category === 'Material';
  const subCategories = allSubCategories
    .filter((sub) => (isMaterialCategory ? isSubCategoryEnabled(sub) : true))
    .map(getSubCategoryName)
    .filter(Boolean);

  const persistDefaultArea = (area) => {
    if (!area) return;
    localStorage.setItem(DEFAULT_AREA_KEY, area);
    setDefaultArea(area);
  };

  const normalizeVendorName = (name = '') => name.trim().toLowerCase();

  const ensureVendorExists = async (vendorName) => {
    const cleaned = (vendorName || '').trim();
    if (!cleaned) return;

    const exists = vendors.some((v) => normalizeVendorName(v.name) === normalizeVendorName(cleaned));
    if (!exists) {
      await addVendor({ name: cleaned });
    }
  };

  const handleImageSelection = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file);
      setFormData((prev) => ({
        ...prev,
        imageData: compressed.dataUrl,
        imageName: compressed.name,
        imageMimeType: compressed.mimeType,
        imageSizeKb: compressed.sizeKb,
      }));
      setSnackbar({ open: true, message: `✓ Image attached (${compressed.sizeKb} KB)`, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to process image', severity: 'error' });
    } finally {
      event.target.value = '';
    }
  };

  // Helper to get amount (backward compatible)
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
    // Always calculate remaining from total - paid (ignore manual entry)
    const total = getAmount(exp);
    const paid = getPaidAmount(exp);
    const remaining = total - paid;
    // Return 0 if remaining is negative or very small (to handle floating point errors)
    return remaining > 0.001 ? remaining : 0;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'clear':
      case 'paid':
        return { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' };
      case 'partial':
        return { bg: '#fff9c4', border: '#fbc02d', text: '#f57c00' };
      case 'pending':
      case 'unpaid':
        return { bg: '#ffebee', border: '#ef5350', text: '#c62828' };
      default:
        return { bg: '#f5f5f5', border: '#9e9e9e', text: '#616161' };
    }
  };

  // Filter expenses based on all filter criteria
  const filteredExpenses = useMemo(() => expenses.filter(expense => {
    // Search text filter (searches in description, notes, vendor, category, subcategory)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesSearch = 
        (richTextToPlainText(expense.notesHtml || '').toLowerCase().includes(searchLower)) ||
        (expense.notes?.toLowerCase().includes(searchLower)) ||
        (expense.vendor?.toLowerCase().includes(searchLower)) ||
        (expense.category?.toLowerCase().includes(searchLower)) ||
        (expense.subCategory?.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.category && expense.category !== filters.category) {
      return false;
    }

    // SubCategory filter
    if (filters.subCategory && expense.subCategory !== filters.subCategory) {
      return false;
    }

    // Area filter
    if (filters.area && expense.area !== filters.area) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom && expense.date < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && expense.date > filters.dateTo) {
      return false;
    }

    return true;
  }), [expenses, filters]);

  // Calculate summary for filtered results
  const filterSummary = useMemo(() => ({
    count: filteredExpenses.length,
    totalAmount: filteredExpenses.reduce((sum, exp) => sum + getAmount(exp), 0),
    totalPaid: filteredExpenses.reduce((sum, exp) => sum + getPaidAmount(exp), 0),
    totalRemaining: filteredExpenses.reduce((sum, exp) => {
      const total = parseNumber(exp.totalAmount || exp.amount);
      const paid = parseNumber(
        exp.paidAmount !== undefined && exp.paidAmount !== null && exp.paidAmount !== ''
          ? exp.paidAmount
          : (exp.paymentStatus === 'Clear' || exp.paymentStatus === 'Paid')
            ? (exp.totalAmount || exp.amount)
            : 0
      );
      const remaining = total - paid;
      return sum + (remaining > 0.001 ? remaining : 0);
    }, 0),
    totalQuantity: filteredExpenses.reduce((sum, exp) => {
      const qty = parseFloat(exp.quantity) || 0;
      return sum + qty;
    }, 0),
  }), [filteredExpenses]);

  // Get unique subcategories for the selected category in filter
  const filterSelectedCategory = useMemo(() => categories.find(cat => cat.name === filters.category), [categories, filters.category]);
  const filterSubCategories = useMemo(() => (filterSelectedCategory?.subCategories || [])
    .filter((sub) => (filters.category === 'Material' ? isSubCategoryEnabled(sub) : true))
    .map(getSubCategoryName)
    .filter(Boolean), [filterSelectedCategory, filters.category]);

  const autoQuantityTotal = useMemo(() => {
    const quantity = parseNumber(formData.quantity);
    const rate = parseNumber(formData.rate);
    return quantity > 0 && rate > 0 ? (quantity * rate).toFixed(2) : '';
  }, [formData.quantity, formData.rate]);

  const effectiveTotalAmount = autoQuantityTotal || formData.totalAmount || '';

  const computedPayment = useMemo(() => {
    const totalCandidate = effectiveTotalAmount;
    return getPaymentSnapshot(totalCandidate, formData.paidAmount);
  }, [effectiveTotalAmount, formData.paidAmount]);

  useEffect(() => {
    if (autoQuantityTotal && formData.totalAmount !== autoQuantityTotal) {
      setFormData((prev) => ({ ...prev, totalAmount: autoQuantityTotal }));
    }
  }, [autoQuantityTotal, formData.totalAmount]);

  useEffect(() => {
    if (!isPaidAutoSync) return;

    const targetPaid = effectiveTotalAmount ? String(effectiveTotalAmount) : '';
    if (formData.paidAmount !== targetPaid) {
      setFormData((prev) => ({ ...prev, paidAmount: targetPaid }));
    }
  }, [effectiveTotalAmount, isPaidAutoSync, formData.paidAmount]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchText: '',
      category: '',
      subCategory: '',
      area: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'category' && { subCategory: '' }) // Reset subcategory when category changes
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Track manual edits to avoid overriding active typing.
    if (name === 'paidAmount') {
      setIsPaidAutoSync(false);
    }
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'category' && { subCategory: '' })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.category || !effectiveTotalAmount) {
      setSnackbar({ open: true, message: 'Please fill Date, Category, and Amount', severity: 'error' });
      return;
    }

    if (parseFloat(effectiveTotalAmount) <= 0) {
      setSnackbar({ open: true, message: 'Amount must be greater than 0', severity: 'error' });
      return;
    }

    if (editingId) {
      try {
        // Verify the expense exists in local state
        const expenseExists = expenses.find(exp => exp.id === editingId);
        if (!expenseExists) {
          console.warn('⚠️ Expense not found in local state, refreshing data...');
          await refreshData();
          setSnackbar({ 
            open: true, 
            message: '⚠️ Data refreshed. Please try editing again.', 
            severity: 'warning' 
          });
          handleCancelEdit();
          return;
        }
        
        await ensureVendorExists(formData.vendor);
        await updateExpense(editingId, {
          ...formData,
          totalAmount: effectiveTotalAmount,
          remainingAmount: computedPayment.remainingDisplay,
          paymentStatus: computedPayment.status,
          notesHtml: sanitizeRichText(formData.notesHtml || formData.notes || ''),
          notes: richTextToPlainText(formData.notesHtml || formData.notes || ''),
          description: '',
        });
        setSnackbar({ open: true, message: '✓ Expense updated!', severity: 'success' });
        setEditingId(null);
      } catch (error) {
        console.error('❌ Error in handleSubmit:', error);
        
        // If error mentions "not found" or "does not exist", refresh data
        if (error.message && (error.message.includes('not found') || error.message.includes('does not exist') || error.message.includes('deleted or never saved'))) {
          // Try to clean up orphaned expenses
          try {
            const cleanupResult = await validateAndCleanExpenses();
            if (cleanupResult.cleaned) {
              setSnackbar({ 
                open: true, 
                message: `🧹 Cleaned up ${cleanupResult.count} invalid expense(s). Please select a valid expense to edit.`, 
                severity: 'warning' 
              });
            } else {
              await refreshData();
              setSnackbar({ 
                open: true, 
                message: '⚠️ ' + error.message, 
                severity: 'warning' 
              });
            }
          } catch (cleanupError) {
            console.error('Failed to cleanup:', cleanupError);
            await refreshData();
            setSnackbar({ 
              open: true, 
              message: '⚠️ Data refreshed. Please try again.', 
              severity: 'warning' 
            });
          }
          handleCancelEdit();
        } else {
          setSnackbar({ 
            open: true, 
            message: error.message || 'Failed to update expense', 
            severity: 'error' 
          });
        }
        return;
      }
    } else {
      try {
        await ensureVendorExists(formData.vendor);
        await addExpense({
          ...formData,
          totalAmount: effectiveTotalAmount,
          remainingAmount: computedPayment.remainingDisplay,
          paymentStatus: computedPayment.status,
          notesHtml: sanitizeRichText(formData.notesHtml || formData.notes || ''),
          notes: richTextToPlainText(formData.notesHtml || formData.notes || ''),
          description: '',
        });
        setSnackbar({ open: true, message: '✓ Expense added!', severity: 'success' });
      } catch (error) {
        console.error('❌ Error adding expense:', error);
        setSnackbar({ 
          open: true, 
          message: 'Failed to add expense', 
          severity: 'error' 
        });
        return;
      }
    }

    // Reset form and hide it
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      subCategory: '',
      vendor: '',
      totalAmount: '',
      paidAmount: '',
      remainingAmount: '',
      paymentMethod: '',
      area: defaultArea,
      paymentStatus: 'Pending',
      notes: '',
      notesHtml: '',
      imageData: '',
      imageName: '',
      imageMimeType: '',
      imageSizeKb: 0,
      quantity: '',
      unit: '',
      rate: '',
    });
    setIsPaidAutoSync(true);
    setShowForm(false);
    setQuickAddMode(false);
  };

  const handleEdit = (expense) => {
    if (!expense.id) {
      console.error('❌ Invalid expense: missing ID');
      setSnackbar({ 
        open: true, 
        message: 'Cannot edit: Invalid expense data', 
        severity: 'error' 
      });
      return;
    }
    
    // Ensure date is in proper YYYY-MM-DD format for input field
    let formattedDate = expense.date;
    if (expense.date) {
      // Handle Firestore Timestamp, Date object, or string
      if (typeof expense.date.toDate === 'function') {
        // Firestore Timestamp
        formattedDate = expense.date.toDate().toISOString().split('T')[0];
      } else if (expense.date instanceof Date) {
        // JavaScript Date object
        formattedDate = expense.date.toISOString().split('T')[0];
      } else if (typeof expense.date === 'string') {
        // String - ensure it's in YYYY-MM-DD format
        formattedDate = expense.date.split('T')[0];
      }
    } else {
      // Default to today if no date
      formattedDate = new Date().toISOString().split('T')[0];
    }
    
    // Calculate remaining amount and payment status correctly
    const totalAmt = parseFloat(expense.totalAmount || expense.amount) || 0;
    const paidAmt = parseFloat(expense.paidAmount || expense.totalAmount || expense.amount) || 0;
    const remainingAmt = totalAmt - paidAmt;
    
    // Auto-calculate payment status based on amounts
    let calculatedStatus = 'Pending';
    if (paidAmt >= totalAmt && totalAmt > 0) {
      calculatedStatus = 'Clear';
    } else if (paidAmt > 0 && paidAmt < totalAmt) {
      calculatedStatus = 'Partial';
    }
    
    setFormData({
      date: formattedDate,
      category: expense.category,
      subCategory: expense.subCategory || '',
      vendor: expense.vendor || '',
      totalAmount: expense.totalAmount || expense.amount || '',
      paidAmount: expense.paidAmount || expense.totalAmount || expense.amount || '',
      remainingAmount: remainingAmt > 0.001 ? remainingAmt.toFixed(2) : '0',
      paymentMethod: expense.paymentMethod || '',
      area: expense.area || defaultArea,
      paymentStatus: calculatedStatus,
      notes: expense.notes || expense.description || '',
      notesHtml: sanitizeRichText(expense.notesHtml || expense.notes || expense.description || ''),
      imageData: expense.imageData || '',
      imageName: expense.imageName || '',
      imageMimeType: expense.imageMimeType || '',
      imageSizeKb: expense.imageSizeKb || 0,
      quantity: expense.quantity || '',
      unit: expense.unit || '',
      rate: expense.rate || '',
    });
    const existingTotal = parseNumber(expense.totalAmount || expense.amount);
    const existingPaid = parseNumber(expense.paidAmount || expense.totalAmount || expense.amount);
    const isFullyPaid = Math.abs(existingTotal - existingPaid) < 0.001;
    setIsPaidAutoSync(isFullyPaid);
    setEditingId(expense.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ open: true, id });
  };

  const handleOpenImagePreview = (imageSrc, imageName = 'Expense image') => {
    if (!imageSrc) return;
    setImagePreview({ open: true, src: imageSrc, name: imageName });
  };

  const confirmDelete = () => {
    if (deleteConfirm.id) {
      deleteExpense(deleteConfirm.id);
      setSnackbar({ open: true, message: '✓ Expense deleted successfully!', severity: 'success' });
    }
    setDeleteConfirm({ open: false, id: null });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setQuickAddMode(false);
    setIsPaidAutoSync(true);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      subCategory: '',
      vendor: '',
      totalAmount: '',
      paidAmount: '',
      remainingAmount: '',
      paymentMethod: '',
      area: defaultArea,
      paymentStatus: 'Pending',
      notes: '',
      notesHtml: '',
      imageData: '',
      imageName: '',
      imageMimeType: '',
      imageSizeKb: 0,
      quantity: '',
      unit: '',
      rate: '',
    });
  };

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        py: { xs: 2, sm: 3 },
        px: { xs: 1, sm: 2 }
      }}
    >
      {/* Entry Form (Collapsible) */}
      {showForm && (
        <Paper 
          elevation={3}
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            mb: 3,
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'primary.main'
          }}
        >
          <Typography 
            variant={isMobile ? "h5" : "h4"}
            gutterBottom 
            fontWeight="bold"
            color="primary"
            sx={{ mb: 3 }}
          >
            {editingId ? '✏️ Edit Expense' : quickAddMode ? '⚡ Quick Add Expense' : '➕ Add New Expense'}
          </Typography>
          
          {quickAddMode && !editingId && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Quick Add mode - Only essential fields shown. Click the blue + button for full form.
            </Alert>
          )}
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Date Field - Full Width on Mobile */}
            <TextField
              required
              fullWidth
              label="📅 Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '1rem', sm: '1rem' },
                  height: { xs: '56px', sm: '56px' }
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '1rem', sm: '1rem' },
                  fontWeight: 500
                }
              }}
            />

            {/* Category Dropdown - Larger for mobile */}
            <FormControl required fullWidth>
              <InputLabel id="form-category-label">🏗️ Category</InputLabel>
              <Select
                labelId="form-category-label"
                id="form-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="🏗️ Category"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1rem' },
                  height: { xs: '56px', sm: '56px' }
                }}
              >
                <MenuItem value="">Select Category</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Sub-Category */}
            {formData.category && (
              isMaterialCategory ? (
                <Autocomplete
                  freeSolo
                  fullWidth
                  options={subCategories}
                  value={formData.subCategory}
                  onInputChange={(event, newValue) => {
                    setFormData((prev) => ({ ...prev, subCategory: newValue || '' }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="📋 Material (type to filter)"
                      placeholder="Type material name..."
                      helperText="Only enabled materials are suggested"
                    />
                  )}
                />
              ) : (
                subCategories.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel id="form-subcategory-label">📋 Sub-Category</InputLabel>
                    <Select
                      labelId="form-subcategory-label"
                      id="form-subcategory"
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      label="📋 Sub-Category"
                      sx={{
                        fontSize: { xs: '1.1rem', sm: '1rem' },
                        height: { xs: '56px', sm: '56px' }
                      }}
                    >
                      <MenuItem value="">Select Sub-Category (Optional)</MenuItem>
                      {subCategories.map((sub) => (
                        <MenuItem key={sub} value={sub}>
                          {sub}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )
              )
            )}

            {/* Total Amount - ALWAYS visible (required field) */}
            <TextField
              required
              fullWidth
              label="💰 Total Amount"
              name="totalAmount"
              type="number"
              value={effectiveTotalAmount}
              onChange={handleChange}
              disabled={Boolean(autoQuantityTotal)}
              helperText={autoQuantityTotal ? 'Auto-calculated from Quantity x Rate' : ''}
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="0.00"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '1.2rem', sm: '1.1rem' },
                  height: { xs: '60px', sm: '56px' },
                  fontWeight: 600
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '1.1rem', sm: '1rem' },
                  fontWeight: 600
                },
                '& input': {
                  textAlign: 'left',
                  fontWeight: 600,
                  color: theme.palette.primary.main
                }
              }}
            />

            {/* Quantity, Unit & Rate - ALWAYS visible (helpful for materials like cement, bricks) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1.5fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="📦 Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
                placeholder="e.g., 3000"
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '1rem', sm: '1rem' },
                    height: { xs: '56px', sm: '56px' }
                  }
                }}
              />
              <TextField
                fullWidth
                label="📏 Unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="e.g., bags, pcs"
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '1rem', sm: '1rem' },
                    height: { xs: '56px', sm: '56px' }
                  }
                }}
              />
              <TextField
                fullWidth
                label="💰 Rate/Unit"
                name="rate"
                type="number"
                value={formData.rate}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
                placeholder="e.g., 12.5"
                helperText={autoQuantityTotal ? `Qty x Rate = ${autoQuantityTotal}` : ''}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '1rem', sm: '1rem' },
                    height: { xs: '56px', sm: '56px' }
                  }
                }}
              />
            </Box>

            {/* Optional fields - hidden in Quick Add mode */}
            {(!quickAddMode || editingId) && (
            <>
            {/* Vendor Field - Autocomplete with Add Option */}
            <Autocomplete
              fullWidth
              freeSolo
              options={[...new Set(vendors.map(v => v.name))]}
              value={formData.vendor}
              onInputChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, vendor: newValue || '' }));
              }}
              onBlur={async () => {
                try {
                  await ensureVendorExists(formData.vendor);
                } catch (error) {
                  setSnackbar({ open: true, message: 'Could not add vendor', severity: 'warning' });
                }
              }}
              onChange={async (event, newValue) => {
                const typedVendor = typeof newValue === 'string' ? newValue : (newValue || '');
                if (typedVendor && !vendors.find(v => normalizeVendorName(v.name) === normalizeVendorName(typedVendor))) {
                  // Add new vendor if it doesn't exist
                  try {
                    await addVendor({ name: typedVendor.trim() });
                    setSnackbar({ open: true, message: `✓ Vendor "${typedVendor}" added!`, severity: 'success' });
                  } catch (error) {
                    console.error('Error adding vendor:', error);
                  }
                }
                setFormData(prev => ({ ...prev, vendor: typedVendor }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="🏪 Vendor/Supplier"
                  placeholder="Select or type to add new vendor"
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: { xs: '1rem', sm: '1rem' },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: '1rem', sm: '1rem' },
                      fontWeight: 500
                    }
                  }}
                />
              )}
            />

            {/* Paid Amount */}
            <TextField
              fullWidth
              label="✅ Paid Amount"
              name="paidAmount"
              type="number"
              value={formData.paidAmount}
              onChange={handleChange}
              helperText={isPaidAutoSync ? 'Auto-synced with Total Amount. Edit to switch to manual payment.' : 'Manual mode enabled.'}
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="0.00"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '1rem', sm: '1rem' },
                  height: { xs: '56px', sm: '56px' }
                }
              }}
            />

            {/* Remaining Amount (Auto-calculated) */}
            <TextField
              fullWidth
              label="⏳ Remaining Amount (Auto-calculated)"
              name="remainingAmount"
              type="number"
              value={computedPayment.remainingDisplay}
              InputProps={{ readOnly: true }}
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="0.00"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '1rem', sm: '1rem' },
                  height: { xs: '56px', sm: '56px' },
                  backgroundColor: '#f5f5f5'
                }
              }}
            />

            {/* Payment Method */}
            <FormControl fullWidth>
              <InputLabel id="form-payment-method-label">💳 Payment Method</InputLabel>
              <Select
                labelId="form-payment-method-label"
                id="form-payment-method"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                label="💳 Payment Method"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1rem' },
                  height: { xs: '56px', sm: '56px' }
                }}
              >
                <MenuItem value="">Select Payment Method</MenuItem>
                {paymentMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Area/Floor Selection */}
            <FormControl fullWidth>
              <InputLabel id="form-area-label">🏢 Area/Floor</InputLabel>
              <Select
                labelId="form-area-label"
                id="form-area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                label="🏢 Area/Floor"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1rem' },
                  height: { xs: '56px', sm: '56px' }
                }}
              >
                <MenuItem value="">Select Area/Floor</MenuItem>
                {AREA_OPTIONS.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area === defaultArea ? '⭐ ' : ''}{area}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Default area: {defaultArea}
              </FormHelperText>
            </FormControl>

            <Button
              variant="outlined"
              size="small"
              startIcon={<StarIcon />}
              disabled={!formData.area}
              onClick={() => {
                persistDefaultArea(formData.area);
                setSnackbar({ open: true, message: `✓ "${formData.area}" set as default area`, severity: 'success' });
              }}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              Set Selected Area as Default
            </Button>

            {/* Payment Status (Auto-calculated) */}
            <FormControl fullWidth>
              <InputLabel id="form-payment-status-label">✅ Payment Status (Auto-set)</InputLabel>
              <Select
                labelId="form-payment-status-label"
                id="form-payment-status"
                name="paymentStatus"
                value={computedPayment.status}
                disabled
                label="✅ Payment Status (Auto-set)"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1rem' },
                  height: { xs: '56px', sm: '56px' },
                  backgroundColor: '#f5f5f5'
                }}
              >
                <MenuItem value="Clear">✅ Clear (Fully Paid)</MenuItem>
                <MenuItem value="Partial">⚠️ Partial (Partially Paid)</MenuItem>
                <MenuItem value="Pending">⏳ Pending (Not Paid)</MenuItem>
              </Select>
            </FormControl>

            {/* Notes (Rich Text) */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                📝 Notes
              </Typography>
              <BasicRichTextEditor
                value={formData.notesHtml || formData.notes || ''}
                onChange={(newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    notesHtml: newValue,
                    notes: richTextToPlainText(newValue),
                  }));
                }}
                placeholder="Add formatted notes for this expense..."
              />
            </Box>

            {/* Image Attachment */}
            <Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<ImageIcon />}
                sx={{ textTransform: 'none' }}
              >
                Attach Expense Image
                <input hidden accept="image/*" type="file" onChange={handleImageSelection} />
              </Button>

              {formData.imageData && (
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Avatar
                    variant="rounded"
                    src={formData.imageData}
                    alt={formData.imageName || 'expense image'}
                    sx={{ width: { xs: 60, sm: 72 }, height: { xs: 60, sm: 72 }, border: '0.5px solid', borderColor: 'rgba(0,0,0,0.12)' }}
                  />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {formData.imageName || 'Attached image'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {formData.imageSizeKb || 0} KB (compressed)
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setFormData((prev) => ({ ...prev, imageData: '', imageName: '', imageMimeType: '', imageSizeKb: 0 }))}
                      sx={{ px: 0, minWidth: 'auto', textTransform: 'none' }}
                    >
                      Remove image
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
            </>
            )}

            {/* Action Buttons - Full width on mobile */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth={isMobile}
                startIcon={editingId ? <EditIcon /> : <AddIcon />}
                sx={{
                  py: { xs: 1.5, sm: 1.2 },
                  fontSize: { xs: '1.1rem', sm: '1rem' },
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: 3
                }}
              >
                {editingId ? 'Update Expense' : 'Add Expense'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth={isMobile}
                onClick={handleCancelEdit}
                startIcon={<CancelIcon />}
                sx={{
                  py: { xs: 1.5, sm: 1.2 },
                  fontSize: { xs: '1.1rem', sm: '1rem' },
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Cancel
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
      )}

      {/* Expenses List */}
      <Paper 
        elevation={3}
        sx={{ 
          p: { xs: 2, sm: 3 },
          borderRadius: 2
        }}
      >
        {/* Filter Panel */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              🔍 Filter & Search
            </Typography>
            <Button
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: 'none' }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Box>
          
          {/* Filter Controls - Collapsible */}
          {showFilters && (
          <>
          {/* Filter Controls */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
            {/* Search Text */}
            <TextField
              size="small"
              label="Search"
              name="searchText"
              value={filters.searchText}
              onChange={handleFilterChange}
              placeholder="Search notes, vendor, category..."
              sx={{ gridColumn: { xs: '1', md: 'span 1' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Category Filter */}
            <FormControl size="small" fullWidth>
              <InputLabel id="filter-category-label">Category</InputLabel>
              <Select
                labelId="filter-category-label"
                id="filter-category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat.name} value={cat.name}>{cat.icon} {cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* SubCategory Filter */}
            <FormControl size="small" fullWidth disabled={!filters.category}>
              <InputLabel id="filter-subcategory-label">Sub-Category</InputLabel>
              <Select
                labelId="filter-subcategory-label"
                id="filter-subcategory"
                name="subCategory"
                value={filters.subCategory}
                onChange={handleFilterChange}
                label="Sub-Category"
              >
                <MenuItem value="">All Sub-Categories</MenuItem>
                {filterSubCategories.map(sub => (
                  <MenuItem key={sub} value={sub}>{sub}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Area Filter */}
            <FormControl size="small" fullWidth>
              <InputLabel id="filter-area-label">Area/Floor</InputLabel>
              <Select
                labelId="filter-area-label"
                id="filter-area"
                name="area"
                value={filters.area}
                onChange={handleFilterChange}
                label="Area/Floor"
              >
                <MenuItem value="">All Areas</MenuItem>
                {AREA_OPTIONS.map((area) => (
                  <MenuItem key={area} value={area}>{area === defaultArea ? '⭐ ' : ''}{area}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Date Range Filters */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
            <TextField
              size="small"
              type="date"
              label="From Date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& input[type="date"]::-webkit-datetime-edit': {
                  color: filters.dateFrom ? 'inherit' : 'transparent',
                },
                '& input[type="date"]:focus::-webkit-datetime-edit': {
                  color: 'inherit',
                },
              }}
            />
            <TextField
              size="small"
              type="date"
              label="To Date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& input[type="date"]::-webkit-datetime-edit': {
                  color: filters.dateTo ? 'inherit' : 'transparent',
                },
                '& input[type="date"]:focus::-webkit-datetime-edit': {
                  color: 'inherit',
                },
              }}
            />
            <Button
              variant="outlined"
              onClick={clearFilters}
              sx={{ textTransform: 'none' }}
            >
              Clear Filters
            </Button>
          </Box>

          {/* Filter Summary */}
          {filteredExpenses.length > 0 && (
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr 1fr' },
                gap: 2,
                p: 2,
                bgcolor: 'primary.lighter',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'primary.main'
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                  Records Found
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {filterSummary.count}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                  Total Amount
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {filterSummary.totalAmount.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">PKR</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                  Total Paid
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {filterSummary.totalPaid.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">PKR</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                  Remaining
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  {filterSummary.totalRemaining.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">PKR</Typography>
              </Box>
              {filterSummary.totalQuantity > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                    Total Quantity
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="info.main">
                    {filterSummary.totalQuantity.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">units</Typography>
                </Box>
              )}
            </Box>
          )}
          </>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"}
            fontWeight="bold"
            color="primary"
          >
            📊 {filteredExpenses.length > 0 ? `Filtered Expenses (${filteredExpenses.length})` : `All Expenses (${expenses.length})`}
          </Typography>
        </Box>
        
        {filteredExpenses.length === 0 ? (
          <Box 
            sx={{ 
              py: 6, 
              textAlign: 'center',
              bgcolor: 'grey.50',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" color="text.secondary">
              {expenses.length === 0 ? 'No expenses yet' : 'No expenses match your filters'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {expenses.length === 0 ? 'Click the + button below to get started 👇' : 'Try adjusting your filters or clear them to see all expenses'}
            </Typography>
          </Box>
        ) : isMobile ? (
          // CARD VIEW for Mobile - Much better UX
          <Stack spacing={2} sx={{ pb: 20 }}>
            {filteredExpenses.map((expense) => {
              const categoryInfo = categories.find(c => c.name === expense.category);
              const statusColors = getStatusColor(expense.paymentStatus);
              const totalAmt = getAmount(expense);
              const paidAmt = getPaidAmount(expense);
              const remainingAmt = getRemainingAmount(expense);
              
              return (
                <Card 
                  key={expense.id}
                  elevation={2}
                  sx={{ 
                    borderLeft: `6px solid ${statusColors.border}`,
                    bgcolor: statusColors.bg,
                    '&:active': {
                      transform: 'scale(0.98)',
                      transition: 'transform 0.1s'
                    }
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    {/* Header Row - Date and Category */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                          📅 {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                        <Chip 
                          label={expense.category}
                          size="small"
                          sx={{ 
                            bgcolor: categoryInfo?.color + '40',
                            color: categoryInfo?.color,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            mt: 0.5
                          }}
                        />
                        {expense.subCategory && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                            📋 {expense.subCategory}
                          </Typography>
                        )}
                      </Box>
                      <Chip 
                        label={expense.paymentStatus || 'Pending'}
                        size="small"
                        sx={{ 
                          bgcolor: statusColors.border,
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>

                    {/* Amount Section - Most Important */}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 1.5,
                      mb: 2,
                      p: 1.5,
                      bgcolor: 'white',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                          Total
                        </Typography>
                        <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                          {totalAmt.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', borderLeft: '1px solid', borderRight: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                          Paid
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                          {paidAmt.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                          Remaining
                        </Typography>
                        <Typography variant="h6" color="warning.main" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                          {remainingAmt.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Additional Details */}
                    <Stack spacing={0.5} sx={{ mb: 1 }}>
                      {expense.quantity && (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          📦 <strong>Quantity:</strong> {expense.quantity}{expense.unit ? ' ' + expense.unit : ''}
                          {expense.rate && (
                            <span style={{ color: '#666', marginLeft: '8px' }}>
                              @ {parseFloat(expense.rate).toFixed(2)}/unit = {(parseFloat(expense.quantity) * parseFloat(expense.rate)).toFixed(2)}
                            </span>
                          )}
                        </Typography>
                      )}
                      {expense.area && (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          🏢 <strong>Area:</strong> {expense.area}
                        </Typography>
                      )}
                      {expense.vendor && (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          🏪 <strong>Vendor:</strong> {expense.vendor}
                        </Typography>
                      )}
                      {(expense.notesHtml || expense.notes || expense.description) && (
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                            💬 Notes
                          </Typography>
                          <Box
                            sx={{
                              fontSize: '0.8rem',
                              color: 'text.secondary',
                              '& p, & div': { m: 0 },
                              '& ul, & ol': { mt: 0.25, mb: 0.25, pl: 2 },
                            }}
                            dangerouslySetInnerHTML={{
                              __html: sanitizeRichText(expense.notesHtml || expense.notes || expense.description || ''),
                            }}
                          />
                        </Box>
                      )}
                      {expense.imageData && (
                        <Box sx={{ mt: 0.75 }}>
                          <Button
                            variant="text"
                            onClick={() => handleOpenImagePreview(expense.imageData, expense.imageName || 'Expense image')}
                            sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                          >
                            <Avatar
                              variant="rounded"
                              src={expense.imageData}
                              alt={expense.imageName || 'expense attachment'}
                              sx={{ width: { xs: 52, sm: 64 }, height: { xs: 52, sm: 64 }, border: '0.5px solid', borderColor: 'rgba(0,0,0,0.12)' }}
                            />
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                  
                  {/* Action Buttons - Always Visible at Bottom */}
                  <CardActions sx={{ 
                    justifyContent: 'flex-end', 
                    px: 2, 
                    pb: 2, 
                    pt: 0,
                    bgcolor: 'rgba(255,255,255,0.7)'
                  }}>
                    <Button
                      size="medium"
                      variant="contained"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(expense)}
                      sx={{ 
                        flex: 1,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 2
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="medium"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(expense.id)}
                      sx={{ 
                        flex: 1,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 2
                      }}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Stack>
        ) : (
          // TABLE VIEW - For Desktop/Tablet
          <Paper elevation={3}>
            <Box sx={{ 
              p: 2.5, 
              borderBottom: '2px solid',
              borderColor: 'primary.main',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <Typography variant="h6" fontWeight="bold">
                📊 Expense Records
              </Typography>
              <Typography variant="caption">
                {filteredExpenses.length > 0 ? `Showing ${filteredExpenses.length} filtered expense(s)` : `All ${expenses.length} expenses`}
              </Typography>
            </Box>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)', overflowX: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Sub-Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Vendor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Paid</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Remaining</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Area</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Notes</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Image</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100', fontSize: '0.875rem', py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.map((expense) => {
                  const categoryInfo = categories.find(c => c.name === expense.category);
                  const statusColors = getStatusColor(expense.paymentStatus);
                  const totalAmt = getAmount(expense);
                  const paidAmt = getPaidAmount(expense);
                  const remainingAmt = getRemainingAmount(expense);
                  
                  return (
                    <TableRow 
                      key={expense.id}
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'grey.50' },
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: statusColors.bg,
                        borderLeft: `5px solid ${statusColors.border}`,
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500, py: 2 }}>
                        {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={expense.category}
                          size="small"
                          sx={{ 
                            bgcolor: categoryInfo?.color + '40',
                            color: categoryInfo?.color,
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', py: 2 }}>
                        {expense.subCategory || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500, py: 2 }}>
                        {expense.vendor || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500, py: 2 }}>
                        {expense.quantity ? (
                          <span>
                            {expense.quantity}{expense.unit ? ' ' + expense.unit : ''}
                            {expense.rate && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#666' }}>
                                @ {parseFloat(expense.rate).toFixed(2)}
                              </span>
                            )}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem', py: 2 }}>
                        {totalAmt.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'success.main', fontSize: '0.9rem', py: 2 }}>
                        {paidAmt.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'warning.main', fontSize: '0.9rem', py: 2 }}>
                        {remainingAmt.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', py: 2 }}>
                        {expense.area || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', py: 2 }}>
                        {richTextToPlainText(expense.notesHtml || expense.notes || expense.description) || '-'}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {expense.imageData ? (
                          <Button
                            variant="text"
                            onClick={() => handleOpenImagePreview(expense.imageData, expense.imageName || 'Expense image')}
                            sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                          >
                            <Avatar
                              variant="rounded"
                              src={expense.imageData}
                              alt={expense.imageName || 'expense attachment'}
                              sx={{ width: 38, height: 38 }}
                            />
                          </Button>
                        ) : '-'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', py: 2 }}>
                        <IconButton size="small" color="primary" onClick={() => handleEdit(expense)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(expense.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          </Paper>
        )}
      </Paper>

      {/* Floating Action Buttons - Only show when form is hidden */}
      {!showForm && (
        <>
          {/* Quick Add Button - Same size as main button */}
          <Fab
            color="secondary"
            aria-label="quick add expense"
            onClick={() => {
              setQuickAddMode(true);
              setShowForm(true);
            }}
            sx={{
              position: 'fixed',
              bottom: { xs: 152, sm: 102 },
              right: { xs: 16, sm: 24 },
              width: { xs: 64, sm: 72 },
              height: { xs: 64, sm: 72 },
              boxShadow: 4,
              '&:hover': {
                boxShadow: 8,
                transform: 'scale(1.05)',
                transition: 'all 0.3s'
              }
            }}
          >
            <SpeedIcon sx={{ fontSize: { xs: 32, sm: 36 } }} />
          </Fab>
          
          {/* Main Add Expense Button */}
          <Fab
            color="primary"
            aria-label="add expense"
            onClick={() => {
              setQuickAddMode(false);
              setShowForm(true);
            }}
            sx={{
              position: 'fixed',
              bottom: { xs: 80, sm: 24 },
              right: { xs: 16, sm: 24 },
              width: { xs: 64, sm: 72 },
              height: { xs: 64, sm: 72 },
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: 6,
              '&:hover': {
                boxShadow: 12,
                transform: 'scale(1.1)',
                transition: 'all 0.3s'
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            <AddIcon sx={{ fontSize: { xs: 32, sm: 36 } }} />
          </Fab>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            <Typography variant="h6" fontWeight="bold">Delete Expense?</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently remove this expense.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          p: 2, 
          gap: 2, 
          flexDirection: { xs: 'column', sm: 'row' },
          '& > button': {
            width: { xs: '100%', sm: 'auto' }
          }
        }}>
          <Button 
            onClick={() => setDeleteConfirm({ open: false, id: null })}
            variant="outlined"
            size="large"
            sx={{ 
              minWidth: { xs: '100%', sm: 120 },
              order: { xs: 2, sm: 1 }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete}
            variant="contained"
            color="error"
            size="large"
            sx={{ 
              minWidth: { xs: '100%', sm: 120 },
              order: { xs: 1, sm: 2 }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreview.open}
        onClose={() => setImagePreview({ open: false, src: '', name: '' })}
        maxWidth={isMobile ? 'sm' : 'md'}
        fullWidth
        PaperProps={{
          sx: {
            m: { xs: 1.5, sm: 3 },
            width: { xs: 'calc(100% - 24px)', sm: 'auto' },
            maxHeight: { xs: '86vh', sm: '90vh' },
            borderRadius: { xs: 2, sm: 3 },
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {imagePreview.name || 'Expense Image'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: { xs: 170, sm: 320 },
              bgcolor: 'grey.50',
              borderRadius: 1.5,
              border: '0.5px solid',
              borderColor: 'rgba(0,0,0,0.12)',
              p: { xs: 0.75, sm: 1 },
            }}
          >
            {imagePreview.src && (
              <Box
                component="img"
                src={imagePreview.src}
                alt={imagePreview.name || 'Expense image'}
                sx={{
                  maxWidth: '100%',
                  maxHeight: { xs: 300, sm: 520 },
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImagePreview({ open: false, src: '', name: '' })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%', fontSize: '1rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ExpenseEntry;
