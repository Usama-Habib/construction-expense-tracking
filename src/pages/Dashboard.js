import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  LabelList,
} from 'recharts';
import { useExpense } from '../contexts/ExpenseContext';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import ConstructionIcon from '@mui/icons-material/Construction';
import CategoryIcon from '@mui/icons-material/Category';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { expenses } = useExpense();
  const [timeRange, setTimeRange] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  // Helper functions
  const getAmount = (exp) => parseFloat(exp.totalAmount || exp.amount) || 0;
  const getPaidAmount = (exp) => {
    if (exp.paidAmount !== undefined && exp.paidAmount !== null && exp.paidAmount !== '') {
      return parseFloat(exp.paidAmount) || 0;
    }
    if (exp.paymentStatus === 'Clear' || exp.paymentStatus === 'Paid') {
      return parseFloat(exp.totalAmount || exp.amount) || 0;
    }
    return 0;
  };
  const getRemainingAmount = (exp) => {
    if (exp.remainingAmount !== undefined && exp.remainingAmount !== null && exp.remainingAmount !== '') {
      return parseFloat(exp.remainingAmount) || 0;
    }
    const total = getAmount(exp);
    const paid = getPaidAmount(exp);
    return Math.max(0, total - paid);
  };

  // Filter expenses based on filters
  const getFilteredExpenses = () => {
    const now = new Date();
    const filtered = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      
      // Time range filter
      let timeMatch = true;
      switch (timeRange) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          timeMatch = expDate >= weekAgo;
          break;
        case 'month':
          timeMatch = expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
          break;
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const expQuarter = Math.floor(expDate.getMonth() / 3);
          timeMatch = expQuarter === currentQuarter && expDate.getFullYear() === now.getFullYear();
          break;
        case 'year':
          timeMatch = expDate.getFullYear() === now.getFullYear();
          break;
        default:
          timeMatch = true;
      }
      
      // Area filter
      const areaMatch = areaFilter === 'all' || exp.area === areaFilter;
      
      // Payment status filter
      const statusMatch = paymentStatusFilter === 'all' || exp.paymentStatus === paymentStatusFilter;
      
      return timeMatch && areaMatch && statusMatch;
    });
    return filtered;
  };

  const filteredExpenses = getFilteredExpenses();
  
  // KPI Calculations
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + getAmount(exp), 0);
  const totalPaid = filteredExpenses.reduce((sum, exp) => sum + getPaidAmount(exp), 0);
  const totalRemaining = filteredExpenses.reduce((sum, exp) => sum + getRemainingAmount(exp), 0);
  const transactionCount = filteredExpenses.length;
  
  // Contractor Cost (Paid to contractor)
  const contractorCost = filteredExpenses
    .filter(exp => exp.category === 'Contractor')
    .reduce((sum, exp) => sum + getPaidAmount(exp), 0);
  
  // Material Cost
  const materialCost = filteredExpenses
    .filter(exp => exp.category === 'Material')
    .reduce((sum, exp) => sum + getAmount(exp), 0);

  // Material Cost Breakdown (by subcategory)
  const materialBreakdown = {};
  filteredExpenses
    .filter(exp => exp.category === 'Material')
    .forEach(exp => {
      const subCat = exp.subCategory || 'Others';
      materialBreakdown[subCat] = (materialBreakdown[subCat] || 0) + getAmount(exp);
    });
  
  const materialDataRaw = Object.entries(materialBreakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalMaterialForShare = materialDataRaw.reduce((sum, item) => sum + item.value, 0);
  const topMaterialData = materialDataRaw.slice(0, 8);
  const otherMaterialValue = materialDataRaw.slice(8).reduce((sum, item) => sum + item.value, 0);
  const materialData = [
    ...topMaterialData,
    ...(otherMaterialValue > 0 ? [{ name: 'Others', value: otherMaterialValue }] : []),
  ].map((item) => ({
    ...item,
    share: totalMaterialForShare > 0 ? (item.value / totalMaterialForShare) * 100 : 0,
  }));

  // Monthly Paid Amount Breakdown
  const monthlyPaidData = {};
  filteredExpenses.forEach(exp => {
    const date = new Date(exp.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!monthlyPaidData[monthKey]) {
      monthlyPaidData[monthKey] = { monthKey, month: monthLabel, paid: 0, total: 0, remaining: 0 };
    }
    const paidAmt = getPaidAmount(exp);
    const totalAmt = getAmount(exp);
    monthlyPaidData[monthKey].paid += paidAmt;
    monthlyPaidData[monthKey].total += totalAmt;
    monthlyPaidData[monthKey].remaining += (totalAmt - paidAmt);
  });
  
  const monthlyData = Object.values(monthlyPaidData)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .slice(-6); // Last 6 months

  // Expense Trend Over Time (Cumulative)
  const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cumulative = 0;
  const trendData = sortedExpenses.reduce((acc, exp) => {
    cumulative += getAmount(exp);
    const dateKey = new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Group by same date
    const existing = acc.find(item => item.date === dateKey);
    if (existing) {
      existing.cumulative = cumulative;
    } else {
      acc.push({ date: dateKey, cumulative });
    }
    return acc;
  }, []).slice(-20); // Last 20 data points for better visualization

  // Material colors
  const MATERIAL_COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

  return (
    <Box 
      sx={{ 
        width: '100%',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2, md: 3 },
        maxWidth: '100%'
      }}
    >
      {/* Filters Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={{ xs: 2, sm: 2 }}>
          {/* Duration Filter - Dropdown */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="medium">
              <InputLabel id="duration-label" sx={{ fontSize: { xs: '1rem', sm: '0.9rem' }, '&.MuiInputLabel-shrink': { fontSize: { xs: '0.75rem', sm: '0.7rem' } } }}>Duration</InputLabel>
              <Select
                labelId="duration-label"
                value={timeRange}
                label="Duration"
                onChange={(e) => setTimeRange(e.target.value)}
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1rem' },
                  minHeight: { xs: 56, sm: 52 }
                }}
              >
                <MenuItem value="week" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>Last Week</MenuItem>
                <MenuItem value="month" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>This Month</MenuItem>
                <MenuItem value="quarter" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>This Quarter</MenuItem>
                <MenuItem value="year" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>This Year</MenuItem>
                <MenuItem value="all" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Area Filter */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="medium">
              <InputLabel id="area-label" sx={{ fontSize: { xs: '1rem', sm: '0.9rem' }, '&.MuiInputLabel-shrink': { fontSize: { xs: '0.75rem', sm: '0.7rem' } } }}>Area/Floor</InputLabel>
              <Select
                labelId="area-label"
                value={areaFilter}
                label="Area/Floor"
                onChange={(e) => setAreaFilter(e.target.value)}
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1rem' },
                  minHeight: { xs: 56, sm: 52 }
                }}
              >
                <MenuItem value="all" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>All</MenuItem>
                <MenuItem value="Foundation" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>Foundation</MenuItem>
                <MenuItem value="Ground Floor" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>Ground Floor</MenuItem>
                <MenuItem value="First Floor" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>First Floor</MenuItem>
                <MenuItem value="Second Floor" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>Second Floor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Payment Status Filter */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="medium">
              <InputLabel id="status-label" sx={{ fontSize: { xs: '1rem', sm: '0.9rem' }, '&.MuiInputLabel-shrink': { fontSize: { xs: '0.75rem', sm: '0.7rem' } } }}>Payment Status</InputLabel>
              <Select
                labelId="status-label"
                value={paymentStatusFilter}
                label="Payment Status"
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1rem' },
                  minHeight: { xs: 56, sm: 52 }
                }}
              >
                <MenuItem value="all" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>All Status</MenuItem>
                <MenuItem value="Clear" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>✅ Paid</MenuItem>
                <MenuItem value="Pending" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>⏳ Pending</MenuItem>
                <MenuItem value="Partial" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>⚠️ Partial</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* KPI Cards - 6 cards in 2 rows on mobile, 1 row on desktop */}
      <Grid 
        container 
        spacing={{ xs: 2, sm: 2, md: 3 }} 
        sx={{ 
          mb: 4
        }}
      >
        {/* Total Paid */}
        <Grid item xs={6} sm={4} md={2} sx={{ display: 'flex' }}>
          <Card 
            elevation={4}
            sx={{ 
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 140, sm: 150, md: 150 },
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2, md: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' }, fontWeight: 600 }}>
                  Total Paid
                </Typography>
                <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: { xs: '1.4rem', sm: '1.5rem' }, opacity: 0.9 }} />
              </Box>
              <Typography variant="h5" color="white" fontWeight="bold" sx={{ fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.8rem' }, mb: 0.5 }}>
                {totalPaid.toLocaleString()}
              </Typography>
              <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' }, opacity: 0.9 }}>
                PKR
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Remaining */}
        <Grid item xs={6} sm={4} md={2} sx={{ display: 'flex' }}>
          <Card 
            elevation={4}
            sx={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 140, sm: 150, md: 150 },
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2, md: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' }, fontWeight: 600 }}>
                  Remaining
                </Typography>
                <MoneyOffIcon sx={{ color: 'white', fontSize: { xs: '1.4rem', sm: '1.5rem' }, opacity: 0.9 }} />
              </Box>
              <Typography variant="h5" color="white" fontWeight="bold" sx={{ fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.8rem' }, mb: 0.5 }}>
                {totalRemaining.toLocaleString()}
              </Typography>
              <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' }, opacity: 0.9 }}>
                PKR
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Transactions */}
        <Grid item xs={6} sm={4} md={2} sx={{ display: 'flex' }}>
          <Card 
            elevation={4}
            sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 140, sm: 150, md: 150 },
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2, md: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' }, fontWeight: 600 }}>
                  Transactions
                </Typography>
                <ReceiptIcon sx={{ color: 'white', fontSize: { xs: '1.4rem', sm: '1.5rem' }, opacity: 0.9 }} />
              </Box>
              <Typography variant="h5" color="white" fontWeight="bold" sx={{ fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.8rem' }, mb: 0.5 }}>
                {transactionCount}
              </Typography>
              <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' }, opacity: 0.9 }}>
                Total entries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Contractor Cost */}
        <Grid item xs={6} sm={4} md={2} sx={{ display: 'flex' }}>
          <Card 
            elevation={4}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 140, sm: 150, md: 150 },
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2, md: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' }, fontWeight: 600 }}>
                  Contractor Cost
                </Typography>
                <ConstructionIcon sx={{ color: 'white', fontSize: { xs: '1.4rem', sm: '1.5rem' }, opacity: 0.9 }} />
              </Box>
              <Typography variant="h5" color="white" fontWeight="bold" sx={{ fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.8rem' }, mb: 0.5 }}>
                {contractorCost.toLocaleString()}
              </Typography>
              <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' }, opacity: 0.9 }}>
                PKR Paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Material Cost */}
        <Grid item xs={6} sm={4} md={2} sx={{ display: 'flex' }}>
          <Card 
            elevation={4}
            sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 140, sm: 150, md: 150 },
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2, md: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' }, fontWeight: 600 }}>
                  Material Cost
                </Typography>
                <CategoryIcon sx={{ color: 'white', fontSize: { xs: '1.4rem', sm: '1.5rem' }, opacity: 0.9 }} />
              </Box>
              <Typography variant="h5" color="white" fontWeight="bold" sx={{ fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.8rem' }, mb: 0.5 }}>
                {materialCost.toLocaleString()}
              </Typography>
              <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' }, opacity: 0.9 }}>
                PKR Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Expenses */}
        <Grid item xs={6} sm={4} md={2} sx={{ display: 'flex' }}>
          <Card 
            elevation={4}
            sx={{ 
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 140, sm: 150, md: 150 },
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2, md: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' }, fontWeight: 600 }}>
                  Total Expenses
                </Typography>
                <TrendingUpIcon sx={{ color: 'white', fontSize: { xs: '1.4rem', sm: '1.5rem' }, opacity: 0.9 }} />
              </Box>
              <Typography variant="h5" color="white" fontWeight="bold" sx={{ fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.8rem' }, mb: 0.5 }}>
                {totalExpenses.toLocaleString()}
              </Typography>
              <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' }, opacity: 0.9 }}>
                PKR
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        
        {/* Material Cost Breakdown */}
        {materialData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3}
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                backgroundColor: '#ffffff',
                height: { xs: 400, sm: 450 }
              }}
            >
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom color="primary">
                🧱 Material Cost Breakdown
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Top material spend with percentage share and grouped Others
              </Typography>
              
              <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                <BarChart
                    data={materialData}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: isMobile ? 9 : 11 }} />
                  <YAxis type="category" dataKey="name" width={isMobile ? 80 : 110} tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <Tooltip 
                    formatter={(value, key, payload) => {
                      if (key === 'value') {
                        return [`${Number(value).toLocaleString()} PKR`, 'Amount'];
                      }
                      return [`${payload?.payload?.share?.toFixed(1)}%`, 'Share'];
                    }}
                    contentStyle={{ fontSize: isMobile ? '0.85rem' : '1rem' }}
                  />
                  <Legend formatter={(value) => value === 'value' ? 'Amount' : 'Share %'} />
                  <Bar dataKey="value" name="value" radius={[0, 8, 8, 0]}>
                    {materialData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={MATERIAL_COLORS[index % MATERIAL_COLORS.length]} />
                    ))}
                    <LabelList dataKey="share" position="right" formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Monthly Paid Amount Breakdown */}
        {monthlyData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3}
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                backgroundColor: '#ffffff',
                height: { xs: 400, sm: 450 }
              }}
            >
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom color="primary">
                💰 Monthly Payment Breakdown
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total vs Remaining (Not Paid) expenses per month
              </Typography>
              
              <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: isMobile ? 9 : 11 }}
                    angle={isMobile ? -20 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 9 : 11 }} />
                  <Tooltip 
                    formatter={(value) => `${value.toLocaleString()} PKR`}
                    contentStyle={{ fontSize: isMobile ? '0.85rem' : '1rem' }}
                  />
                  <Legend wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.9rem' }} />
                  <Bar dataKey="total" fill="#667eea" name="Total" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="remaining" fill="#fa709a" name="Not Paid" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Expense Trend Over Time */}
        {trendData.length > 1 && (
          <Grid item xs={12}>
            <Paper 
              elevation={3}
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                backgroundColor: '#ffffff',
                height: { xs: 400, sm: 450 }
              }}
            >
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom color="primary">
                📈 Expense Trend Over Time
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cumulative expense growth to track project progress
              </Typography>
              
              <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: isMobile ? 9 : 11 }}
                    angle={isMobile ? -20 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 9 : 11 }} />
                  <Tooltip 
                    formatter={(value) => `${value.toLocaleString()} PKR`}
                    contentStyle={{ fontSize: isMobile ? '0.85rem' : '1rem' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#667eea" 
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCumulative)"
                    name="Cumulative Expense"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
