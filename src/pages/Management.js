import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useExpense } from '../contexts/ExpenseContext';

const Management = () => {
  const { categories, vendors, addCategory, updateCategory, deleteCategory, addVendor, updateVendor, deleteVendor } = useExpense();
  const [activeTab, setActiveTab] = useState(0);
  const [categoryDialog, setCategoryDialog] = useState({ open: false, editing: null });
  const [vendorDialog, setVendorDialog] = useState({ open: false, editing: null });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: '📦',
    color: '#999999',
    subCategories: '',
  });

  const [vendorForm, setVendorForm] = useState({
    name: '',
    contact: '',
    email: '',
    notes: '',
  });

  const getSubCategoryName = (subCategory) => {
    if (typeof subCategory === 'string') return subCategory;
    return subCategory?.name || '';
  };

  const isSubCategoryEnabled = (subCategory) => {
    if (typeof subCategory === 'string') return true;
    return subCategory?.enabled !== false;
  };

  // Category Handlers
  const handleCategorySubmit = () => {
    const subCategoriesArray = categoryForm.subCategories
      .split(',')
      .map(s => s.trim())
      .filter(s => s);

    if (categoryDialog.editing) {
      updateCategory(categoryDialog.editing, {
        ...categoryForm,
        subCategories: subCategoriesArray,
      });
    } else {
      addCategory({
        ...categoryForm,
        subCategories: subCategoriesArray,
      });
    }

    setCategoryDialog({ open: false, editing: null });
    setCategoryForm({ name: '', icon: '📦', color: '#999999', subCategories: '' });
  };

  const handleCategoryEdit = (category) => {
    setCategoryForm({
      name: category.name,
      icon: category.icon,
      color: category.color,
      subCategories: (category.subCategories || []).map(getSubCategoryName).join(', '),
    });
    setCategoryDialog({ open: true, editing: category.id });
  };

  const handleToggleMaterialSubCategory = (category, subIndex) => {
    const updatedSubCategories = (category.subCategories || []).map((sub, index) => {
      if (index !== subIndex) {
        if (typeof sub === 'string') return { name: sub, enabled: true };
        return sub;
      }

      if (typeof sub === 'string') {
        return { name: sub, enabled: false };
      }

      return { ...sub, enabled: !isSubCategoryEnabled(sub) };
    });

    updateCategory(category.id, {
      ...category,
      subCategories: updatedSubCategories,
    });
  };

  const handleCategoryDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategory(id);
    }
  };

  // Vendor Handlers
  const handleVendorSubmit = () => {
    if (vendorDialog.editing) {
      updateVendor(vendorDialog.editing, vendorForm);
    } else {
      addVendor(vendorForm);
    }

    setVendorDialog({ open: false, editing: null });
    setVendorForm({ name: '', contact: '', email: '', notes: '' });
  };

  const handleVendorEdit = (vendor) => {
    if (!vendor) return;
    setVendorForm({
      name: vendor.name || '',
      contact: vendor.contact || '',
      email: vendor.email || '',
      notes: vendor.notes || '',
    });
    setVendorDialog({ open: true, editing: vendor.id });
  };

  const handleVendorDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      deleteVendor(id);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Manage Settings
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Categories" />
          <Tab label="Vendors" />
        </Tabs>

        {/* Categories Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Categories</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCategoryDialog({ open: true, editing: null })}
              >
                Add Category
              </Button>
            </Box>

            <Grid container spacing={2}>
              {categories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <Paper
                    sx={{
                      p: 2,
                      borderLeft: 4,
                      borderColor: category.color,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6">
                          {category.icon} {category.name}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {(category.subCategories || []).map((sub) => (
                            <Chip
                              key={getSubCategoryName(sub)}
                              label={getSubCategoryName(sub)}
                              size="small"
                              color={isSubCategoryEnabled(sub) ? 'default' : 'warning'}
                              variant={isSubCategoryEnabled(sub) ? 'filled' : 'outlined'}
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => handleCategoryEdit(category)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleCategoryDelete(category.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {category.name === 'Material' && (
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Toggle material sub-categories in the expense form
                        </Typography>
                        {(category.subCategories || []).map((sub, subIndex) => (
                          <FormControlLabel
                            key={`${category.id}-${getSubCategoryName(sub)}`}
                            control={
                              <Switch
                                size="small"
                                checked={isSubCategoryEnabled(sub)}
                                onChange={() => handleToggleMaterialSubCategory(category, subIndex)}
                              />
                            }
                            label={getSubCategoryName(sub)}
                            sx={{ display: 'flex', width: '100%', m: 0 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Vendors Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Vendors & Suppliers</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setVendorDialog({ open: true, editing: null })}
              >
                Add Vendor
              </Button>
            </Box>

            <List>
              {vendors.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No vendors added yet. Add your first vendor!
                </Typography>
              ) : (
                vendors.map((vendor) => {
                  // Ensure vendor fields are strings, not objects
                  const vendorName = typeof vendor.name === 'string' ? vendor.name : (vendor.name?.name || 'Unnamed Vendor');
                  const vendorContact = typeof vendor.contact === 'string' ? vendor.contact : '';
                  const vendorEmail = typeof vendor.email === 'string' ? vendor.email : '';
                  const vendorNotes = typeof vendor.notes === 'string' ? vendor.notes : '';
                  
                  return (
                  <ListItem
                    key={vendor.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                    secondaryAction={
                      <Box>
                        <IconButton edge="end" onClick={() => handleVendorEdit(vendor)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleVendorDelete(vendor.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={vendorName}
                      secondary={
                        <>
                          {vendorContact && <div>📞 {vendorContact}</div>}
                          {vendorEmail && <div>✉️ {vendorEmail}</div>}
                          {vendorNotes && <div>📝 {vendorNotes}</div>}
                        </>
                      }
                    />
                  </ListItem>
                  );
                })
              )}
            </List>
          </Box>
        )}
      </Paper>

      {/* Category Dialog */}
      <Dialog
        open={categoryDialog.open}
        onClose={() => setCategoryDialog({ open: false, editing: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {categoryDialog.editing ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Category Name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Icon (Emoji)"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                placeholder="📦"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="color"
                label="Color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sub-Categories"
                value={categoryForm.subCategories}
                onChange={(e) => setCategoryForm({ ...categoryForm, subCategories: e.target.value })}
                placeholder="Comma separated (e.g., Cement, Bricks, Steel)"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
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
            onClick={() => setCategoryDialog({ open: false, editing: null })}
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
            onClick={handleCategorySubmit}
            variant="contained"
            size="large"
            disabled={!categoryForm.name}
            sx={{ 
              minWidth: { xs: '100%', sm: 120 },
              order: { xs: 1, sm: 2 }
            }}
          >
            {categoryDialog.editing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vendor Dialog */}
      <Dialog
        open={vendorDialog.open}
        onClose={() => setVendorDialog({ open: false, editing: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {vendorDialog.editing ? 'Edit Vendor' : 'Add New Vendor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Vendor Name"
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Number"
                value={vendorForm.contact}
                onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={vendorForm.email}
                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={vendorForm.notes}
                onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
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
            onClick={() => setVendorDialog({ open: false, editing: null })}
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
            onClick={handleVendorSubmit}
            variant="contained"
            size="large"
            disabled={!vendorForm.name}
            sx={{ 
              minWidth: { xs: '100%', sm: 120 },
              order: { xs: 1, sm: 2 }
            }}
          >
            {vendorDialog.editing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Management;
