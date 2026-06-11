import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Checkbox,
  ListItemText,
  Card,
  CardContent,
  CardActions,
  Stack,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useExpense } from '../contexts/ExpenseContext';

const ProjectConfig = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { projectConfig, saveProjectConfig } = useExpense();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, index: null });
  
  const defaultMilestones = [
    { stage: 'Mobilization advance', percentage: 15, description: 'Initial advance payment', levels: ['foundation'] },
    { stage: 'Plint level', percentage: 5, description: 'Plinth level completion', levels: ['foundation'] },
    { stage: 'Ground floor slab structure', percentage: 10, description: 'Ground floor slab structure', levels: ['ground'] },
    { stage: 'First & second floor structure+O.H.W tank', percentage: 15, description: 'First & Second Floor structure + O.H.W tank', levels: ['first', 'second'] },
    { stage: 'Ground floor plaster work', percentage: 8, description: 'Ground floor plaster work', levels: ['ground'] },
    { stage: 'First & second floor plaster work', percentage: 8, description: 'First & second floor plaster work', levels: ['first', 'second'] },
    { stage: 'Ground, first & second floor tiling work', percentage: 15, description: 'Ground, first & second floor tiling work', levels: ['ground', 'first', 'second'] },
    { stage: 'Wood work', percentage: 8, description: 'Wood work', levels: ['ground'] },
    { stage: 'Coloring work', percentage: 10, description: 'Coloring work', levels: ['first'] },
    { stage: 'Electric & plumbing fitting & fixtures', percentage: 6, description: 'Electric & plumbing fitting & fixtures', levels: ['first'] },
  ];

  const [config, setConfig] = useState({
    // Floor Areas (sqft)
    foundationArea: 90,
    groundFloorArea: 360,
    firstFloorArea: 360,
    secondFloorArea: 360,
    
    // Your Contractor Rates (Rs per sqft)
    myFoundationRate: 700,
    myGrayRate: 550,
    myFurnishedRate: 700,
    
    // External Contractor Rates (Rs per sqft)
    extFoundationArea: 1080,
    extFoundationRate: 275,
    extGrayRate: 550,
    extFurnishedRate: 700,
    
    // Payment Milestones (%)
    paymentMilestones: defaultMilestones,
  });

  useEffect(() => {
    if (projectConfig) {
      setConfig(prev => ({ 
        ...prev, 
        ...projectConfig,
        paymentMilestones: projectConfig.paymentMilestones?.length === 10 
          ? projectConfig.paymentMilestones 
          : defaultMilestones
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectConfig]);

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Calculate total area
  const totalArea = 
    (parseFloat(config.foundationArea) || 0) + 
    (parseFloat(config.groundFloorArea) || 0) + 
    (parseFloat(config.firstFloorArea) || 0) + 
    (parseFloat(config.secondFloorArea) || 0);

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...config.paymentMilestones];
    updated[index] = { ...updated[index], [field]: value };
    setConfig(prev => ({ ...prev, paymentMilestones: updated }));
  };

  const addMilestone = () => {
    setConfig(prev => ({
      ...prev,
      paymentMilestones: [
        ...prev.paymentMilestones,
        { stage: '', percentage: 0, description: '', levels: [] }
      ]
    }));
  };

  const removeMilestone = (index) => {
    setDeleteConfirm({ open: true, index });
  };

  const confirmRemoveMilestone = () => {
    if (deleteConfirm.index !== null) {
      setConfig(prev => ({
        ...prev,
        paymentMilestones: prev.paymentMilestones.filter((_, i) => i !== deleteConfirm.index)
      }));
    }
    setDeleteConfirm({ open: false, index: null });
  };

  const totalPercentage = config.paymentMilestones.reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0);

  const handleSave = async () => {
    try {
      await saveProjectConfig(config);
      setSaveSuccess(true);
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

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
          ⚙️ Project Setup
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure rates, areas, and payment schedule
        </Typography>

      {/* Areas */}
      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">📐 Floor Areas (sqft)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Foundation (Tank Area)"
              value={config.foundationArea}
              onChange={(e) => handleInputChange('foundationArea', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">sqft</InputAdornment> }}
              helperText="10×9 = 90 sqft (underground tank)"
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Ground Floor"
              value={config.groundFloorArea}
              onChange={(e) => handleInputChange('groundFloorArea', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">sqft</InputAdornment> }}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="First Floor"
              value={config.firstFloorArea}
              onChange={(e) => handleInputChange('firstFloorArea', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">sqft</InputAdornment> }}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Second Floor"
              value={config.secondFloorArea}
              onChange={(e) => handleInputChange('secondFloorArea', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">sqft</InputAdornment> }}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Total Area:</strong> {totalArea.toLocaleString()} sqft
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Foundation ({config.foundationArea}) + Ground ({config.groundFloorArea}) + First ({config.firstFloorArea}) + Second ({config.secondFloorArea})
              </Typography>
            </Alert>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Your Contractor Rates */}
      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">💰 Your Contractor Rates</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Foundation Rate"
              value={config.myFoundationRate}
              onChange={(e) => handleInputChange('myFoundationRate', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                endAdornment: <InputAdornment position="end">/sqft</InputAdornment>
              }}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Gray Structure Rate"
              value={config.myGrayRate}
              onChange={(e) => handleInputChange('myGrayRate', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                endAdornment: <InputAdornment position="end">/sqft</InputAdornment>
              }}
              helperText="Structure only, no finishing"
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Fully Furnished Rate"
              value={config.myFurnishedRate}
              onChange={(e) => handleInputChange('myFurnishedRate', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                endAdornment: <InputAdornment position="end">/sqft</InputAdornment>
              }}
              helperText="Complete finishing included"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* External Contractor Rates */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">🏢 External Contractor Rates (For Comparison)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="External Foundation Area"
              value={config.extFoundationArea}
              onChange={(e) => handleInputChange('extFoundationArea', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">sqft</InputAdornment> }}
              helperText="Typically 1080 sqft (full area)"
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="External Foundation Rate"
              value={config.extFoundationRate}
              onChange={(e) => handleInputChange('extFoundationRate', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                endAdornment: <InputAdornment position="end">/sqft</InputAdornment>
              }}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="External Gray Rate"
              value={config.extGrayRate}
              onChange={(e) => handleInputChange('extGrayRate', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                endAdornment: <InputAdornment position="end">/sqft</InputAdornment>
              }}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="External Furnished Rate"
              value={config.extFurnishedRate}
              onChange={(e) => handleInputChange('extFurnishedRate', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                endAdornment: <InputAdornment position="end">/sqft</InputAdornment>
              }}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Payment Milestones */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
            <Typography variant="h6">📊 Payment Schedule</Typography>
            <Typography 
              variant="body2" 
              color={totalPercentage === 100 ? 'success.main' : 'error.main'}
              sx={{ fontWeight: 'bold' }}
            >
              {totalPercentage}%
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {totalPercentage !== 100 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Total must equal 100% (currently {totalPercentage}%)
              </Alert>
            )}
            
            {isMobile ? (
              // CARD VIEW for Mobile
              <Stack spacing={2}>
                {config.paymentMilestones.map((milestone, index) => (
                  <Card 
                    key={index}
                    elevation={2}
                    sx={{ 
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      '&:active': {
                        transform: 'scale(0.98)',
                        transition: 'transform 0.1s'
                      }
                    }}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Chip 
                          label={`Stage ${index + 1}`} 
                          size="small" 
                          color="primary" 
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip 
                          label={`${milestone.percentage}%`} 
                          size="small" 
                          color="success"
                          sx={{ fontWeight: 700, fontSize: '0.85rem' }}
                        />
                      </Box>
                      
                      <TextField
                        fullWidth
                        size="small"
                        label="🏗️ Stage Name"
                        value={milestone.stage}
                        onChange={(e) => handleMilestoneChange(index, 'stage', e.target.value)}
                        placeholder="Stage name"
                        sx={{ mb: 2 }}
                      />
                      
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <Select
                          multiple
                          displayEmpty
                          value={milestone.levels || (milestone.level ? [milestone.level] : [])}
                          onChange={(e) => handleMilestoneChange(index, 'levels', e.target.value)}
                          renderValue={(selected) => (
                            selected.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">Select Levels</Typography>
                            ) : (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                  <Chip 
                                    key={value} 
                                    label={value.charAt(0).toUpperCase() + value.slice(1)} 
                                    size="small"
                                    sx={{ 
                                      height: 22, 
                                      fontSize: '0.75rem',
                                      bgcolor: 
                                        value === 'foundation' ? '#9e9e9e' :
                                        value === 'ground' ? '#2196f3' :
                                        value === 'first' ? '#9c27b0' :
                                        '#00bcd4',
                                      color: 'white'
                                    }}
                                  />
                                ))}
                              </Box>
                            )
                          )}
                        >
                          <MenuItem value="foundation">
                            <Checkbox checked={(milestone.levels || (milestone.level ? [milestone.level] : [])).indexOf('foundation') > -1} />
                            <ListItemText primary="🏗️ Foundation" />
                          </MenuItem>
                          <MenuItem value="ground">
                            <Checkbox checked={(milestone.levels || (milestone.level ? [milestone.level] : [])).indexOf('ground') > -1} />
                            <ListItemText primary="🏠 Ground" />
                          </MenuItem>
                          <MenuItem value="first">
                            <Checkbox checked={(milestone.levels || (milestone.level ? [milestone.level] : [])).indexOf('first') > -1} />
                            <ListItemText primary="1️⃣ First" />
                          </MenuItem>
                          <MenuItem value="second">
                            <Checkbox checked={(milestone.levels || (milestone.level ? [milestone.level] : [])).indexOf('second') > -1} />
                            <ListItemText primary="2️⃣ Second" />
                          </MenuItem>
                        </Select>
                      </FormControl>
                      
                      <TextField
                        fullWidth
                        size="small"
                        label="📊 Percentage"
                        type="number"
                        value={milestone.percentage}
                        onChange={(e) => handleMilestoneChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      />
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 0 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => removeMilestone(index)}
                        sx={{ textTransform: 'none' }}
                      >
                        Remove
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Stack>
            ) : (
              // TABLE VIEW for Desktop
              <TableContainer sx={{ 
                maxHeight: { xs: 400, md: 600 }, 
                overflow: 'auto',
                '& table': {
                  minWidth: { xs: 'auto', md: 650 }
                }
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Stage</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell align="right">%</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {config.paymentMilestones.map((milestone, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={milestone.stage}
                            onChange={(e) => handleMilestoneChange(index, 'stage', e.target.value)}
                            placeholder="Stage name"
                          />
                        </TableCell>
                        <TableCell sx={{ width: 200 }}>
                          <FormControl fullWidth size="small">
                            <Select
                              multiple
                              value={milestone.levels || (milestone.level ? [milestone.level] : [])}
                              onChange={(e) => handleMilestoneChange(index, 'levels', e.target.value)}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => (
                                    <Chip 
                                      key={value} 
                                      label={value.charAt(0).toUpperCase() + value.slice(1)} 
                                      size="small"
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                  ))}
                                </Box>
                              )}
                            >
                              <MenuItem value="foundation">
                                <Checkbox checked={(milestone.levels || (milestone.level ? [milestone.level] : [])).indexOf('foundation') > -1} />
                                <ListItemText primary="Foundation" />
                              </MenuItem>
                              <MenuItem value="ground">
                                <Checkbox checked={(milestone.levels || (milestone.level ? [milestone.level] : [])).indexOf('ground') > -1} />
                                <ListItemText primary="Ground" />
                              </MenuItem>
                              <MenuItem value="first">
                                <Checkbox checked={(milestone.levels || (milestone.level ? [milestone.level] : [])).indexOf('first') > -1} />
                                <ListItemText primary="First" />
                              </MenuItem>
                              <MenuItem value="second">
                                <Checkbox checked={(milestone.levels || (milestone.level ? [milestone.level] : [])).indexOf('second') > -1} />
                                <ListItemText primary="Second" />
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell align="right" sx={{ width: 100 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={milestone.percentage}
                            onChange={(e) => handleMilestoneChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                            sx={{ width: 90 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ width: 60 }}>
                          <IconButton size="small" color="error" onClick={() => removeMilestone(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Button
              startIcon={<AddIcon />}
              onClick={addMilestone}
              sx={{ mt: 2 }}
              size="small"
            >
              Add Stage
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={totalPercentage !== 100}
          size="large"
        >
          Save Configuration
        </Button>
      </Box>

      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        message="✅ Configuration saved successfully!"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, index: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            <Typography variant="h6" fontWeight="bold">Remove Stage?</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will remove stage {deleteConfirm.index !== null ? deleteConfirm.index + 1 : ''} from your payment schedule.
          </Typography>
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
            onClick={() => setDeleteConfirm({ open: false, index: null })}
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
            onClick={confirmRemoveMilestone}
            variant="contained"
            color="error"
            size="large"
            sx={{ 
              minWidth: { xs: '100%', sm: 120 },
              order: { xs: 1, sm: 2 }
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default ProjectConfig;
