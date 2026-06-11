import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  InputAdornment,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  CardActions,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { useExpense } from '../contexts/ExpenseContext';

const PaymentTracker = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { projectConfig, paymentStages, savePaymentStages, expenses } = useExpense();
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  
  const [paymentData, setPaymentData] = useState({
    stageIndex: 0,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [stages, setStages] = useState([]);

  useEffect(() => {
    if (projectConfig?.paymentMilestones) {
      // Sync stages with projectConfig milestones
      // Preserve payment data (amountPaid, paidDate, status, notes) by matching stage names
      const updatedStages = projectConfig.paymentMilestones.map((milestone, index) => {
        // Try to find existing payment data by stage name (more robust than index matching)
        let existingStage = null;
        
        // First check paymentStages for saved data
        if (paymentStages && paymentStages.length > 0) {
          existingStage = paymentStages.find(s => s.name === milestone.stage);
        }
        
        // Fall back to current stages if not found in paymentStages
        if (!existingStage && stages.length > 0) {
          existingStage = stages.find(s => s.name === milestone.stage);
        }
        
        return {
          id: index + 1,
          name: milestone.stage,
          percentage: milestone.percentage, // Always sync percentage from projectConfig
          expectedAmount: 0, // Will be calculated
          amountPaid: existingStage?.amountPaid || 0,
          paidDate: existingStage?.paidDate || '',
          status: existingStage?.status || 'pending', // pending, paid, partial
          notes: existingStage?.notes || '',
        };
      });
      setStages(updatedStages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectConfig, paymentStages]); // Re-sync whenever config or saved stages change

  if (!projectConfig) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please configure your project first from the Project Setup page.
        </Alert>
      </Container>
    );
  }

  // Calculate expected amount for each stage based on committed cost
  const calculateExpectedAmount = (percentage) => {
    const foundationCost = (parseFloat(projectConfig.foundationArea) || 0) * (parseFloat(projectConfig.myFoundationRate) || 0);
    const floorsCost = 
      ((parseFloat(projectConfig.groundFloorArea) || 0) + (parseFloat(projectConfig.firstFloorArea) || 0) + (parseFloat(projectConfig.secondFloorArea) || 0)) * 
      (parseFloat(projectConfig.myFurnishedRate) || 0);
    
    const totalCommitted = foundationCost + floorsCost;
    return (totalCommitted * (parseFloat(percentage) || 0)) / 100;
  };

  // Calculate totals from stages
  const totalPaidFromStages = stages.reduce((sum, stage) => sum + (parseFloat(stage.amountPaid) || 0), 0);
  
  // Get actual contractor payments from expense tracker
  const contractorExpenses = (expenses || []).filter(e => 
    e.category === 'Contractor' && e.subcategory === 'Payment'
  );
  
  // Debug: Log contractor expenses
  console.log('All expenses:', expenses?.length || 0);
  console.log('Contractor expenses found:', contractorExpenses.length);
  console.log('Contractor expenses:', contractorExpenses);
  
  const totalPaidFromExpenses = contractorExpenses.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0), 0
  );
  
  console.log('Total from expenses:', totalPaidFromExpenses);
  console.log('Total from stages:', totalPaidFromStages);
  
  // Use the higher value (either from stage tracking or actual expenses)
  const totalPaid = Math.max(totalPaidFromStages, totalPaidFromExpenses);
  
  const totalExpected = stages.reduce((sum, stage) => {
    const expected = calculateExpectedAmount(stage.percentage);
    return sum + expected;
  }, 0);
  const completedStages = stages.filter(s => s.status === 'paid').length;

  const handleOpenPayment = (stageIndex) => {
    const stage = stages[stageIndex];
    setEditingStage(stageIndex);
    setPaymentData({
      stageIndex,
      amount: stage.amountPaid || '',
      date: stage.paidDate || new Date().toISOString().split('T')[0],
      notes: stage.notes || '',
    });
    setPaymentDialog(true);
  };

  const handleSavePayment = async () => {
    const updatedStages = [...stages];
    const stage = updatedStages[paymentData.stageIndex];
    
    const amount = parseFloat(paymentData.amount) || 0;
    const expected = calculateExpectedAmount(stage.percentage);
    
    updatedStages[paymentData.stageIndex] = {
      ...stage,
      amountPaid: amount,
      paidDate: paymentData.date,
      notes: paymentData.notes,
      status: amount >= expected ? 'paid' : amount > 0 ? 'partial' : 'pending',
    };

    setStages(updatedStages);
    await savePaymentStages(updatedStages);
    setPaymentDialog(false);
    setPaymentData({ stageIndex: 0, amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
  };

  const renderStatusChip = (status) => {
    switch (status) {
      case 'paid':
        return <Chip icon={<CheckCircleIcon />} label="Paid" color="success" size="small" />;
      case 'partial':
        return <Chip icon={<PendingIcon />} label="Partial" color="warning" size="small" />;
      default:
        return <Chip label="Pending" color="default" size="small" />;
    }
  };

  const progressPercentage = (totalPaid / totalExpected) * 100 || 0;

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100vh',
      overflow: 'auto',
      bgcolor: '#f5f7fa'
    }}>
      <Container maxWidth="xl" sx={{ 
        py: { xs: 2, md: 3 }, 
        px: { xs: 2, md: 3 },
        minHeight: '100%',
        maxWidth: '100%'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          💳 Payment & Progress Tracker
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Track payments by stage
        </Typography>

      {/* Info Alert if showing expense tracker data */}
      {totalPaidFromExpenses > 0 && totalPaidFromStages === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Showing Rs {Math.round(totalPaidFromExpenses).toLocaleString()}</strong> from your Contractor expenses.
            Click the + button on each stage below to record which payment belongs to which stage.
          </Typography>
        </Alert>
      )}

      {/* Debug info */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Debug Information:</strong>
        </Typography>
        <Typography variant="caption" component="div">
          • Total expenses loaded: {expenses?.length || 0}<br/>
          • Contractor expenses found: {contractorExpenses.length}<br/>
          • Total from contractor expenses: Rs {Math.round(totalPaidFromExpenses).toLocaleString()}<br/>
          • Total from stages: Rs {Math.round(totalPaidFromStages).toLocaleString()}<br/>
          • Final total shown: Rs {Math.round(totalPaid).toLocaleString()}
        </Typography>
        {contractorExpenses.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Contractor Payments:
            </Typography>
            {contractorExpenses.map((exp, i) => (
              <Typography key={i} variant="caption" component="div">
                • {exp.date}: Rs {Math.round(exp.amount).toLocaleString()} - {exp.description || 'No description'}
              </Typography>
            ))}
          </Box>
        )}
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total Paid
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                Rs {Math.round(totalPaid).toLocaleString()}
              </Typography>
              <Typography variant="caption">
                of Rs {Math.round(totalExpected).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Stages Completed
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {completedStages} / {stages.length}
              </Typography>
              <Typography variant="caption">
                {((completedStages / stages.length) * 100).toFixed(0)}% complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Payment Progress
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {progressPercentage.toFixed(1)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(progressPercentage, 100)} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Stages Table/Cards */}
      {isMobile ? (
        // CARD VIEW for Mobile
        <Box>
          <Stack spacing={2}>
            {stages.map((stage, index) => {
              const expected = calculateExpectedAmount(stage.percentage);
              const variance = (stage.amountPaid || 0) - expected;
              const milestone = projectConfig?.paymentMilestones?.[index];
              const stageLevels = milestone?.levels || (milestone?.level ? [milestone.level] : []);
              
              return (
                <Card 
                  key={stage.id}
                  elevation={2}
                  sx={{ 
                    borderLeft: `6px solid ${theme.palette.primary.main}`,
                    '&:active': {
                      transform: 'scale(0.98)',
                      transition: 'transform 0.1s'
                    }
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip 
                            label={index + 1} 
                            size="small" 
                            color="primary" 
                            sx={{ fontWeight: 700 }}
                          />
                          <Chip 
                            label={`${stage.percentage}%`} 
                            size="small" 
                            color="info"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }}>
                          {stage.name}
                        </Typography>
                        {stage.paidDate && (
                          <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            📅 {new Date(stage.paidDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                      {renderStatusChip(stage.status)}
                    </Box>
                    
                    {stageLevels.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {stageLevels.map(level => (
                          <Chip 
                            key={level}
                            label={level.charAt(0).toUpperCase() + level.slice(1)} 
                            size="small" 
                            variant="filled"
                            sx={{
                              bgcolor: 
                                level === 'foundation' ? '#9e9e9e' :
                                level === 'ground' ? '#2196f3' :
                                level === 'first' ? '#9c27b0' :
                                '#00bcd4',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr',
                      gap: 2,
                      p: 1.5,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      mb: variance !== 0 && (stage.amountPaid || 0) > 0 ? 1 : 0
                    }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                          💰 Expected
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {Math.round(expected).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                          ✅ Paid
                        </Typography>
                        <Typography 
                          variant="h6" 
                          fontWeight="bold" 
                          color={(stage.amountPaid || 0) > 0 ? 'success.main' : 'text.secondary'}
                        >
                          {(stage.amountPaid || 0) > 0 
                            ? Math.round(stage.amountPaid || 0).toLocaleString() 
                            : '-'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {variance !== 0 && (stage.amountPaid || 0) > 0 && (
                      <Alert 
                        severity={variance > 0 ? 'error' : 'success'} 
                        icon={false}
                        sx={{ py: 0.5 }}
                      >
                        <Typography variant="caption" fontWeight={600}>
                          {variance > 0 ? '⚠️ Overpaid:' : '✅ Saved:'} Rs {Math.abs(Math.round(variance)).toLocaleString()}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 0 }}>
                    <Button
                      size="medium"
                      variant="contained"
                      color="primary"
                      startIcon={stage.amountPaid > 0 ? <EditIcon /> : <AddIcon />}
                      onClick={() => handleOpenPayment(index)}
                      sx={{ 
                        flex: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2
                      }}
                    >
                      {stage.amountPaid > 0 ? 'Edit Payment' : 'Record Payment'}
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
            
            {/* Total Card */}
            <Card 
              elevation={3}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  💎 TOTAL
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2
                }}>
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', opacity: 0.9 }}>
                      Expected
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {totalExpected.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', opacity: 0.9 }}>
                      Paid
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {totalPaid.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      ) : (
        // TABLE VIEW for Desktop
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stage</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Level</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>%</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Expected</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Paid</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stages.map((stage, index) => {
                const expected = calculateExpectedAmount(stage.percentage);
                const variance = (stage.amountPaid || 0) - expected;
                const milestone = projectConfig?.paymentMilestones?.[index];
                
                // Handle both new format (levels array) and old format (single level string)
                const stageLevels = milestone?.levels || (milestone?.level ? [milestone.level] : []);
                
                return (
                  <TableRow 
                    key={stage.id}
                    sx={{ 
                      '&:nth-of-type(odd)': { bgcolor: 'grey.50' },
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Chip 
                        label={index + 1} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {stage.name}
                      </Typography>
                      {stage.paidDate && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          📅 {new Date(stage.paidDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {stageLevels.length > 0 ? (
                          stageLevels.map(level => (
                            <Chip 
                              key={level}
                              label={level.charAt(0).toUpperCase() + level.slice(1)} 
                              size="small" 
                              variant="filled"
                              sx={{
                                bgcolor: 
                                  level === 'foundation' ? '#9e9e9e' :
                                  level === 'ground' ? '#2196f3' :
                                  level === 'first' ? '#9c27b0' :
                                  '#00bcd4',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}
                            />
                          ))
                        ) : (
                          <Chip label="N/A" size="small" color="default" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Chip 
                        label={`${stage.percentage}%`} 
                        size="small" 
                        color="info"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Rs {Math.round(expected).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: (stage.amountPaid || 0) > 0 ? 'success.main' : 'text.secondary'
                        }}
                      >
                        {(stage.amountPaid || 0) > 0 
                          ? `Rs ${Math.round(stage.amountPaid || 0).toLocaleString()}` 
                          : '-'}
                      </Typography>
                      {variance !== 0 && (stage.amountPaid || 0) > 0 && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block',
                            color: variance > 0 ? 'error.main' : 'success.main'
                          }}
                        >
                          {variance > 0 ? '+' : ''}{Math.round(variance).toLocaleString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      {renderStatusChip(stage.status)}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenPayment(index)}
                        sx={{ 
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': { 
                            bgcolor: 'primary.dark',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s'
                        }}
                      >
                        {stage.amountPaid > 0 ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Total Row */}
              <TableRow sx={{ 
                bgcolor: 'primary.main',
                '& td': { color: 'white' }
              }}>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2.5 }}>TOTAL</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2.5 }}>
                  Rs {totalExpected.toLocaleString()}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2.5 }}>
                  Rs {totalPaid.toLocaleString()}
                </TableCell>
                <TableCell colSpan={2} sx={{ py: 2.5 }}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialog} 
        onClose={() => setPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {editingStage !== null && stages[editingStage] 
            ? `💵 ${stages[editingStage].name}`
            : '💵 Record Payment'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {editingStage !== null && stages[editingStage] && (
              <Alert severity="info" icon={false} sx={{ fontWeight: 500 }}>
                🎯 Expected Amount: <strong>Rs {calculateExpectedAmount(stages[editingStage].percentage).toLocaleString()}</strong>
              </Alert>
            )}
            
            <TextField
              fullWidth
              type="number"
              label="Amount Paid"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">💰 Rs</InputAdornment>
              }}
              helperText="Enter the actual amount paid for this stage"
              sx={{ '& .MuiOutlinedInput-root': { fontWeight: 500 } }}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Payment Date"
              value={paymentData.date}
              onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <InputAdornment position="start">📅</InputAdornment>
              }}
              helperText="When was this payment made?"
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (optional)"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              placeholder="Any additional notes about this payment..."
              helperText="Add any relevant details or observations"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 2.5, 
          gap: 2, 
          flexDirection: { xs: 'column', sm: 'row' },
          '& > button': {
            width: { xs: '100%', sm: 'auto' }
          }
        }}>
          <Button 
            onClick={() => setPaymentDialog(false)}
            variant="outlined"
            size="large"
            sx={{ 
              minWidth: { xs: '100%', sm: 140 },
              order: { xs: 2, sm: 1 }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSavePayment}
            size="large"
            sx={{ 
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              minWidth: { xs: '100%', sm: 140 },
              order: { xs: 1, sm: 2 }
            }}
          >
            💾 Save Payment
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default PaymentTracker;
