import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useExpense } from '../contexts/ExpenseContext';
import { exportToExcel, importFromExcel, downloadTemplate } from '../utils/excelUtils';

const Reports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { expenses, categories, vendors, bulkAddExpenses } = useExpense();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    try {
      const filename = exportToExcel(expenses, categories, vendors);
      setSnackbar({
        open: true,
        message: `✓ Exported to ${filename}`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Export failed: ${error.message}`,
        severity: 'error',
      });
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await importFromExcel(file);
      
      if (result.success) {
        const shouldMerge = window.confirm(
          `Found ${result.count} expenses.\n\nOK = MERGE with existing\nCancel = REPLACE all data`
        );

        bulkAddExpenses(result.expenses);
        
        setSnackbar({
          open: true,
          message: `✓ Imported ${result.count} expenses!`,
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Import failed: ${error.error || error.message}`,
        severity: 'error',
      });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadTemplate();
      setSnackbar({
        open: true,
        message: '✓ Template downloaded!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Download failed',
        severity: 'error',
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.totalAmount || exp.amount) || 0), 0);

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 }
      }}
    >
      {/* Header */}
      <Typography 
        variant={isMobile ? "h4" : "h3"}
        fontWeight="bold"
        color="primary"
        gutterBottom
        sx={{ mb: 3 }}
      >
        📊 Reports & Data
      </Typography>

      {/* Data Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4}>
          <Card 
            elevation={3}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              height: '100%'
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography variant="h3" color="white" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2.5rem' } }}>
                {expenses.length}
              </Typography>
              <Typography color="white" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Total Transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4}>
          <Card 
            elevation={3}
            sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              height: '100%'
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography variant="h3" color="white" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2.5rem' } }}>
                {categories.length}
              </Typography>
              <Typography color="white" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card 
            elevation={3}
            sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              height: '100%'
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography variant="h3" color="white" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2.5rem' } }}>
                ${totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
              <Typography color="white" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Total Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Section */}
      <Paper 
        elevation={3}
        sx={{ 
          p: { xs: 3, sm: 4 }, 
          mb: 3,
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DownloadIcon color="primary" sx={{ mr: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }} />
          <Typography variant={isMobile ? "h5" : "h5"} fontWeight="bold" color="primary">
            Export Data
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Export all your expense data to Excel with detailed breakdowns, category summaries, and monthly trends.
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth={isMobile}
          onClick={handleExport}
          startIcon={<DownloadIcon />}
          disabled={expenses.length === 0}
          sx={{
            py: { xs: 1.5, sm: 1.2 },
            fontSize: { xs: '1rem', sm: '1rem' },
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: 3
          }}
        >
          Export to Excel
        </Button>

        {expenses.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No expenses to export yet. Add some expenses first!
          </Alert>
        )}
      </Paper>

      {/* Import Section */}
      <Paper 
        elevation={3}
        sx={{ 
          p: { xs: 3, sm: 4 }, 
          mb: 3,
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <UploadIcon color="primary" sx={{ mr: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }} />
          <Typography variant={isMobile ? "h5" : "h5"} fontWeight="bold" color="primary">
            Import Data
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Import expense data from an Excel file. You can merge with existing data or replace it entirely.
        </Typography>

        <input
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          id="import-file"
          type="file"
          onChange={handleImport}
          disabled={importing}
        />
        <label htmlFor="import-file">
          <Button
            variant="contained"
            component="span"
            size="large"
            fullWidth={isMobile}
            startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
            disabled={importing}
            sx={{
              py: { xs: 1.5, sm: 1.2 },
              fontSize: { xs: '1rem', sm: '1rem' },
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 3
            }}
          >
            {importing ? 'Importing...' : 'Import from Excel'}
          </Button>
        </label>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
            💡 Make sure your Excel file has columns: Date, Category, Amount (required)
          </Typography>
        </Alert>
      </Paper>

      {/* Template Download */}
      <Paper 
        elevation={3}
        sx={{ 
          p: { xs: 3, sm: 4 },
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DescriptionIcon color="primary" sx={{ mr: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }} />
          <Typography variant={isMobile ? "h5" : "h5"} fontWeight="bold" color="primary">
            Excel Template
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Download a sample Excel template to see the required format for importing expenses.
        </Typography>

        <Button
          variant="outlined"
          size="large"
          fullWidth={isMobile}
          onClick={handleDownloadTemplate}
          startIcon={<DescriptionIcon />}
          sx={{
            py: { xs: 1.5, sm: 1.2 },
            fontSize: { xs: '1rem', sm: '1rem' },
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none'
          }}
        >
          Download Template
        </Button>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default Reports;
