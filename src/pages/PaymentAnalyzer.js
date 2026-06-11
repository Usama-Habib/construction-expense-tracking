import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Button,
  Divider,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useExpense } from '../contexts/ExpenseContext';

const PaymentAnalyzer = () => {
  const { projectConfig, progressData, expenses } = useExpense();
  const [simulatedPayment, setSimulatedPayment] = useState(0);

  const calculateWorkValue = () => {
    if (!projectConfig || !progressData) return { total: 0, breakdown: [] };

    const config = projectConfig;
    const progress = progressData;
    let totalValue = 0;
    const breakdown = [];

    // Foundation
    const foundationValue = (progress.foundation.progress / 100) * 
      (config.foundationArea * config.foundationRate);
    totalValue += foundationValue;
    breakdown.push({
      name: 'Foundation',
      value: foundationValue,
      maxValue: config.foundationArea * config.foundationRate,
      progress: progress.foundation.progress,
    });

    // Ground Floor
    const groundGrayValue = (progress.groundFloor.grayProgress / 100) * 
      (config.groundFloorArea * config.grayStructureRate);
    const groundFinishValue = (progress.groundFloor.finishingProgress / 100) * 
      (config.groundFloorArea * (config.furnishedRate - config.grayStructureRate));
    const groundTotal = groundGrayValue + groundFinishValue;
    totalValue += groundTotal;
    breakdown.push({
      name: 'Ground Floor',
      value: groundTotal,
      grayValue: groundGrayValue,
      finishValue: groundFinishValue,
      maxValue: config.groundFloorArea * config.furnishedRate,
      grayProgress: progress.groundFloor.grayProgress,
      finishProgress: progress.groundFloor.finishingProgress,
    });

    // First Floor
    const firstGrayValue = (progress.firstFloor.grayProgress / 100) * 
      (config.firstFloorArea * config.grayStructureRate);
    const firstFinishValue = (progress.firstFloor.finishingProgress / 100) * 
      (config.firstFloorArea * (config.furnishedRate - config.grayStructureRate));
    const firstTotal = firstGrayValue + firstFinishValue;
    totalValue += firstTotal;
    breakdown.push({
      name: 'First Floor',
      value: firstTotal,
      grayValue: firstGrayValue,
      finishValue: firstFinishValue,
      maxValue: config.firstFloorArea * config.furnishedRate,
      grayProgress: progress.firstFloor.grayProgress,
      finishProgress: progress.firstFloor.finishingProgress,
    });

    // Second Floor
    const secondGrayValue = (progress.secondFloor.grayProgress / 100) * 
      (config.secondFloorArea * config.grayStructureRate);
    const secondFinishValue = (progress.secondFloor.finishingProgress / 100) * 
      (config.secondFloorArea * (config.furnishedRate - config.grayStructureRate));
    const secondTotal = secondGrayValue + secondFinishValue;
    totalValue += secondTotal;
    breakdown.push({
      name: 'Second Floor',
      value: secondTotal,
      grayValue: secondGrayValue,
      finishValue: secondFinishValue,
      maxValue: config.secondFloorArea * config.furnishedRate,
      grayProgress: progress.secondFloor.grayProgress,
      finishProgress: progress.secondFloor.finishingProgress,
    });

    return {
      total: totalValue,
      breakdown,
      totalContractValue: config.totalContractAmount || 0,
      percentageComplete: config.totalContractAmount 
        ? (totalValue / config.totalContractAmount * 100).toFixed(2)
        : 0,
    };
  };

  const calculateContractorPayments = () => {
    // Filter contractor payments from expenses
    const contractorPayments = expenses.filter(exp => 
      exp.category === 'Contractor' || 
      exp.categoryName === 'Contractor' ||
      (exp.notes && exp.notes.toLowerCase().includes('contractor'))
    );

    const totalPaid = contractorPayments.reduce((sum, exp) => {
      return sum + (parseFloat(exp.totalAmount || exp.amount) || 0);
    }, 0);

    return {
      payments: contractorPayments,
      totalPaid,
      paymentPercentage: projectConfig?.totalContractAmount 
        ? (totalPaid / projectConfig.totalContractAmount * 100).toFixed(2)
        : 0,
    };
  };

  const workValue = calculateWorkValue();
  const paymentInfo = calculateContractorPayments();

  // Payment vs Work Analysis
  const paymentDifference = paymentInfo.totalPaid - workValue.total;
  const isOverpaid = paymentDifference > 0;
  const paymentVsWorkRatio = workValue.total > 0 
    ? (paymentInfo.totalPaid / workValue.total).toFixed(2)
    : 0;

  // Simulate "What if we stop now" scenario
  const simulateStopNow = () => {
    return {
      workCompleted: workValue.total,
      amountPaid: paymentInfo.totalPaid,
      difference: paymentDifference,
      isOverpaid: isOverpaid,
      recommendation: isOverpaid 
        ? `You've overpaid by Rs ${Math.abs(paymentDifference).toLocaleString()}. Consider holding next payment until work catches up.`
        : `Work value exceeds payment by Rs ${Math.abs(paymentDifference).toLocaleString()}. Payment is on track or contractor is ahead.`,
    };
  };

  const stopNowAnalysis = simulateStopNow();

  // Simulate payment percentage
  const simulatePayment = (percentage) => {
    if (!projectConfig) return null;
    
    const simulatedAmount = (percentage / 100) * projectConfig.totalContractAmount;
    const diff = simulatedAmount - workValue.total;
    
    return {
      percentage,
      amount: simulatedAmount,
      workValue: workValue.total,
      difference: diff,
      isOverpaid: diff > 0,
      status: diff > 0 
        ? 'warning' 
        : Math.abs(diff) < projectConfig.totalContractAmount * 0.05 
          ? 'success' 
          : 'info',
    };
  };

  const simResult = simulatePayment(simulatedPayment);

  // Chart data for payment vs work progression
  const getProgressionData = () => {
    const data = [];
    for (let i = 0; i <= 100; i += 10) {
      const payment = (i / 100) * (projectConfig?.totalContractAmount || 0);
      // Assuming linear work progression for this model
      // In reality, this would need actual milestone data
      data.push({
        progress: i,
        'Payment (Rs)': payment,
        'Work Value (Rs)': (i / 100) * workValue.totalContractValue,
        'Current Payment': i === parseFloat(paymentInfo.paymentPercentage) ? payment : null,
        'Current Work': i === parseFloat(workValue.percentageComplete) ? workValue.total : null,
      });
    }
    return data;
  };

  const progressionData = getProgressionData();

  if (!projectConfig) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Please configure your project first in the Project Configuration page.
        </Alert>
      </Container>
    );
  }

  if (!progressData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          Please update your progress in the Progress Tracker page first.
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            💰 Payment vs Work Analyzer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor payment alignment with actual work completed
          </Typography>
        </Box>

        <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                💸 Payments Made
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                Rs {paymentInfo.totalPaid.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {paymentInfo.paymentPercentage}% of total contract
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={parseFloat(paymentInfo.paymentPercentage)} 
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Total Contract: Rs {projectConfig.totalContractAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                🔨 Work Value Completed
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="success.main">
                Rs {workValue.total.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {workValue.percentageComplete}% of total contract
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={parseFloat(workValue.percentageComplete)} 
                sx={{ 
                  mt: 2, 
                  height: 8, 
                  borderRadius: 4,
                  '& .MuiLinearProgress-bar': { bgcolor: 'success.main' }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Based on current progress tracking
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment vs Work Comparison */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3, 
            background: isOverpaid 
              ? 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)'
              : 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
            color: 'white'
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {isOverpaid ? (
                    <WarningIcon sx={{ fontSize: 40, mr: 2 }} />
                  ) : (
                    <CheckCircleIcon sx={{ fontSize: 40, mr: 2 }} />
                  )}
                  <Typography variant="h5" fontWeight="bold">
                    {isOverpaid ? 'Payment Ahead of Work' : 'Payment Aligned with Work'}
                  </Typography>
                </Box>
                
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Difference: Rs {Math.abs(paymentDifference).toLocaleString()}
                </Typography>
                
                <Typography variant="body1" sx={{ opacity: 0.95 }}>
                  {isOverpaid 
                    ? `You've paid ${((paymentDifference / projectConfig.totalContractAmount) * 100).toFixed(2)}% more than the work value completed.`
                    : `Work value is ${Math.abs((paymentDifference / projectConfig.totalContractAmount) * 100).toFixed(2)}% ahead of payments.`
                  }
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Payment : Work Ratio
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" color={isOverpaid ? 'error' : 'success.main'}>
                      {paymentVsWorkRatio}:1
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {parseFloat(paymentVsWorkRatio) > 1 
                        ? 'Paying more per unit of work'
                        : 'Paying less per unit of work'
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Payment Progression Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📈 Payment vs Work Value Progression
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ideally, both lines should align closely
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="progress" label={{ value: 'Progress (%)', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Amount (Rs)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `Rs ${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="Payment (Rs)" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="Work Value (Rs)" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Chip 
                label={`Current Payment: ${paymentInfo.paymentPercentage}%`} 
                color="primary" 
                icon={<InfoIcon />}
              />
              <Chip 
                label={`Current Work: ${workValue.percentageComplete}%`} 
                color="success" 
                icon={<TrendingUpIcon />}
              />
            </Box>
          </Paper>
        </Grid>

        {/* "What If We Stop Now" Analysis */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="error">
              🛑 Risk Analysis: "What If We Stop Now?"
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Work Value Completed:</strong></TableCell>
                        <TableCell align="right">
                          <Typography color="success.main" fontWeight="bold">
                            Rs {stopNowAnalysis.workCompleted.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Amount Already Paid:</strong></TableCell>
                        <TableCell align="right">
                          <Typography color="primary" fontWeight="bold">
                            Rs {stopNowAnalysis.amountPaid.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Difference:</strong></TableCell>
                        <TableCell align="right">
                          <Typography 
                            color={stopNowAnalysis.isOverpaid ? 'error' : 'success.main'} 
                            fontWeight="bold"
                          >
                            {stopNowAnalysis.isOverpaid ? '-' : '+'} Rs {Math.abs(stopNowAnalysis.difference).toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Alert 
                  severity={stopNowAnalysis.isOverpaid ? 'error' : 'success'}
                  icon={stopNowAnalysis.isOverpaid ? <WarningIcon /> : <CheckCircleIcon />}
                >
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    {stopNowAnalysis.isOverpaid ? 'OVERPAYMENT DETECTED' : 'PAYMENT STATUS: HEALTHY'}
                  </Typography>
                  <Typography variant="body2">
                    {stopNowAnalysis.recommendation}
                  </Typography>
                </Alert>
                
                {stopNowAnalysis.isOverpaid && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Action Items:</strong>
                    </Typography>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      <li>Hold next payment until work progresses</li>
                      <li>Request progress photos/documentation</li>
                      <li>Schedule site inspection</li>
                      <li>Review contractor's work schedule</li>
                    </ul>
                  </Alert>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Payment Simulator */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              🧮 Payment Simulator
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Simulate different payment scenarios to see if you'd be overpaying
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Simulate Payment Percentage"
                  value={simulatedPayment}
                  onChange={(e) => setSimulatedPayment(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                  helperText="Enter a percentage to simulate that payment scenario"
                  inputProps={{ min: 0, max: 100, step: 5 }}
                />
              </Grid>
              
              {simResult && simResult.percentage > 0 && (
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: simResult.status === 'warning' ? '#fff3e0' : simResult.status === 'success' ? '#e8f5e9' : '#e3f2fd' }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Simulation Result:
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {simResult.percentage}% = Rs {simResult.amount.toLocaleString()}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Current Work Value: Rs {simResult.workValue.toLocaleString()}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        fontWeight="bold"
                        color={simResult.isOverpaid ? 'error' : 'success.main'}
                        sx={{ mt: 1 }}
                      >
                        {simResult.isOverpaid 
                          ? `⚠️ Overpayment: Rs ${Math.abs(simResult.difference).toLocaleString()}`
                          : `✅ Safe: Work ahead by Rs ${Math.abs(simResult.difference).toLocaleString()}`
                        }
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Detailed Work Breakdown */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 Detailed Work Value Breakdown
            </Typography>
            <TableContainer sx={{ maxHeight: 500, overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Floor/Stage</strong></TableCell>
                    <TableCell align="right"><strong>Progress</strong></TableCell>
                    <TableCell align="right"><strong>Work Value</strong></TableCell>
                    <TableCell align="right"><strong>Max Value</strong></TableCell>
                    <TableCell align="right"><strong>% Complete</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workValue.breakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">
                        {item.grayProgress !== undefined ? (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Gray: {item.grayProgress}%
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              Finish: {item.finishProgress}%
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2">{item.progress}%</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="success.main" fontWeight="bold">
                          Rs {item.value.toLocaleString()}
                        </Typography>
                        {item.grayValue !== undefined && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Gray: Rs {item.grayValue.toLocaleString()}<br />
                            Finish: Rs {item.finishValue.toLocaleString()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        Rs {item.maxValue.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <LinearProgress 
                          variant="determinate" 
                          value={(item.value / item.maxValue) * 100} 
                          sx={{ width: 60, display: 'inline-block' }}
                        />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          {((item.value / item.maxValue) * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>TOTAL</strong></TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">
                      <Typography color="success.main" fontWeight="bold">
                        Rs {workValue.total.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Rs {workValue.totalContractValue.toLocaleString()}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{workValue.percentageComplete}%</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              💡 Smart Payment Strategy
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Always verify work completion before releasing payment milestones</li>
              <li>Take photos at each stage for documentation</li>
              <li>Maintain payment lag of 5-10% to ensure quality</li>
              <li>Review this analyzer before every payment</li>
              <li>Request detailed progress reports from contractor</li>
              {isOverpaid && (
                <li><strong>Current Status: Hold next payment until work catches up with the overpayment</strong></li>
              )}
            </ul>
          </Alert>
        </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PaymentAnalyzer;
