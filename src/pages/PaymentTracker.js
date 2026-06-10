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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { useExpense } from '../contexts/ExpenseContext';

const PaymentTracker = () => {
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
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4, px: { xs: 2, md: 3 } }}>
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

      {/* Payment Stages Table */}
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
                    bgcolor: stage.status === 'paid' ? 'success.50' : 'inherit',
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {stage.name}
                    </Typography>
                    {stage.paidDate && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(stage.paidDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {stageLevels.length > 0 ? (
                        stageLevels.map(level => (
                          <Chip 
                            key={level}
                            label={level.charAt(0).toUpperCase() + level.slice(1)} 
                            size="small" 
                            color={
                              level === 'foundation' ? 'default' :
                              level === 'ground' ? 'primary' :
                              level === 'first' ? 'secondary' :
                              'info'
                            }
                          />
                        ))
                      ) : (
                        <Chip label="N/A" size="small" color="default" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{stage.percentage}%</TableCell>
                  <TableCell align="right">
                    Rs {Math.round(expected).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: variance > 0 ? 'error.main' : variance < 0 ? 'warning.main' : 'success.main'
                      }}
                    >
                      Rs {Math.round(stage.amountPaid || 0).toLocaleString()}
                    </Typography>
                    {variance !== 0 && stage.amountPaid > 0 && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: variance > 0 ? 'error.main' : 'warning.main'
                        }}
                      >
                        {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {renderStatusChip(stage.status)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenPayment(index)}
                      color="primary"
                    >
                      {stage.amountPaid > 0 ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {/* Total Row */}
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Rs {totalExpected.toLocaleString()}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Rs {totalPaid.toLocaleString()}
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialog} 
        onClose={() => setPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingStage !== null && stages[editingStage] 
            ? `Record Payment - ${stages[editingStage].name}`
            : 'Record Payment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {editingStage !== null && stages[editingStage] && (
              <Alert severity="info">
                Expected Amount: Rs {calculateExpectedAmount(stages[editingStage].percentage).toLocaleString()}
              </Alert>
            )}
            
            <TextField
              fullWidth
              type="number"
              label="Amount Paid"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>
              }}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Payment Date"
              value={paymentData.date}
              onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (optional)"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              placeholder="Any additional notes about this payment..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSavePayment}
            disabled={!paymentData.amount}
          >
            Save Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentTracker;
