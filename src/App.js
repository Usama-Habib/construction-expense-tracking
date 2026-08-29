import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CircularProgress, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ExpenseProvider, useExpense } from './contexts/ExpenseContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ExpenseEntry from './pages/ExpenseEntry';
import Management from './pages/Management';
import Reports from './pages/Reports';
import ProjectConfig from './pages/ProjectConfig';
import CostDashboard from './pages/CostDashboard';
import PaymentTracker from './pages/PaymentTracker';
import VendorPayables from './pages/VendorPayables';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Loading wrapper component
function AppContent() {
  const { loading } = useExpense();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          🔥 Loading data from Firestore...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we fetch your expenses
        </Typography>
      </Box>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expense-entry" element={<ExpenseEntry />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Management />} />
          <Route path="/project-config" element={<ProjectConfig />} />
          <Route path="/cost-dashboard" element={<CostDashboard />} />
          <Route path="/payment-tracker" element={<PaymentTracker />} />
          <Route path="/vendor-payables" element={<VendorPayables />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ExpenseProvider>
        <AppContent />
      </ExpenseProvider>
    </ThemeProvider>
  );
}

export default App;
