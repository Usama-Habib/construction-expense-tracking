import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SyncIcon from '@mui/icons-material/Sync';
import { useExpense } from '../contexts/ExpenseContext';

const PaymentStages = () => {
  const { projectConfig, paymentStages, savePaymentStages, progressData, expenses } = useExpense();
  
  const [stages, setStages] = useState([]);

  const [editDialog, setEditDialog] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);

  useEffect(() => {
    // Priority 1: Load saved payment stages from Firebase
    if (paymentStages && paymentStages.length > 0) {
      setStages(paymentStages);
    }
    // Priority 2: Initialize from projectConfig payment milestones
    else if (projectConfig?.paymentMilestones && projectConfig.paymentMilestones.length > 0) {
      const initialStages = projectConfig.paymentMilestones.map((milestone, index) => ({
        id: index + 1,
        name: milestone.stage,
        percentage: milestone.percentage,
        description: milestone.description,
        expectedWorkStages: milestone.description, // Use description as default expected work
        amountPaid: 0,
        paidDate: '',
        status: 'pending'
      }));
      setStages(initialStages);
    }
  }, [paymentStages, projectConfig]);

  // Sync stage details (name, percentage, description) from projectConfig when it changes
  // But preserve payment data (amountPaid, paidDate, status)
  useEffect(() => {
    if (projectConfig?.paymentMilestones && stages.length > 0) {
      const syncedStages = stages.map((stage, index) => {
        const milestone = projectConfig.paymentMilestones[index];
        if (milestone) {
          return {
            ...stage,
            name: milestone.stage,
            percentage: milestone.percentage,
            description: milestone.description,
            expectedWorkStages: milestone.description
          };
        }
        return stage;
      });
      
      // Only update if there are actual changes
      const hasChanges = syncedStages.some((stage, index) => 
        stage.name !== stages[index].name || 
        stage.percentage !== stages[index].percentage ||
        stage.description !== stages[index].description
      );
      
      if (hasChanges) {
        setStages(syncedStages);
      }
    }
  }, [projectConfig?.paymentMilestones]);

  // Calculate work value at each payment stage
  const calculateExpectedWorkValue = (cumulativePercentage) => {
    if (!projectConfig) return 0;
    
    const totalContract = projectConfig.totalContractAmount || 0;
    return (cumulativePercentage / 100) * totalContract;
  };

  // Calculate actual work value from progress
  const calculateActualWorkValue = () => {
    if (!projectConfig || !progressData) return 0;

    const config = projectConfig;
    const progress = progressData;
    let totalValue = 0;

    // Foundation
    totalValue += (progress.foundation?.progress || 0) / 100 * 
      (config.foundationArea * config.foundationRate);

    // Ground Floor
    totalValue += (progress.groundFloor?.grayProgress || 0) / 100 * 
      (config.groundFloorArea * config.grayStructureRate);
    totalValue += (progress.groundFloor?.finishingProgress || 0) / 100 * 
      (config.groundFloorArea * (config.furnishedRate - config.grayStructureRate));

    // First Floor
    totalValue += (progress.firstFloor?.grayProgress || 0) / 100 * 
      (config.firstFloorArea * config.grayStructureRate);
    totalValue += (progress.firstFloor?.finishingProgress || 0) / 100 * 
      (config.firstFloorArea * (config.furnishedRate - config.grayStructureRate));

    // Second Floor
    totalValue += (progress.secondFloor?.grayProgress || 0) / 100 * 
      (config.secondFloorArea * config.grayStructureRate);
    totalValue += (progress.secondFloor?.finishingProgress || 0) / 100 * 
      (config.secondFloorArea * (config.furnishedRate - config.grayStructureRate));

    return totalValue;
  };

  // Get contractor payments from expenses
  const getContractorPayments = () => {
    if (!expenses) return [];
    return expenses
      .filter(exp => exp.category === 'Contractor' && exp.subCategory === 'Payment')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const contractorPayments = getContractorPayments();
  const totalPaidToContractor = contractorPayments.reduce((sum, exp) => 
    sum + parseFloat(exp.totalAmount || exp.amount || 0), 0);
  
  const totalStagePayments = stages.reduce((sum, stage) => sum + parseFloat(stage.amountPaid || 0), 0);
  const actualWorkValue = calculateActualWorkValue();
  const totalContractAmount = projectConfig?.totalContractAmount || 0;

  // Calculate cumulative values for each stage
  const enrichedStages = stages.map((stage, index) => {
    const cumulativePercentage = stages.slice(0, index + 1)
      .reduce((sum, s) => sum + parseFloat(s.percentage), 0);
    const expectedValue = calculateExpectedWorkValue(cumulativePercentage);
    const cumulativePaid = stages.slice(0, index + 1)
      .reduce((sum, s) => sum + parseFloat(s.amountPaid || 0), 0);
    
    return {
      ...stage,
      cumulativePercentage,
      expectedValue,
      cumulativePaid,
      difference: cumulativePaid - expectedValue,
    };
  });

  const totalPercentage = stages.reduce((sum, stage) => sum + parseFloat(stage.percentage), 0);
  const paymentDifference = totalPaidToContractor - actualWorkValue;
  const percentagePaid = totalContractAmount > 0 ? (totalPaidToContractor / totalContractAmount * 100) : 0;
  const percentageWork = totalContractAmount > 0 ? (actualWorkValue / totalContractAmount * 100) : 0;

  // Calculate comparison with other contractors
  const calculateContractorComparison = () => {
    if (!projectConfig || !projectConfig.contractorComparison) {
      return null;
    }

    const comparison = projectConfig.contractorComparison;
    const config = projectConfig;

    // Your contractor's model
    const yourFoundation = config.foundationArea * config.foundationRate; // 90 × 700
    const yourFloors = (config.groundFloorArea + config.firstFloorArea + config.secondFloorArea) * config.furnishedRate;
    const yourTotal = yourFoundation + yourFloors;

    // Other contractor's model (level-by-level)
    const otherFoundation = comparison.otherFoundationArea * comparison.otherFoundationRate; // 1080 × 250-300
    const otherFloors = (config.groundFloorArea + config.firstFloorArea + config.secondFloorArea) * comparison.otherFurnishedRate;
    const otherTotal = otherFoundation + otherFloors;

    // At each payment stage, calculate equivalent cost with other contractor
    const stageComparison = enrichedStages.map((stage, index) => {
      const yourCumulativePayment = stage.cumulativePaid;
      const yourExpectedPayment = stage.expectedValue;
      const workPercentage = stage.cumulativePercentage;

      // For other contractor, payment would be stage-based (foundation, then floor-by-floor)
      let otherEquivalentPayment = 0;
      
      if (workPercentage <= 15) {
        // Advance - typically 10-15%
        otherEquivalentPayment = (workPercentage / 100) * otherTotal;
      } else if (workPercentage <= 35) {
        // Foundation stage complete
        otherEquivalentPayment = otherFoundation + ((workPercentage - 35) / 100) * otherFloors;
      } else if (workPercentage <= 60) {
        // Ground floor stage
        const groundFloorOtherCost = config.groundFloorArea * comparison.otherFurnishedRate;
        otherEquivalentPayment = otherFoundation + groundFloorOtherCost;
      } else if (workPercentage <= 80) {
        // First floor stage
        const groundFloorOtherCost = config.groundFloorArea * comparison.otherFurnishedRate;
        const firstFloorOtherCost = config.firstFloorArea * comparison.otherFurnishedRate;
        otherEquivalentPayment = otherFoundation + groundFloorOtherCost + firstFloorOtherCost;
      } else {
        // Complete
        otherEquivalentPayment = otherTotal;
      }

      return {
        ...stage,
        otherEquivalentPayment,
        savingsAtStage: otherEquivalentPayment - yourExpectedPayment,
        actualSavings: otherEquivalentPayment - yourCumulativePayment,
      };
    });

    return {
      yourTotal,
      otherTotal,
      totalSavings: otherTotal - yourTotal,
      savingsPercentage: ((otherTotal - yourTotal) / otherTotal * 100).toFixed(2),
      foundationSavings: otherFoundation - yourFoundation,
      stageComparison,
      comparison,
    };
  };

  const contractorComparison = calculateContractorComparison();

  const handleAddStage = () => {
    const newStage = {
      id: Math.max(...stages.map(s => s.id), 0) + 1,
      name: 'New Stage',
      percentage: 0,
      description: '',
      expectedWorkStages: '',
      amountPaid: 0,
      paidDate: '',
      status: 'pending'
    };
    setStages([...stages, newStage]);
  };

  const handleDeleteStage = (id) => {
    if (window.confirm('Are you sure you want to delete this payment stage?')) {
      setStages(stages.filter(s => s.id !== id));
    }
  };

  const handleEditStage = (stage) => {
    setCurrentEdit({ ...stage });
    setEditDialog(true);
  };

  const handleSaveEdit = () => {
    setStages(stages.map(s => s.id === currentEdit.id ? currentEdit : s));
    setEditDialog(false);
    setCurrentEdit(null);
  };

  const handleRecordPayment = (stage) => {
    setCurrentPayment({ 
      ...stage, 
      paymentAmount: (stage.percentage / 100 * totalContractAmount).toFixed(2),
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setPaymentDialog(true);
  };

  const handleSavePayment = () => {
    setStages(stages.map(s => 
      s.id === currentPayment.id 
        ? { 
            ...s, 
            amountPaid: parseFloat(currentPayment.paymentAmount), 
            paidDate: currentPayment.paymentDate,
            status: 'paid'
          } 
        : s
    ));
    setPaymentDialog(false);
    setCurrentPayment(null);
  };

  const handleSaveAllStages = async () => {
    await savePaymentStages(stages);
    alert('✅ Payment stages saved successfully!');
  };

  // Auto-sync contractor payments from expenses to stages
  const handleAutoSyncPayments = () => {
    if (contractorPayments.length === 0) {
      alert('No contractor payments found in expenses. Add contractor payments first under Category: Contractor, Sub-category: Payment');
      return;
    }

    // Sort stages by their order
    const sortedStages = [...stages].sort((a, b) => a.id - b.id);
    let cumulativePaid = 0;
    let paymentIndex = 0;

    const updatedStages = sortedStages.map((stage) => {
      const stageAmount = (stage.percentage / 100) * totalContractAmount;
      let stagePayment = 0;
      let stageDates = [];

      // Accumulate payments until we reach this stage's amount
      while (paymentIndex < contractorPayments.length && cumulativePaid < (stage.percentage / 100) * totalContractAmount) {
        const payment = contractorPayments[paymentIndex];
        const paymentAmount = parseFloat(payment.totalAmount || payment.amount || 0);
        
        if (cumulativePaid + paymentAmount <= (stage.percentage / 100) * totalContractAmount) {
          // Entire payment belongs to this stage
          stagePayment += paymentAmount;
          cumulativePaid += paymentAmount;
          stageDates.push(payment.date);
          paymentIndex++;
        } else {
          // Payment spans multiple stages - split it
          const remainingForStage = (stage.percentage / 100) * totalContractAmount - cumulativePaid;
          stagePayment += remainingForStage;
          cumulativePaid += remainingForStage;
          stageDates.push(payment.date);
          break;
        }
      }

      return {
        ...stage,
        amountPaid: stagePayment,
        paidDate: stageDates.length > 0 ? stageDates[stageDates.length - 1] : '',
        status: stagePayment > 0 ? 'paid' : 'pending'
      };
    });

    setStages(updatedStages);
    alert(`✅ Synced ${contractorPayments.length} contractor payments to stages!\n\nTotal synced: Rs ${totalPaidToContractor.toLocaleString()}`);
  };

  if (!projectConfig) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Please configure your project first in the Project Configuration page.
        </Alert>
      </Container>
    );
  }

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
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3 
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
              💰 Payment Stages Tracker
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track contractor's payment stages vs actual work value completed
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={handleAutoSyncPayments}
              sx={{ 
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5568d3',
                  bgcolor: 'rgba(102, 126, 234, 0.08)'
                }
              }}
            >
              Sync from Expenses
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveAllStages}
              sx={{ 
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                px: 3
              }}
            >
              Save Changes
            </Button>
          </Box>
        </Box>

      {/* Overall Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Contract</Typography>
              <Typography variant="h4" fontWeight="bold">
                Rs {totalContractAmount.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {projectConfig.totalArea || 1080} sqft
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Paid
                <Tooltip title="Auto-calculated from Contractor > Payment expenses">
                  <IconButton size="small" sx={{ color: 'white', ml: 0.5, opacity: 0.8 }}>
                    <SyncIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                Rs {totalPaidToContractor.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {percentagePaid.toFixed(2)}% of contract ({contractorPayments.length} payments)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Work Value</Typography>
              <Typography variant="h4" fontWeight="bold">
                Rs {actualWorkValue.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {percentageWork.toFixed(2)}% completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card 
            elevation={3} 
            sx={{ 
              background: paymentDifference > 0 
                ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' 
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
              color: 'white' 
            }}
          >
            <CardContent>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {paymentDifference > 0 ? 'Overpaid' : 'Underpaid'}
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                Rs {Math.abs(paymentDifference).toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {((Math.abs(paymentDifference) / totalContractAmount) * 100).toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info Alert about Auto-Sync */}
      {contractorPayments.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            💡 No contractor payments found
          </Typography>
          <Typography variant="body2">
            To track payments automatically:
            <br />
            1. Go to "Add Expense" page
            <br />
            2. Select Category: <strong>Contractor</strong>, Sub-category: <strong>Payment</strong>
            <br />
            3. Enter payment amount and date
            <br />
            4. Come back here and click "Sync from Expenses" to auto-populate payment stages
          </Typography>
        </Alert>
      )}

      {contractorPayments.length > 0 && totalStagePayments === 0 && (
        <Alert severity="warning" icon={<SyncIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            📊 {contractorPayments.length} contractor payment(s) found (Rs {totalPaidToContractor.toLocaleString()})
          </Typography>
          <Typography variant="body2">
            Click <strong>"Sync from Expenses"</strong> button above to automatically match these payments to your payment stages.
          </Typography>
        </Alert>
      )}

      {/* Warning Alert */}
      {paymentDifference > totalContractAmount * 0.05 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            ⚠️ Payment Alert: You've paid {percentagePaid.toFixed(1)}% but only {percentageWork.toFixed(1)}% work is completed!
          </Typography>
          <Typography variant="body2">
            You're Rs {paymentDifference.toLocaleString()} ahead of the actual work value. 
            Consider holding the next payment until more work is completed.
          </Typography>
        </Alert>
      )}

      {totalPercentage !== 100 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Payment stages total {totalPercentage}%. Should be 100%.
        </Alert>
      )}

      {/* Payment Stages Table */}
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="primary">
              Payment Stages Breakdown
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddStage}
              variant="outlined"
              size="small"
            >
              Add Stage
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>#</strong></TableCell>
                <TableCell><strong>Stage Name</strong></TableCell>
                <TableCell><strong>Payment %</strong></TableCell>
                <TableCell><strong>Amount</strong></TableCell>
                <TableCell><strong>Cumulative %</strong></TableCell>
                <TableCell><strong>Expected Value</strong></TableCell>
                <TableCell><strong>Paid Amount</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrichedStages.map((stage, index) => (
                <TableRow key={stage.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{stage.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stage.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${stage.percentage}%`} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    Rs {((stage.percentage / 100) * totalContractAmount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {stage.cumulativePercentage}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={stage.cumulativePercentage} 
                        sx={{ 
                          width: 60, 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: '#e0e0e0'
                        }} 
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      Rs {stage.expectedValue.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={stage.amountPaid > 0 ? 'success.main' : 'text.secondary'}
                    >
                      {stage.amountPaid > 0 ? `Rs ${stage.amountPaid.toLocaleString()}` : '-'}
                    </Typography>
                    {stage.paidDate && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(stage.paidDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {stage.amountPaid > 0 ? (
                      <Chip 
                        label="Paid" 
                        size="small" 
                        color="success" 
                        icon={<CheckCircleIcon />}
                      />
                    ) : (
                      <Chip 
                        label="Pending" 
                        size="small" 
                        color="default"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Record Payment">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleRecordPayment(stage)}
                        >
                          <MoneyOffIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Stage">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditStage(stage)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Stage">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteStage(stage.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell colSpan={2}><strong>TOTAL</strong></TableCell>
                <TableCell>
                  <Chip 
                    label={`${totalPercentage}%`} 
                    color={totalPercentage === 100 ? 'success' : 'warning'} 
                  />
                </TableCell>
                <TableCell colSpan={3}></TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="bold">
                    Rs {totalStagePayments.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* What-If Analysis */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          🎯 What-If Analysis: Stop Payment Scenario
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          See what happens if you stop payments at the current stage
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Current Situation
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Paid:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    Rs {totalPaidToContractor.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Work Value:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    Rs {actualWorkValue.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Difference:</Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={paymentDifference > 0 ? 'error.main' : 'success.main'}
                  >
                    Rs {paymentDifference.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: paymentDifference > 0 ? '#ffebee' : '#e8f5e9' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Risk Assessment
                </Typography>
                <Divider sx={{ my: 1 }} />
                {paymentDifference > 0 ? (
                  <>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      ⚠️ You've overpaid by {((paymentDifference / totalContractAmount) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      This means you've paid ahead of the actual work completed. 
                      Consider holding next payments until work catches up.
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      ✅ Payments are aligned with work
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Work value is equal to or ahead of payments made. Good position!
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendation
                </Typography>
                <Divider sx={{ my: 1 }} />
                {paymentDifference > totalContractAmount * 0.1 ? (
                  <Typography variant="body2">
                    🛑 <strong>Hold payments</strong> until work value reaches Rs {totalPaidToContractor.toLocaleString()}
                  </Typography>
                ) : paymentDifference > 0 ? (
                  <Typography variant="body2">
                    ⏸️ <strong>Proceed cautiously</strong> - slight overpayment detected
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    ✅ <strong>Safe to proceed</strong> with next payment stage
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Contractor Cost Comparison */}
      {contractorComparison && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            🔍 Cost Comparison: Your Contractor vs Others
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Comparing your percentage-based model vs traditional level-by-level contractors
          </Typography>

          {/* Overall Comparison */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    Your Contractor (Percentage-based)
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Foundation Cost:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      Rs {(projectConfig.foundationArea * projectConfig.foundationRate).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {projectConfig.foundationArea} sqft × Rs {projectConfig.foundationRate}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Floors Cost:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      Rs {((projectConfig.groundFloorArea + projectConfig.firstFloorArea + projectConfig.secondFloorArea) * projectConfig.furnishedRate).toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    Rs {contractorComparison.yourTotal.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Contract Amount
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    Other Contractors (Level-by-Level)
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Foundation Cost:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      Rs {(contractorComparison.comparison.otherFoundationArea * contractorComparison.comparison.otherFoundationRate).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {contractorComparison.comparison.otherFoundationArea} sqft × Rs {contractorComparison.comparison.otherFoundationRate}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Floors Cost:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      Rs {((projectConfig.groundFloorArea + projectConfig.firstFloorArea + projectConfig.secondFloorArea) * contractorComparison.comparison.otherFurnishedRate).toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" color="warning.main" fontWeight="bold">
                    Rs {contractorComparison.otherTotal.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Estimated Total Cost
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  bgcolor: contractorComparison.totalSavings > 0 ? '#e3f2fd' : '#ffebee',
                  height: '100%'
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    {contractorComparison.totalSavings > 0 ? 'Your Savings 🎉' : 'Extra Cost ⚠️'}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Foundation Savings:</Typography>
                    <Typography variant="body2" fontWeight="bold" color={contractorComparison.foundationSavings > 0 ? 'success.main' : 'error.main'}>
                      Rs {contractorComparison.foundationSavings.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Only paying for {projectConfig.foundationArea} sqft vs {contractorComparison.comparison.otherFoundationArea} sqft
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography 
                    variant="h6" 
                    fontWeight="bold"
                    color={contractorComparison.totalSavings > 0 ? 'primary.main' : 'error.main'}
                  >
                    {contractorComparison.totalSavings > 0 ? '✅ ' : '⚠️ '}
                    Rs {Math.abs(contractorComparison.totalSavings).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {contractorComparison.savingsPercentage}% {contractorComparison.totalSavings > 0 ? 'savings' : 'more'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Stage-by-Stage Comparison */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              📊 Stage-by-Stage Cost Comparison
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              See if you're saving or paying more at each payment stage
            </Typography>
            
            <TableContainer sx={{ maxHeight: 500, overflow: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>Stage</strong></TableCell>
                    <TableCell><strong>Progress %</strong></TableCell>
                    <TableCell><strong>Your Cost</strong></TableCell>
                    <TableCell><strong>Other Cost</strong></TableCell>
                    <TableCell><strong>Savings</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contractorComparison.stageComparison.map((stage, index) => (
                    <TableRow key={stage.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{stage.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stage.percentage}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${stage.cumulativePercentage}%`} size="small" color="primary" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          Rs {stage.expectedValue.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="warning.main">
                          Rs {stage.otherEquivalentPayment.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={stage.savingsAtStage > 0 ? 'success.main' : 'error.main'}
                        >
                          {stage.savingsAtStage > 0 ? '✅ ' : '⚠️ '}
                          Rs {Math.abs(stage.savingsAtStage).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {((Math.abs(stage.savingsAtStage) / stage.otherEquivalentPayment) * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {stage.amountPaid > 0 ? (
                          <Chip label="Paid" size="small" color="success" icon={<CheckCircleIcon />} />
                        ) : (
                          <Chip label="Pending" size="small" color="default" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell colSpan={2}><strong>TOTAL PROJECT</strong></TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        Rs {contractorComparison.yourTotal.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold" color="warning.main">
                        Rs {contractorComparison.otherTotal.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body1" 
                        fontWeight="bold"
                        color={contractorComparison.totalSavings > 0 ? 'primary.main' : 'error.main'}
                      >
                        {contractorComparison.totalSavings > 0 ? '✅ ' : '⚠️ '}
                        Rs {Math.abs(contractorComparison.totalSavings).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Key Insights */}
          <Alert 
            severity={contractorComparison.totalSavings > 0 ? "success" : "warning"} 
            sx={{ mt: 3 }}
          >
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              💡 Key Insight:
            </Typography>
            {contractorComparison.totalSavings > 0 ? (
              <Typography variant="body2">
                Your contractor's percentage-based model is <strong>saving you Rs {contractorComparison.totalSavings.toLocaleString()}</strong> ({contractorComparison.savingsPercentage}%) compared to traditional level-by-level contractors. 
                The biggest saving comes from only paying for {projectConfig.foundationArea} sqft foundation instead of the full {contractorComparison.comparison.otherFoundationArea} sqft area.
              </Typography>
            ) : (
              <Typography variant="body2">
                Your contractor's model costs <strong>Rs {Math.abs(contractorComparison.totalSavings).toLocaleString()}</strong> more than typical contractors. 
                However, this may include additional services or higher quality materials. Consider discussing the value you're getting.
              </Typography>
            )}
          </Alert>
        </Paper>
      )}

      {!contractorComparison && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Want to compare with other contractors?
          </Typography>
          <Typography variant="body2">
            Go to <strong>Project Setup</strong> page and fill in the "Compare with Other Contractors" section to see if you're getting a good deal!
          </Typography>
        </Alert>
      )}

      {/* Recent Contractor Payments */}
      {contractorPayments.length > 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary">
              📋 Contractor Payment History (Auto-tracked)
            </Typography>
            <Chip 
              icon={<SyncIcon />} 
              label={`${contractorPayments.length} Payment${contractorPayments.length !== 1 ? 's' : ''}`}
              color="primary" 
              variant="outlined"
            />
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Automatically pulled from expenses where Category = "Contractor" and Sub-category = "Payment"
          </Typography>
          <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell><strong>Cumulative</strong></TableCell>
                  <TableCell><strong>% of Contract</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contractorPayments.map((payment, index) => {
                  const cumulative = contractorPayments
                    .slice(0, index + 1)
                    .reduce((sum, p) => sum + parseFloat(p.totalAmount || p.amount || 0), 0);
                  const percentage = (cumulative / totalContractAmount * 100).toFixed(2);
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {payment.description || payment.notes || '-'}
                        <Typography variant="caption" display="block" color="text.secondary">
                          Payment #{index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          Rs {parseFloat(payment.totalAmount || payment.amount || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          Rs {cumulative.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${percentage}%`} size="small" color="primary" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={payment.paymentStatus || 'Paid'} 
                          size="small" 
                          color={payment.paymentStatus === 'Clear' ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell colSpan={2}><strong>TOTAL PAID</strong></TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold" color="primary">
                      Rs {totalPaidToContractor.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Edit Stage Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Payment Stage</DialogTitle>
        <DialogContent>
          {currentEdit && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Stage Name"
                  value={currentEdit.name}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Payment Percentage"
                  value={currentEdit.percentage}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, percentage: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  value={((currentEdit.percentage / 100) * totalContractAmount).toLocaleString()}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                    readOnly: true
                  }}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={currentEdit.description}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Expected Work Stages"
                  value={currentEdit.expectedWorkStages}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, expectedWorkStages: e.target.value })}
                  helperText="What physical work should be completed at this stage?"
                />
              </Grid>
            </Grid>
          )}
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
            onClick={() => setEditDialog(false)}
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
            onClick={handleSaveEdit} 
            variant="contained" 
            color="primary"
            size="large"
            sx={{ 
              minWidth: { xs: '100%', sm: 120 },
              order: { xs: 1, sm: 2 }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {currentPayment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Recording payment for: <strong>{currentPayment.name}</strong>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Payment Amount"
                  value={currentPayment.paymentAmount}
                  onChange={(e) => setCurrentPayment({ ...currentPayment, paymentAmount: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Payment Date"
                  value={currentPayment.paymentDate}
                  onChange={(e) => setCurrentPayment({ ...currentPayment, paymentDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
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
            onClick={() => setPaymentDialog(false)}
            variant="outlined"
            size="large"
            sx={{ 
              minWidth: { xs: '100%', sm: 130 },
              order: { xs: 2, sm: 1 }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSavePayment} 
            variant="contained" 
            color="primary"
            size="large"
            sx={{ 
              minWidth: { xs: '100%', sm: 130 },
              order: { xs: 1, sm: 2 }
            }}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default PaymentStages;
