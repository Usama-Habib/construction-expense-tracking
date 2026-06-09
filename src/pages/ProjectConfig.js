import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Divider,
  Card,
  CardContent,
  Alert,
  InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useExpense } from '../contexts/ExpenseContext';

const ProjectConfig = () => {
  const { projectConfig, saveProjectConfig } = useExpense();
  
  const [config, setConfig] = useState({
    // Floor Areas (sqft)
    foundationArea: 90,
    groundFloorArea: 360,
    firstFloorArea: 360,
    secondFloorArea: 360,
    
    // Rates (Rs per sqft)
    foundationRate: 700,
    grayStructureRate: 550,
    furnishedRate: 700,
    
    // Contract Details
    contractorName: '',
    contractDate: new Date().toISOString().split('T')[0],
    totalContractAmount: 0,
    
    // Payment Milestones (%)
    paymentMilestones: [
      { stage: 'Mobilization advance', percentage: 15, description: 'Initial advance payment' },
      { stage: 'Plint level', percentage: 5, description: 'Plinth level completion' },
      { stage: 'Ground floor slab structure', percentage: 10, description: 'Ground floor slab structure' },
      { stage: 'First & second floor structure+O.H.W tank', percentage: 15, description: 'First & Second Floor structure + O.H.W tank' },
      { stage: 'Ground floor plaster work', percentage: 8, description: 'Ground floor plaster work' },
      { stage: 'First & second floor plaster work', percentage: 8, description: 'First & second floor plaster work' },
      { stage: 'Ground, first & second floor tiling work', percentage: 15, description: 'Ground, first & second floor tiling work' },
      { stage: 'Wood work', percentage: 8, description: 'Wood work' },
      { stage: 'Coloring work', percentage: 10, description: 'Coloring work' },
      { stage: 'Electric & plumbing fitting & fixtures', percentage: 6, description: 'Electric & plumbing fitting & fixtures' },
    ],
  });

  const [comparison, setComparison] = useState({
    otherFoundationArea: 1080,
    otherFoundationRate: 275,
    otherGrayRate: 550,
    otherFurnishedRate: 700,
  });

  useEffect(() => {
    if (projectConfig) {
      // Use the default payment milestones if not saved in projectConfig yet
      const defaultMilestones = [
        { stage: 'Mobilization advance', percentage: 15, description: 'Initial advance payment' },
        { stage: 'Plint level', percentage: 5, description: 'Plinth level completion' },
        { stage: 'Ground floor slab structure', percentage: 10, description: 'Ground floor slab structure' },
        { stage: 'First & second floor structure+O.H.W tank', percentage: 15, description: 'First & Second Floor structure + O.H.W tank' },
        { stage: 'Ground floor plaster work', percentage: 8, description: 'Ground floor plaster work' },
        { stage: 'First & second floor plaster work', percentage: 8, description: 'First & second floor plaster work' },
        { stage: 'Ground, first & second floor tiling work', percentage: 15, description: 'Ground, first & second floor tiling work' },
        { stage: 'Wood work', percentage: 8, description: 'Wood work' },
        { stage: 'Coloring work', percentage: 10, description: 'Coloring work' },
        { stage: 'Electric & plumbing fitting & fixtures', percentage: 6, description: 'Electric & plumbing fitting & fixtures' },
      ];
      
      setConfig({ 
        ...config, 
        ...projectConfig,
        // Always use the new 10-stage payment milestones
        paymentMilestones: projectConfig.paymentMilestones?.length === 10 
          ? projectConfig.paymentMilestones 
          : defaultMilestones
      });
      
      if (projectConfig.contractorComparison) {
        setComparison(projectConfig.contractorComparison);
      }
    }
  }, [projectConfig]);

  // Calculate totals
  const calculateProjectCost = () => {
    const foundation = config.foundationArea * config.foundationRate;
    const groundFloor = config.groundFloorArea * config.furnishedRate;
    const firstFloor = config.firstFloorArea * config.furnishedRate;
    const secondFloor = config.secondFloorArea * config.furnishedRate;
    
    return {
      foundation,
      groundFloor,
      firstFloor,
      secondFloor,
      total: foundation + groundFloor + firstFloor + secondFloor,
      totalArea: config.foundationArea + config.groundFloorArea + config.firstFloorArea + config.secondFloorArea,
    };
  };

  const calculateOtherContractorCost = () => {
    const foundation = comparison.otherFoundationArea * comparison.otherFoundationRate;
    const totalFloorArea = config.groundFloorArea + config.firstFloorArea + config.secondFloorArea;
    const floors = totalFloorArea * comparison.otherFurnishedRate;
    
    return {
      foundation,
      floors,
      total: foundation + floors,
    };
  };

  const yourCost = calculateProjectCost();
  const otherCost = calculateOtherContractorCost();
  const savings = otherCost.total - yourCost.total;

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleComparisonChange = (field, value) => {
    setComparison(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    const finalConfig = {
      ...config,
      totalContractAmount: yourCost.total,
      contractorComparison: comparison, // Save comparison data
      lastUpdated: new Date().toISOString(),
    };
    
    await saveProjectConfig(finalConfig);
    alert('✅ Project configuration saved successfully!');
  };

  const handleMilestoneChange = (index, field, value) => {
    const newMilestones = [...config.paymentMilestones];
    newMilestones[index][field] = field === 'percentage' ? parseFloat(value) || 0 : value;
    setConfig(prev => ({
      ...prev,
      paymentMilestones: newMilestones
    }));
  };

  const totalMilestonePercentage = config.paymentMilestones.reduce((sum, m) => sum + m.percentage, 0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
        📋 Project Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Set up your project details, floor areas, rates, and payment milestones
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Project Details */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              📝 Contract Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contractor Name"
                  value={config.contractorName}
                  onChange={(e) => setConfig(prev => ({ ...prev, contractorName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Contract Date"
                  value={config.contractDate}
                  onChange={(e) => setConfig(prev => ({ ...prev, contractDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Floor Areas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              📐 Floor Areas (sqft)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Foundation Area"
                  value={config.foundationArea}
                  onChange={(e) => handleInputChange('foundationArea', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">sqft</InputAdornment>
                  }}
                  helperText="Underground tank covered area"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Ground Floor Area"
                  value={config.groundFloorArea}
                  onChange={(e) => handleInputChange('groundFloorArea', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">sqft</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="First Floor Area"
                  value={config.firstFloorArea}
                  onChange={(e) => handleInputChange('firstFloorArea', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">sqft</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Second Floor Area"
                  value={config.secondFloorArea}
                  onChange={(e) => handleInputChange('secondFloorArea', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">sqft</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  Total Area: <strong>{yourCost.totalArea.toLocaleString()} sqft</strong>
                </Alert>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Rates */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              💰 Rate Card (Rs/sqft)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Foundation Rate"
                  value={config.foundationRate}
                  onChange={(e) => handleInputChange('foundationRate', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/sqft</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Gray Structure Rate"
                  value={config.grayStructureRate}
                  onChange={(e) => handleInputChange('grayStructureRate', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/sqft</InputAdornment>
                  }}
                  helperText="Rate for structure only (no finishing)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Fully Furnished Rate"
                  value={config.furnishedRate}
                  onChange={(e) => handleInputChange('furnishedRate', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/sqft</InputAdornment>
                  }}
                  helperText="Complete construction rate"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Finishing Cost Per Sqft:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="secondary">
                    Rs {config.furnishedRate - config.grayStructureRate}/sqft
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Project Cost Breakdown */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              💵 Your Project Cost Breakdown
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Foundation</Typography>
                <Typography variant="h6" fontWeight="bold">
                  Rs {yourCost.foundation.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {config.foundationArea} sqft × Rs {config.foundationRate}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Ground Floor</Typography>
                <Typography variant="h6" fontWeight="bold">
                  Rs {yourCost.groundFloor.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {config.groundFloorArea} sqft × Rs {config.furnishedRate}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>First Floor</Typography>
                <Typography variant="h6" fontWeight="bold">
                  Rs {yourCost.firstFloor.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {config.firstFloorArea} sqft × Rs {config.furnishedRate}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Second Floor</Typography>
                <Typography variant="h6" fontWeight="bold">
                  Rs {yourCost.secondFloor.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {config.secondFloorArea} sqft × Rs {config.furnishedRate}
                </Typography>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5">Total Contract Amount:</Typography>
              <Typography variant="h4" fontWeight="bold">
                Rs {yourCost.total.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Payment Milestones */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              📊 Payment Milestones
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Define when payments should be made based on construction stages
            </Typography>
            
            {config.paymentMilestones.map((milestone, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Stage Name"
                      value={milestone.stage}
                      onChange={(e) => handleMilestoneChange(index, 'stage', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Payment %"
                      value={milestone.percentage}
                      onChange={(e) => handleMilestoneChange(index, 'percentage', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="body2" color="text.secondary">
                      Rs {(yourCost.total * milestone.percentage / 100).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
            
            <Alert 
              severity={totalMilestonePercentage === 100 ? "success" : "warning"}
              sx={{ mt: 2 }}
            >
              Total: {totalMilestonePercentage}% 
              {totalMilestonePercentage !== 100 && ` (Should be 100%)`}
            </Alert>
          </Paper>
        </Grid>

        {/* Contractor Comparison */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CompareArrowsIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" color="primary">
                Compare with Other Contractors
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Other Contractor's Rates:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Foundation Area"
                      value={comparison.otherFoundationArea}
                      onChange={(e) => handleComparisonChange('otherFoundationArea', e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">sqft</InputAdornment>
                      }}
                      helperText="Typical: Total project area (e.g., 1080)"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Foundation Rate"
                      value={comparison.otherFoundationRate}
                      onChange={(e) => handleComparisonChange('otherFoundationRate', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                        endAdornment: <InputAdornment position="end">/sqft</InputAdornment>
                      }}
                      helperText="Typical: Rs 250-300/sqft"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Furnished Rate"
                      value={comparison.otherFurnishedRate}
                      onChange={(e) => handleComparisonChange('otherFurnishedRate', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                        endAdornment: <InputAdornment position="end">/sqft</InputAdornment>
                      }}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: savings >= 0 ? '#e8f5e9' : '#ffebee' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Cost Comparison
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Your Contractor:</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        Rs {yourCost.total.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Foundation: Rs {yourCost.foundation.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Floors: Rs {(yourCost.total - yourCost.foundation).toLocaleString()}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Other Contractor:</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        Rs {otherCost.total.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Foundation: Rs {otherCost.foundation.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Floors: Rs {otherCost.floors.toLocaleString()}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color={savings >= 0 ? 'success.main' : 'error.main'}>
                        {savings >= 0 ? '✅ Savings:' : '⚠️ Extra Cost:'}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color={savings >= 0 ? 'success.main' : 'error.main'}>
                        Rs {Math.abs(savings).toLocaleString()}
                      </Typography>
                    </Box>
                    
                    {savings >= 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        You're saving {((savings / otherCost.total) * 100).toFixed(1)}% with your contractor! 🎉
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{
                px: 4,
                py: 1.5,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5568d3 30%, #63408b 90%)',
                }
              }}
            >
              Save Project Configuration
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProjectConfig;
