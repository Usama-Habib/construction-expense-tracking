import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useExpense } from '../contexts/ExpenseContext';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { expenses, categories, getExpensesByCategory, getExpensesByVendor, getMonthlyTrend } = useExpense();
  const [timeRange, setTimeRange] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

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
    if (exp.remainingAmount !== undefined && exp.remainingAmount !== null && exp.remainingAmount !== '') {
      return parseFloat(exp.remainingAmount) || 0;
    }
    // Calculate remaining from total - paid
    const total = getAmount(exp);
    const paid = getPaidAmount(exp);
    return Math.max(0, total - paid);
  };

  // Filter expenses based on time range, area, and payment status
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
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + getAmount(exp), 0);
  const totalPaid = filteredExpenses.reduce((sum, exp) => sum + getPaidAmount(exp), 0);
  const totalRemaining = filteredExpenses.reduce((sum, exp) => sum + getRemainingAmount(exp), 0);

  // Category breakdown for pie chart
  const categoryData = Object.entries(getExpensesByCategory()).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value);

  // Vendor breakdown for bar chart
  const vendorData = Object.entries(getExpensesByVendor())
    .map(([name, value]) => ({ name: name || 'Unknown', value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Monthly trend for line chart
  const monthlyData = Object.entries(getMonthlyTrend())
    .map(([month, value]) => ({ month, value }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  // Get category colors
  const getCategoryColor = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#999';
  };

  const COLORS = categoryData.map(item => getCategoryColor(item.name));

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 }
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant={isMobile ? "h4" : "h3"}
          fontWeight="bold"
          color="primary"
          gutterBottom
        >
          📊 Dashboard
        </Typography>
        
        {/* Time Range Filter - Stack on mobile */}
        <Box sx={{ mt: 2 }}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, newValue) => newValue && setTimeRange(newValue)}
            size={isMobile ? "small" : "medium"}
            sx={{
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              '& .MuiToggleButton-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.75, sm: 1 },
                flex: isMobile ? '1 1 45%' : 'initial'
              }
            }}
          >
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="year">Year</ToggleButton>
            <ToggleButton value="all">All</ToggleButton>
          </ToggleButtonGroup>
          
          {/* Area Filter */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
              🏢 Filter by Area/Floor:
            </Typography>
            <ToggleButtonGroup
              value={areaFilter}
              exclusive
              onChange={(e, newValue) => newValue && setAreaFilter(newValue)}
              size="small"
              sx={{
                flexWrap: 'wrap',
                '& .MuiToggleButton-root': {
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  px: { xs: 1, sm: 1.5 },
                  py: { xs: 0.5, sm: 0.75 },
                  flex: isMobile ? '0 1 auto' : 'initial'
                }
              }}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="Foundation">Foundation</ToggleButton>
              <ToggleButton value="Ground Floor">Ground</ToggleButton>
              <ToggleButton value="First Floor">1st Floor</ToggleButton>
              <ToggleButton value="Second Floor">2nd Floor</ToggleButton>
              <ToggleButton value="Third Floor">3rd Floor</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {/* Payment Status Filter */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
              ✅ Filter by Payment Status:
            </Typography>
            <ToggleButtonGroup
              value={paymentStatusFilter}
              exclusive
              onChange={(e, newValue) => newValue && setPaymentStatusFilter(newValue)}
              size="small"
              sx={{
                flexWrap: 'wrap',
                '& .MuiToggleButton-root': {
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 }
                }
              }}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="Paid">✅ Paid</ToggleButton>
              <ToggleButton value="Unpaid">⏳ Unpaid</ToggleButton>
              <ToggleButton value="Partial">⚠️ Partial</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>

      {/* Summary Cards - 2 columns on mobile */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card 
            elevation={4}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              height: '100%',
              minHeight: { xs: 120, sm: 140, md: 160 },
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}
          >
            <CardContent sx={{ 
              p: { xs: 2, sm: 2.5, md: 3 },
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="white" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, fontWeight: 600 }}>
                  Total Expenses
                </Typography>
                <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' }, opacity: 0.9 }} />
              </Box>
              <Typography 
                variant="h4"
                color="white" 
                fontWeight="bold"
                sx={{ fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' }, mt: 'auto' }}
              >
                {totalExpenses.toLocaleString()}
              </Typography>
              <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, opacity: 0.9, mt: 0.5 }}>
                PKR
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card 
            elevation={4}
            sx={{ 
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              height: '100%',
              minHeight: { xs: 120, sm: 140, md: 160 },
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}
          >
            <CardContent sx={{ 
              p: { xs: 2, sm: 2.5, md: 3 },
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="white" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, fontWeight: 600 }}>
                  Total Paid
                </Typography>
                <CalendarMonthIcon sx={{ color: 'white', fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' }, opacity: 0.9 }} />
              </Box>
              <Typography 
                variant="h4"
                color="white" 
                fontWeight="bold"
                sx={{ fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' }, mt: 'auto' }}
              >
                {totalPaid.toLocaleString()}
              </Typography>
              <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, opacity: 0.9, mt: 0.5 }}>
                PKR
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card 
            elevation={4}
            sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              height: '100%',
              minHeight: { xs: 120, sm: 140, md: 160 },
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}
          >
            <CardContent sx={{ 
              p: { xs: 2, sm: 2.5, md: 3 },
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="white" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, fontWeight: 600 }}>
                  Transactions
                </Typography>
                <ReceiptIcon sx={{ color: 'white', fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' }, opacity: 0.9 }} />
              </Box>
              <Typography 
                variant="h4"
                color="white" 
                fontWeight="bold"
                sx={{ fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' }, mt: 'auto' }}
              >
                {filteredExpenses.length}
              </Typography>
              <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, opacity: 0.9, mt: 0.5 }}>
                Total entries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card 
            elevation={4}
            sx={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              height: '100%',
              minHeight: { xs: 120, sm: 140, md: 160 },
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}
          >
            <CardContent sx={{ 
              p: { xs: 2, sm: 2.5, md: 3 },
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="white" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, fontWeight: 600 }}>
                  Remaining
                </Typography>
                <TrendingUpIcon sx={{ color: 'white', fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' }, opacity: 0.9 }} />
              </Box>
              <Typography 
                variant="h4"
                color="white" 
                fontWeight="bold"
                sx={{ fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' }, mt: 'auto' }}
              >
                {totalRemaining.toLocaleString()}
              </Typography>
              <Typography color="white" variant="caption" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, opacity: 0.9, mt: 0.5 }}>
                PKR
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section - One Per Row with Insights */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        
        {/* Payment Status Overview */}
        <Grid item xs={12}>
          <Paper 
            elevation={3}
            sx={{ 
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}
          >
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom color="primary">
              💳 Payment Status Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Track how much is paid vs pending across all expenses
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                  <BarChart 
                    data={[
                      { name: 'Total Expenses', amount: totalExpenses, fill: '#667eea' },
                      { name: 'Paid Amount', amount: totalPaid, fill: '#43e97b' },
                      { name: 'Remaining', amount: totalRemaining, fill: '#fa709a' }
                    ]}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 90 : 120}
                    />
                    <Tooltip 
                      formatter={(value) => `${value.toLocaleString()} PKR`}
                      contentStyle={{ fontSize: isMobile ? '0.85rem' : '1rem' }}
                    />
                    <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#667eea' : index === 1 ? '#43e97b' : '#fa709a'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>📊 Insights</Typography>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Payment Progress</Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {totalExpenses > 0 ? ((totalPaid / totalExpenses) * 100).toFixed(1) : 0}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Outstanding Balance</Typography>
                      <Typography variant="h6" fontWeight="bold" color="error.main">
                        {totalRemaining.toLocaleString()} PKR
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {totalRemaining === 0 ? '✅ All Clear' : totalRemaining < totalExpenses * 0.1 ? '🟡 Almost Done' : '🔴 Pending Payments'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Area/Floor Breakdown */}
        {(() => {
          const areaData = {};
          const areaPaid = {};
          const areaRemaining = {};
          
          filteredExpenses.forEach(exp => {
            const area = exp.area || 'Unassigned';
            const amount = getAmount(exp);
            const paid = getPaidAmount(exp);
            const remaining = getRemainingAmount(exp);
            
            areaData[area] = (areaData[area] || 0) + amount;
            areaPaid[area] = (areaPaid[area] || 0) + paid;
            areaRemaining[area] = (areaRemaining[area] || 0) + remaining;
          });
          
          const areaChartData = Object.keys(areaData).map(area => ({
            area,
            total: areaData[area],
            paid: areaPaid[area],
            remaining: areaRemaining[area]
          })).sort((a, b) => b.total - a.total);

          return areaChartData.length > 0 && (
            <Grid item xs={12}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
                }}
              >
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom color="primary">
                  🏢 Expenses by Area/Floor
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Compare spending across different construction areas
                </Typography>
                
                <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                  <BarChart data={areaChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="area" 
                      tick={{ fontSize: isMobile ? 9 : 12 }}
                      angle={isMobile ? -20 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                    />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <Tooltip 
                      formatter={(value) => `${value.toLocaleString()} PKR`}
                      contentStyle={{ fontSize: isMobile ? '0.85rem' : '1rem' }}
                    />
                    <Legend wrapperStyle={{ fontSize: isMobile ? '0.85rem' : '1rem' }} />
                    <Bar dataKey="total" fill="#667eea" name="Total" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="paid" fill="#43e97b" name="Paid" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="remaining" fill="#fa709a" name="Remaining" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          );
        })()}

        {/* Category Breakdown with Details */}
        {categoryData.length > 0 && (
          <Grid item xs={12}>
            <Paper 
              elevation={3}
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)'
              }}
            >
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom color="primary">
                💼 Category Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Breakdown of expenses by category (Contractor, Material, Misc)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent, value }) => 
                          isMobile ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(1)}%`
                        }
                        outerRadius={isMobile ? 90 : 140}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `${value.toLocaleString()} PKR`}
                        contentStyle={{ fontSize: isMobile ? '0.85rem' : '1rem' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>📋 Category Details</Typography>
                    <Stack spacing={2}>
                      {categoryData.map((cat, index) => (
                        <Box 
                          key={cat.name}
                          sx={{ 
                            p: 1.5, 
                            borderRadius: 1, 
                            bgcolor: COLORS[index] + '20',
                            border: `2px solid ${COLORS[index]}`
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body1" fontWeight="bold">{cat.name}</Typography>
                            <Typography variant="body1" fontWeight="bold" color={COLORS[index]}>
                              {cat.value.toLocaleString()} PKR
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {((cat.value / totalExpenses) * 100).toFixed(1)}% of total budget
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Monthly Trend with Paid vs Total */}
        {monthlyData.length > 1 && (
          <Grid item xs={12}>
            <Paper 
              elevation={3}
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
              }}
            >
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom color="primary">
                📈 Monthly Spending Trend
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Track how your construction expenses have evolved over the past 6 months
              </Typography>
              
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: isMobile ? 9 : 12 }}
                    angle={isMobile ? -20 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <Tooltip 
                    formatter={(value) => `${value.toLocaleString()} PKR`}
                    contentStyle={{ fontSize: isMobile ? '0.85rem' : '1rem' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: isMobile ? '0.85rem' : '1rem' }} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#1976d2" 
                    strokeWidth={isMobile ? 2 : 4}
                    name="Total Expenses"
                    dot={{ r: isMobile ? 4 : 6, fill: '#1976d2' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Top Vendors */}
        {vendorData.length > 0 && (
          <Grid item xs={12}>
            <Paper 
              elevation={3}
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
              }}
            >
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom color="primary">
                🏪 Top Vendors
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your highest spending vendors ranked by total amount
              </Typography>
              
              <ResponsiveContainer width="100%" height={Math.max(vendorData.length * 50, isMobile ? 250 : 350)}>
                <BarChart data={vendorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={isMobile ? 80 : 120}
                    tick={{ fontSize: isMobile ? 9 : 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => `${value.toLocaleString()} PKR`}
                    contentStyle={{ fontSize: isMobile ? '0.85rem' : '1rem' }}
                  />
                  <Bar dataKey="value" fill="#1976d2" radius={[0, 8, 8, 0]}>
                    {vendorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${210 + index * 20}, 70%, 50%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Empty State */}
      {expenses.length === 0 && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            bgcolor: 'grey.50',
            borderRadius: 2,
            mt: 4
          }}
        >
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No expenses yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Start adding expenses to see your dashboard come to life!
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Dashboard;
