import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CalculateIcon from '@mui/icons-material/Calculate';
import { useExpense } from '../contexts/ExpenseContext';

const CostDashboard = () => {
  const { projectConfig, expenses, paymentStages } = useExpense();
  const [tabValue, setTabValue] = useState(0);
  
  // Construction type selection for calculator
  const [constructionPlan, setConstructionPlan] = useState({
    foundation: true,
    ground: 'FF', // Gray or FF
    first: 'FF',
    second: 'None', // Gray, FF, or None
  });

  if (!projectConfig) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please configure your project first from the Project Setup page.
        </Alert>
      </Container>
    );
  }

  const config = projectConfig;

  // Calculate contractor payments made by level using stage mappings
  const getPaymentsByLevel = () => {
    const contractorPayments = (expenses || []).filter(
      e => e.category === 'Contractor' && e.subcategory === 'Payment'
    );
    
    console.log('Cost Dashboard - All expenses:', expenses?.length || 0);
    console.log('Cost Dashboard - Contractor payments:', contractorPayments.length);
    console.log('Cost Dashboard - Contractor payments data:', contractorPayments);
    
    const total = contractorPayments.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    console.log('Cost Dashboard - Total payments:', total);
    
    // Initialize level payments
    const levelPayments = {
      foundation: 0,
      ground: 0,
      first: 0,
      second: 0,
      total: total,
    };
    
    // Helper function to get proportional distribution of an amount across levels
    const distributeAmount = (amount, levels) => {
      if (!levels || levels.length === 0) return {};
      if (levels.length === 1) {
        return { [levels[0]]: amount };
      }
      
      // Calculate area for each level
      const areaMap = {
        foundation: parseFloat(config.foundationArea) || 0,
        ground: parseFloat(config.groundFloorArea) || 0,
        first: parseFloat(config.firstFloorArea) || 0,
        second: parseFloat(config.secondFloorArea) || 0,
      };
      
      // Sum of areas for selected levels
      const totalArea = levels.reduce((sum, level) => sum + areaMap[level], 0);
      
      // Distribute proportionally
      const distribution = {};
      if (totalArea > 0) {
        levels.forEach(level => {
          distribution[level] = (amount * areaMap[level]) / totalArea;
        });
      } else {
        // Equal distribution if no areas defined
        const perLevel = amount / levels.length;
        levels.forEach(level => {
          distribution[level] = perLevel;
        });
      }
      
      return distribution;
    };
    
    // If we have payment stages with recorded payments, calculate by level
    if (paymentStages && paymentStages.length > 0 && config.paymentMilestones) {
      paymentStages.forEach((stage, index) => {
        const milestone = config.paymentMilestones[index];
        if (milestone && stage.amountPaid) {
          const amount = parseFloat(stage.amountPaid) || 0;
          
          // Handle both new format (levels array) and old format (single level string)
          const stageLevels = milestone.levels || (milestone.level ? [milestone.level] : []);
          
          if (stageLevels.length > 0) {
            const distribution = distributeAmount(amount, stageLevels);
            Object.keys(distribution).forEach(level => {
              levelPayments[level] = (levelPayments[level] || 0) + distribution[level];
            });
          }
        }
      });
      
      // Check if any stage payments were recorded
      const totalFromStages = Object.keys(levelPayments)
        .filter(k => k !== 'total')
        .reduce((sum, k) => sum + levelPayments[k], 0);
      
      // If no stage payments recorded but we have total contractor payments,
      // show total in foundation for backward compatibility
      if (totalFromStages === 0 && total > 0) {
        levelPayments.foundation = total;
      }
    } else if (total > 0) {
      // Fallback: show all payments in foundation if no stage tracking
      levelPayments.foundation = total;
    }
    
    console.log('Cost Dashboard - Level payments:', levelPayments);
    console.log('Cost Dashboard - Sum of levels:', 
      levelPayments.foundation + levelPayments.ground + levelPayments.first + levelPayments.second
    );
    
    return levelPayments;
  };

  const paymentsMade = getPaymentsByLevel();
  
  console.log('Cost Dashboard - Final paymentsMade:', paymentsMade);
  console.log('Cost Dashboard - Expenses array:', expenses);

  // Calculate actual cost based on area × rate
  const calculateActualCost = (level, type) => {
    if (level === 'foundation') {
      return (parseFloat(config.foundationArea) || 0) * (parseFloat(config.myFoundationRate) || 0);
    }
    
    const area = parseFloat(config[`${level}FloorArea`]) || 0;
    const rate = type === 'Gray' ? (parseFloat(config.myGrayRate) || 0) : (parseFloat(config.myFurnishedRate) || 0);
    return area * rate;
  };

  // Calculate committed cost from payment schedule
  const calculateCommittedCost = () => {
    if (!config.paymentMilestones) return 0;
    
    const totalPercentage = config.paymentMilestones.reduce(
      (sum, m) => sum + (parseFloat(m.percentage) || 0), 
      0
    );
    
    // Total committed based on all levels being FF
    const foundationCost = (parseFloat(config.foundationArea) || 0) * (parseFloat(config.myFoundationRate) || 0);
    const floorsCost = 
      ((parseFloat(config.groundFloorArea) || 0) + (parseFloat(config.firstFloorArea) || 0) + (parseFloat(config.secondFloorArea) || 0)) * 
      (parseFloat(config.myFurnishedRate) || 0);
    
    return foundationCost + floorsCost;
  };

  // Calculate committed cost per level based on stage mappings
  const getCommittedCostByLevel = () => {
    const committedByLevel = {
      foundation: 0,
      ground: 0,
      first: 0,
      second: 0,
    };

    if (!config.paymentMilestones) return committedByLevel;

    const totalCommitted = calculateCommittedCost();

    // Helper function to distribute percentage across levels proportionally
    const distributePercentage = (percentage, levels) => {
      if (!levels || levels.length === 0) return {};
      if (levels.length === 1) {
        return { [levels[0]]: percentage };
      }
      
      // Calculate area for each level
      const areaMap = {
        foundation: parseFloat(config.foundationArea) || 0,
        ground: parseFloat(config.groundFloorArea) || 0,
        first: parseFloat(config.firstFloorArea) || 0,
        second: parseFloat(config.secondFloorArea) || 0,
      };
      
      // Sum of areas for selected levels
      const totalArea = levels.reduce((sum, level) => sum + areaMap[level], 0);
      
      // Distribute proportionally
      const distribution = {};
      if (totalArea > 0) {
        levels.forEach(level => {
          distribution[level] = (percentage * areaMap[level]) / totalArea;
        });
      } else {
        // Equal distribution if no areas defined
        const perLevel = percentage / levels.length;
        levels.forEach(level => {
          distribution[level] = perLevel;
        });
      }
      
      return distribution;
    };

    // Distribute each milestone's percentage across its mapped levels
    config.paymentMilestones.forEach(milestone => {
      const percentage = parseFloat(milestone.percentage) || 0;
      
      // Handle both new format (levels array) and old format (single level string)
      const stageLevels = milestone.levels || (milestone.level ? [milestone.level] : []);
      
      if (stageLevels.length > 0) {
        const distribution = distributePercentage(percentage, stageLevels);
        Object.keys(distribution).forEach(level => {
          committedByLevel[level] = (committedByLevel[level] || 0) + distribution[level];
        });
      }
    });

    // Convert percentages to actual amounts
    Object.keys(committedByLevel).forEach(level => {
      committedByLevel[level] = (committedByLevel[level] * totalCommitted) / 100;
    });

    return committedByLevel;
  };

  const committedByLevel = getCommittedCostByLevel();

  // Calculate external contractor cost
  const calculateExternalCost = (level) => {
    if (level === 'foundation') {
      return (parseFloat(config.extFoundationArea) || 0) * (parseFloat(config.extFoundationRate) || 0);
    }
    
    const area = parseFloat(config[`${level}FloorArea`]) || 0;
    return area * (parseFloat(config.extFurnishedRate) || 0);
  };

  // Calculate construction plan total
  const calculateConstructionPlanCost = () => {
    let total = 0;
    
    // Foundation - special logic for G+1 with FF
    if (constructionPlan.foundation) {
      const isGPlusOne = 
        constructionPlan.ground !== 'None' && 
        constructionPlan.first !== 'None' && 
        constructionPlan.second === 'None' &&
        (constructionPlan.ground === 'FF' || constructionPlan.first === 'FF');
      
      if (isGPlusOne) {
        // Only charge for tank area (90 sqft)
        total += (parseFloat(config.foundationArea) || 0) * (parseFloat(config.myFoundationRate) || 0);
      } else {
        // Charge full foundation area (should be 1080 or whatever is configured)
        // Note: foundationArea should already be the full area when not G+1
        total += (parseFloat(config.foundationArea) || 0) * (parseFloat(config.myFoundationRate) || 0);
      }
    }
    
    // Ground floor
    if (constructionPlan.ground !== 'None') {
      const rate = constructionPlan.ground === 'Gray' ? (parseFloat(config.myGrayRate) || 0) : (parseFloat(config.myFurnishedRate) || 0);
      total += (parseFloat(config.groundFloorArea) || 0) * rate;
    }
    
    // First floor
    if (constructionPlan.first !== 'None') {
      const rate = constructionPlan.first === 'Gray' ? (parseFloat(config.myGrayRate) || 0) : (parseFloat(config.myFurnishedRate) || 0);
      total += (parseFloat(config.firstFloorArea) || 0) * rate;
    }
    
    // Second floor
    if (constructionPlan.second !== 'None') {
      const rate = constructionPlan.second === 'Gray' ? (parseFloat(config.myGrayRate) || 0) : (parseFloat(config.myFurnishedRate) || 0);
      total += (parseFloat(config.secondFloorArea) || 0) * rate;
    }
    
    return total;
  };

  const committedTotal = calculateCommittedCost();
  const planCost = calculateConstructionPlanCost();

  // Level comparison data
  const levels = [
    {
      name: 'Foundation',
      key: 'foundation',
      actualCost: calculateActualCost('foundation'),
      paidAmount: paymentsMade.foundation,
      committedCost: committedByLevel.foundation,
      externalCost: calculateExternalCost('foundation'),
    },
    {
      name: 'Ground Floor',
      key: 'ground',
      actualCost: calculateActualCost('ground', 'FF'),
      paidAmount: paymentsMade.ground,
      committedCost: committedByLevel.ground,
      externalCost: calculateExternalCost('ground'),
    },
    {
      name: 'First Floor',
      key: 'first',
      actualCost: calculateActualCost('first', 'FF'),
      paidAmount: paymentsMade.first,
      committedCost: committedByLevel.first,
      externalCost: calculateExternalCost('first'),
    },
    {
      name: 'Second Floor',
      key: 'second',
      actualCost: calculateActualCost('second', 'FF'),
      paidAmount: paymentsMade.second,
      committedCost: committedByLevel.second,
      externalCost: calculateExternalCost('second'),
    },
  ];

  const renderCostComparisonTable = () => {
    const hasStagePayments = paymentStages && paymentStages.some(s => (parseFloat(s.amountPaid) || 0) > 0);
    
    // Calculate how many stages have payments recorded
    const stagesWithPayments = paymentStages?.filter(s => (parseFloat(s.amountPaid) || 0) > 0) || [];
    
    // Debug calculations
    const contractorExpenses = (expenses || []).filter(e => e.category === 'Contractor' && e.subcategory === 'Payment');
    const sumOfLevels = levels.reduce((sum, l) => sum + l.paidAmount, 0);
    
    return (
      <Box>
        {/* Debug Alert */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>🔍 Payment Calculation Debug:</strong>
          </Typography>
          <Typography variant="caption" component="div">
            • Contractor expenses found: {contractorExpenses.length} payments<br/>
            • Total from expenses: Rs {Math.round(contractorExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)).toLocaleString()}<br/>
            • Sum of level payments: Rs {Math.round(sumOfLevels).toLocaleString()}<br/>
            • Foundation: Rs {Math.round(paymentsMade.foundation).toLocaleString()} | 
              Ground: Rs {Math.round(paymentsMade.ground).toLocaleString()} | 
              First: Rs {Math.round(paymentsMade.first).toLocaleString()} | 
              Second: Rs {Math.round(paymentsMade.second).toLocaleString()}<br/>
            • Shown total: Rs {Math.round(paymentsMade.total).toLocaleString()}
          </Typography>
          {contractorExpenses.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Contractor Payments:</Typography>
              {contractorExpenses.slice(0, 5).map((exp, i) => (
                <Typography key={i} variant="caption" component="div">
                  • {exp.date}: Rs {Math.round(exp.amount).toLocaleString()} - {exp.description || 'N/A'}
                </Typography>
              ))}
              {contractorExpenses.length > 5 && (
                <Typography variant="caption">... and {contractorExpenses.length - 5} more</Typography>
              )}
            </Box>
          )}
        </Alert>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>💡 How costs are distributed:</strong>
          </Typography>
          <Typography variant="caption" component="div">
            • <strong>Committed</strong>: Based on payment stages mapped to each level (from Project Setup)<br/>
            • <strong>Paid</strong>: Actual payments recorded in Payment Tracker, distributed by stage mappings<br/>
            • Multi-level stages split proportionally by floor area
          </Typography>
        </Alert>
        
        {paymentsMade.total > 0 && (
          <Alert severity={hasStagePayments ? "success" : "warning"} sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              💰 Total Paid: Rs {Math.round(paymentsMade.total).toLocaleString()}
            </Typography>
            {hasStagePayments ? (
              <Typography variant="caption" component="div">
                ✅ {stagesWithPayments.length} stage(s) recorded • Distributed across levels based on mappings<br/>
                {stagesWithPayments.map((s, i) => (
                  <span key={i}>
                    • {s.name}: Rs {Math.round(parseFloat(s.amountPaid)).toLocaleString()}
                    {i < stagesWithPayments.length - 1 ? <br/> : ''}
                  </span>
                ))}
              </Typography>
            ) : (
              <Typography variant="caption">
                ⚠️ All payments shown in Foundation. Record stage payments in <strong>Payment Tracker</strong> for accurate distribution.
              </Typography>
            )}
          </Alert>
        )}
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'primary.main' }}>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Level</TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Paid</TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Actual Cost</TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Committed</TableCell>
            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>External</TableCell>
            <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {levels.map((level) => {
            const overpaid = level.paidAmount > level.committedCost;
            const savings = level.externalCost - level.actualCost;
            
            return (
              <TableRow key={level.key}>
                <TableCell sx={{ fontWeight: 'bold' }}>{level.name}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: level.paidAmount > 0 ? 'success.main' : 'text.primary' }}>
                  Rs {Math.round(level.paidAmount).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  Rs {Math.round(level.actualCost).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  Rs {Math.round(level.committedCost).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  Rs {Math.round(level.externalCost).toLocaleString()}
                </TableCell>
                <TableCell align="center">
                  {overpaid ? (
                    <Chip
                      icon={<WarningIcon />}
                      label="Overpaid"
                      color="error"
                      size="small"
                    />
                  ) : (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="On Track"
                      color="success"
                      size="small"
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              Rs {Math.round(levels.reduce((sum, l) => sum + l.paidAmount, 0)).toLocaleString()}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
              Rs {Math.round(levels.reduce((sum, l) => sum + l.actualCost, 0)).toLocaleString()}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
              Rs {Math.round(committedTotal).toLocaleString()}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
              Rs {Math.round(levels.reduce((sum, l) => sum + l.externalCost, 0)).toLocaleString()}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
    </Box>
    );
  };

  const renderConstructionCalculator = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          💡 G+1 Special Pricing:
        </Typography>
        <Typography variant="caption">
          If you build Ground + First floor with at least one being Fully Furnished, 
          foundation is charged only for tank area (90 sqft) instead of full area (1080 sqft).
        </Typography>
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Ground Floor</InputLabel>
            <Select
              value={constructionPlan.ground}
              onChange={(e) => setConstructionPlan({ ...constructionPlan, ground: e.target.value })}
            >
              <MenuItem value="None">Not Building</MenuItem>
              <MenuItem value="Gray">Gray Structure</MenuItem>
              <MenuItem value="FF">Fully Furnished</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>First Floor</InputLabel>
            <Select
              value={constructionPlan.first}
              onChange={(e) => setConstructionPlan({ ...constructionPlan, first: e.target.value })}
            >
              <MenuItem value="None">Not Building</MenuItem>
              <MenuItem value="Gray">Gray Structure</MenuItem>
              <MenuItem value="FF">Fully Furnished</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Second Floor</InputLabel>
            <Select
              value={constructionPlan.second}
              onChange={(e) => setConstructionPlan({ ...constructionPlan, second: e.target.value })}
            >
              <MenuItem value="None">Not Building</MenuItem>
              <MenuItem value="Gray">Gray Structure</MenuItem>
              <MenuItem value="FF">Fully Furnished</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white', height: '100%' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption">Total Cost</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Rs {Math.round(planCost).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed breakdown */}
      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
          Cost Breakdown:
        </Typography>
        
        {constructionPlan.foundation && (
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              Foundation ({parseFloat(config.foundationArea) || 0} sqft × Rs {Math.round(parseFloat(config.myFoundationRate) || 0)})
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Rs {Math.round((parseFloat(config.foundationArea) || 0) * (parseFloat(config.myFoundationRate) || 0)).toLocaleString()}
            </Typography>
          </Box>
        )}

        {constructionPlan.ground !== 'None' && (
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              Ground Floor - {constructionPlan.ground} 
              ({parseFloat(config.groundFloorArea) || 0} sqft × Rs {Math.round(constructionPlan.ground === 'Gray' ? (parseFloat(config.myGrayRate) || 0) : (parseFloat(config.myFurnishedRate) || 0))})
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Rs {Math.round((parseFloat(config.groundFloorArea) || 0) * (constructionPlan.ground === 'Gray' ? (parseFloat(config.myGrayRate) || 0) : (parseFloat(config.myFurnishedRate) || 0))).toLocaleString()}
            </Typography>
          </Box>
        )}

        {constructionPlan.first !== 'None' && (
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              First Floor - {constructionPlan.first}
              ({parseFloat(config.firstFloorArea) || 0} sqft × Rs {Math.round(constructionPlan.first === 'Gray' ? (parseFloat(config.myGrayRate) || 0) : (parseFloat(config.myFurnishedRate) || 0))})
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Rs {Math.round((parseFloat(config.firstFloorArea) || 0) * (constructionPlan.first === 'Gray' ? (parseFloat(config.myGrayRate) || 0) : (parseFloat(config.myFurnishedRate) || 0))).toLocaleString()}
            </Typography>
          </Box>
        )}

        {constructionPlan.second !== 'None' && (
          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              Second Floor - {constructionPlan.second}
              ({parseFloat(config.secondFloorArea) || 0} sqft × Rs {Math.round(constructionPlan.second === 'Gray' ? (parseFloat(config.myGrayRate) || 0) : (parseFloat(config.myFurnishedRate) || 0))})
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Rs {Math.round((parseFloat(config.secondFloorArea) || 0) * (constructionPlan.second === 'Gray' ? (parseFloat(config.myGrayRate) || 0) : (parseFloat(config.myFurnishedRate) || 0))).toLocaleString()}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Total:
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Rs {Math.round(planCost).toLocaleString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4, px: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
        💰 Cost Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Compare costs, validate payments, and calculate scenarios
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab 
            label="Cost Comparison" 
            icon={<CompareArrowsIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Construction Calculator" 
            icon={<CalculateIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {tabValue === 0 && renderCostComparisonTable()}
      {tabValue === 1 && renderConstructionCalculator()}
    </Container>
  );
};

export default CostDashboard;
