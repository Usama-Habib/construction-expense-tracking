import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Divider,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useExpense } from '../contexts/ExpenseContext';

const ProgressTracker = () => {
  const { projectConfig, progressData, saveProgressData } = useExpense();
  const [editDialog, setEditDialog] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);

  const [progress, setProgress] = useState({
    foundation: {
      name: 'Foundation',
      stage: 'Not Started',
      progress: 0,
      status: 'pending',
      notes: '',
      photos: [],
      startDate: '',
      completionDate: '',
    },
    groundFloor: {
      name: 'Ground Floor',
      stage: 'Not Started',
      progress: 0,
      grayProgress: 0,
      finishingProgress: 0,
      status: 'pending',
      notes: '',
      photos: [],
      startDate: '',
      completionDate: '',
    },
    firstFloor: {
      name: 'First Floor',
      stage: 'Not Started',
      progress: 0,
      grayProgress: 0,
      finishingProgress: 0,
      status: 'pending',
      notes: '',
      photos: [],
      startDate: '',
      completionDate: '',
    },
    secondFloor: {
      name: 'Second Floor',
      stage: 'Not Started',
      progress: 0,
      grayProgress: 0,
      finishingProgress: 0,
      status: 'pending',
      notes: '',
      photos: [],
      startDate: '',
      completionDate: '',
    },
  });

  useEffect(() => {
    if (progressData) {
      setProgress(progressData);
    }
  }, [progressData]);

  const stageOptions = ['Not Started', 'In Progress', 'Completed'];
  const floorStageOptions = ['Not Started', 'Gray Structure', 'Finishing', 'Completed'];

  const calculateWorkValue = () => {
    if (!projectConfig) return { total: 0, breakdown: [] };

    const config = projectConfig;
    let totalValue = 0;
    const breakdown = [];

    // Foundation
    const foundationValue = (progress.foundation.progress / 100) * 
      (config.foundationArea * config.foundationRate);
    totalValue += foundationValue;
    breakdown.push({
      name: 'Foundation',
      value: foundationValue,
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
      progress: (progress.groundFloor.grayProgress + progress.groundFloor.finishingProgress) / 2,
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
      progress: (progress.firstFloor.grayProgress + progress.firstFloor.finishingProgress) / 2,
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
      progress: (progress.secondFloor.grayProgress + progress.secondFloor.finishingProgress) / 2,
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

  const workValue = calculateWorkValue();

  const handleOpenEdit = (floorKey) => {
    setCurrentEdit({
      floorKey,
      data: { ...progress[floorKey] }
    });
    setEditDialog(true);
  };

  const handleCloseEdit = () => {
    setEditDialog(false);
    setCurrentEdit(null);
  };

  const handleSaveProgress = async () => {
    if (currentEdit) {
      const updatedProgress = {
        ...progress,
        [currentEdit.floorKey]: currentEdit.data
      };
      setProgress(updatedProgress);
      await saveProgressData(updatedProgress);
    }
    handleCloseEdit();
  };

  const handleEditChange = (field, value) => {
    setCurrentEdit(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      }
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#4caf50';
    if (progress >= 50) return '#ff9800';
    if (progress >= 20) return '#2196f3';
    return '#9e9e9e';
  };

  const chartData = workValue.breakdown.map(item => ({
    name: item.name,
    'Work Value (Rs)': item.value,
    'Progress (%)': item.progress,
  }));

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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
        📊 Progress Tracker
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track construction progress and calculate actual work value
      </Typography>

      {/* Overall Progress Summary */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Work Value Completed</Typography>
                <Typography variant="h4" fontWeight="bold">
                  Rs {workValue.total.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  out of Rs {workValue.totalContractValue.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Overall Progress</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {workValue.percentageComplete}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={parseFloat(workValue.percentageComplete)} 
                  sx={{ 
                    mt: 1, 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': { bgcolor: 'white' }
                  }} 
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Remaining Value</Typography>
                <Typography variant="h4" fontWeight="bold">
                  Rs {(workValue.totalContractValue - workValue.total).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {(100 - parseFloat(workValue.percentageComplete)).toFixed(2)}% remaining
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Project Status</Typography>
                <Typography variant="h5" fontWeight="bold">
                  {workValue.percentageComplete < 25 ? 'Early Stage' :
                   workValue.percentageComplete < 50 ? 'In Progress' :
                   workValue.percentageComplete < 75 ? 'Halfway' :
                   workValue.percentageComplete < 100 ? 'Near Completion' : 'Completed'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Progress Chart */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Work Value by Floor
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="Work Value (Rs)" fill="#667eea" />
                <Bar yAxisId="right" dataKey="Progress (%)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Progress Breakdown */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Value Breakdown
            </Typography>
            {workValue.breakdown.map((item, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    Rs {item.value.toLocaleString()}
                  </Typography>
                </Box>
                {item.grayValue !== undefined && (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      Gray: Rs {item.grayValue.toLocaleString()} | 
                      Finishing: Rs {item.finishValue.toLocaleString()}
                    </Typography>
                  </>
                )}
                <LinearProgress 
                  variant="determinate" 
                  value={item.progress} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': { bgcolor: getProgressColor(item.progress) }
                  }} 
                />
                <Typography variant="caption" color="text.secondary">
                  {item.progress.toFixed(1)}% complete
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Floor Progress Cards */}
        {Object.entries(progress).map(([key, floor]) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {floor.name}
                  </Typography>
                  <IconButton size="small" onClick={() => handleOpenEdit(key)} color="primary">
                    <EditIcon />
                  </IconButton>
                </Box>

                <Chip 
                  label={floor.stage} 
                  size="small" 
                  color={
                    floor.stage === 'Completed' ? 'success' :
                    floor.stage === 'In Progress' || floor.stage.includes('Gray') || floor.stage.includes('Finishing') ? 'warning' :
                    'default'
                  }
                  sx={{ mb: 2 }}
                />

                {key === 'foundation' ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Overall Progress
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={floor.progress} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        '& .MuiLinearProgress-bar': { bgcolor: getProgressColor(floor.progress) }
                      }} 
                    />
                    <Typography variant="caption" color="text.secondary">
                      {floor.progress}%
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Gray Structure
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={floor.grayProgress} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          '& .MuiLinearProgress-bar': { bgcolor: '#2196f3' }
                        }} 
                      />
                      <Typography variant="caption" color="text.secondary">
                        {floor.grayProgress}%
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Finishing Work
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={floor.finishingProgress} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          '& .MuiLinearProgress-bar': { bgcolor: '#ff9800' }
                        }} 
                      />
                      <Typography variant="caption" color="text.secondary">
                        {floor.finishingProgress}%
                      </Typography>
                    </Box>
                  </>
                )}

                {floor.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    📝 {floor.notes}
                  </Typography>
                )}

                {floor.startDate && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Started: {new Date(floor.startDate).toLocaleDateString()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Progress - {currentEdit?.data.name}
        </DialogTitle>
        <DialogContent>
          {currentEdit && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Stage</InputLabel>
                  <Select
                    value={currentEdit.data.stage}
                    label="Stage"
                    onChange={(e) => handleEditChange('stage', e.target.value)}
                  >
                    {(currentEdit.floorKey === 'foundation' ? stageOptions : floorStageOptions).map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {currentEdit.floorKey === 'foundation' ? (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Overall Progress (%)"
                    value={currentEdit.data.progress}
                    onChange={(e) => handleEditChange('progress', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    inputProps={{ min: 0, max: 100, step: 5 }}
                  />
                </Grid>
              ) : (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Gray Structure Progress (%)"
                      value={currentEdit.data.grayProgress}
                      onChange={(e) => handleEditChange('grayProgress', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      inputProps={{ min: 0, max: 100, step: 5 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Finishing Progress (%)"
                      value={currentEdit.data.finishingProgress}
                      onChange={(e) => handleEditChange('finishingProgress', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      inputProps={{ min: 0, max: 100, step: 5 }}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={currentEdit.data.startDate}
                  onChange={(e) => handleEditChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Completion Date"
                  value={currentEdit.data.completionDate}
                  onChange={(e) => handleEditChange('completionDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={currentEdit.data.notes}
                  onChange={(e) => handleEditChange('notes', e.target.value)}
                  placeholder="Add any notes about the current progress..."
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button onClick={handleSaveProgress} variant="contained" color="primary">
            Save Progress
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProgressTracker;
