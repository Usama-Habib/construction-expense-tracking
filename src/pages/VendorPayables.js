import React, { useState, useMemo } from 'react';
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
  Card,
  CardContent,
  Grid,
  MenuItem,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import HistoryIcon from '@mui/icons-material/History';
import { useExpense } from '../contexts/ExpenseContext';

const formatCurrency = (value) => `Rs ${(parseFloat(value) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const ALLOCATION_STRATEGIES = [
  { value: 'fifo', label: 'Oldest First (FIFO)' },
  { value: 'smallest-first', label: 'Smallest Balance First' },
  { value: 'largest-first', label: 'Largest Balance First' },
];

const VendorPayables = () => {
  const theme = useTheme();
  // Card layout kicks in for phones and tablets; the table only fits comfortably on wide desktop screens
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    paymentMethods,
    getVendorPayables,
    getVendorExpenses,
    previewPaymentAllocation,
    applyVendorPayment,
  } = useExpense();

  const [payDialog, setPayDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [strategy, setStrategy] = useState('fifo');
  const [allocations, setAllocations] = useState([]);
  const [unallocatedAmount, setUnallocatedAmount] = useState(0);
  const [paymentMeta, setPaymentMeta] = useState({
    date: new Date().toISOString().split('T')[0],
    method: '',
    notes: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [submitting, setSubmitting] = useState(false);

  const vendorPayables = useMemo(() => getVendorPayables(), [getVendorPayables]);
  const totalOutstanding = useMemo(
    () => vendorPayables.reduce((sum, v) => sum + v.totalDue, 0),
    [vendorPayables]
  );

  const recalculateAllocation = (vendor, amount, strat) => {
    if (!vendor || !amount || parseFloat(amount) <= 0) {
      setAllocations([]);
      setUnallocatedAmount(0);
      return;
    }
    const result = previewPaymentAllocation(vendor.vendor, parseFloat(amount), strat);
    setAllocations(result.allocations);
    setUnallocatedAmount(result.unallocatedAmount);
  };

  const handleOpenPay = (vendor) => {
    setSelectedVendor(vendor);
    setPaymentAmount(vendor.totalDue.toFixed(2));
    setStrategy('fifo');
    setPaymentMeta({ date: new Date().toISOString().split('T')[0], method: '', notes: '' });
    recalculateAllocation(vendor, vendor.totalDue.toFixed(2), 'fifo');
    setPayDialog(true);
  };

  const handleOpenDetails = (vendor) => {
    setSelectedVendor(vendor);
    setDetailsDialog(true);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setPaymentAmount(value);
    recalculateAllocation(selectedVendor, value, strategy);
  };

  const handleStrategyChange = (e) => {
    const value = e.target.value;
    setStrategy(value);
    recalculateAllocation(selectedVendor, paymentAmount, value);
  };

  // Let the user fine-tune the proposed split before confirming, e.g. to skip a disputed transaction
  const handleAllocationEdit = (expenseId, newValue) => {
    setAllocations((prev) =>
      prev.map((a) => {
        if (a.expenseId !== expenseId) return a;
        const applied = Math.max(0, Math.min(parseFloat(newValue) || 0, a.previousDue));
        return { ...a, amountApplied: applied, newDue: parseFloat((a.previousDue - applied).toFixed(2)) };
      })
    );
  };

  const totalAllocated = useMemo(
    () => allocations.reduce((sum, a) => sum + (parseFloat(a.amountApplied) || 0), 0),
    [allocations]
  );

  const handleConfirmPayment = async () => {
    if (!selectedVendor || totalAllocated <= 0) {
      setSnackbar({ open: true, message: 'Enter a valid payment amount to allocate', severity: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await applyVendorPayment(selectedVendor.vendor, allocations, paymentMeta);
      setSnackbar({ open: true, message: `✓ Payment of ${formatCurrency(totalAllocated)} applied to ${selectedVendor.vendor}`, severity: 'success' });
      setPayDialog(false);
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to apply payment', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 6, px: { xs: 1.5, sm: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        💰 Vendor Payables
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        See how much is owed to each vendor and settle their balance with a single payment.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Typography variant="body2" color="text.secondary" noWrap>Total Outstanding</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                {formatCurrency(totalOutstanding)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Typography variant="body2" color="text.secondary" noWrap>Vendors With Dues</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>{vendorPayables.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {vendorPayables.length === 0 ? (
        <Alert severity="success">All vendors are fully settled. 🎉</Alert>
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {vendorPayables.map((v) => (
            <Card key={v.vendor} variant="outlined">
              <CardContent sx={{ pb: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Typography sx={{ fontWeight: 600, flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{v.vendor}</Typography>
                  <Chip label={formatCurrency(v.totalDue)} color="error" size="small" sx={{ flexShrink: 0 }} />
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mt: 0.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Billed</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{formatCurrency(v.totalAmount)}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Paid</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{formatCurrency(v.totalPaid)}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Transactions</Typography>
                    <Typography variant="body2">{v.transactionCount}</Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
                    startIcon={<PaymentsIcon />}
                    onClick={() => handleOpenPay(v)}
                  >
                    Pay
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    startIcon={<HistoryIcon />}
                    onClick={() => handleOpenDetails(v)}
                  >
                    Details
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Paper}>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell align="right">Total Billed</TableCell>
                <TableCell align="right">Total Paid</TableCell>
                <TableCell align="right">Amount Due</TableCell>
                <TableCell align="center">Transactions</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendorPayables.map((v) => (
                <TableRow key={v.vendor} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{v.vendor}</TableCell>
                  <TableCell align="right">{formatCurrency(v.totalAmount)}</TableCell>
                  <TableCell align="right">{formatCurrency(v.totalPaid)}</TableCell>
                  <TableCell align="right">
                    <Chip label={formatCurrency(v.totalDue)} color="error" size="small" />
                  </TableCell>
                  <TableCell align="center">{v.transactionCount}</TableCell>
                  <TableCell align="center" sx={{ minWidth: 220 }}>
                    <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PaymentsIcon />}
                        onClick={() => handleOpenPay(v)}
                      >
                        Pay
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => handleOpenDetails(v)}
                      >
                        Details
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Payment Dialog */}
      <Dialog open={payDialog} onClose={() => setPayDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ wordBreak: 'break-word' }}>Pay {selectedVendor?.vendor}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Payment Amount"
                type="number"
                fullWidth
                value={paymentAmount}
                onChange={handleAmountChange}
                InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Allocation Strategy"
                fullWidth
                value={strategy}
                onChange={handleStrategyChange}
              >
                {ALLOCATION_STRATEGIES.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Payment Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={paymentMeta.date}
                onChange={(e) => setPaymentMeta((prev) => ({ ...prev, date: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Payment Method"
                fullWidth
                value={paymentMeta.method}
                onChange={(e) => setPaymentMeta((prev) => ({ ...prev, method: e.target.value }))}
              >
                <MenuItem value="">-- Select --</MenuItem>
                {paymentMethods.map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Notes"
                fullWidth
                value={paymentMeta.notes}
                onChange={(e) => setPaymentMeta((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Proposed Allocation (review and edit before confirming)
          </Typography>

          {allocations.length === 0 ? (
            <Alert severity="info">Enter a payment amount to see the proposed allocation.</Alert>
          ) : isMobile ? (
            <Stack spacing={1}>
              {allocations.map((a) => (
                <Card key={a.expenseId} variant="outlined">
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography variant="body2" sx={{ minWidth: 0, wordBreak: 'break-word' }}>{a.date}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', minWidth: 0, wordBreak: 'break-word' }}>
                        {a.category}{a.subCategory ? ` / ${a.subCategory}` : ''}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Amount Due: {formatCurrency(a.previousDue)}
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      label="Apply Amount"
                      fullWidth
                      value={a.amountApplied}
                      onChange={(e) => handleAllocationEdit(a.expenseId, e.target.value)}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Remaining after: {formatCurrency(a.previousDue - (parseFloat(a.amountApplied) || 0))}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount Due</TableCell>
                    <TableCell align="right">Apply</TableCell>
                    <TableCell align="right">Remaining After</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allocations.map((a) => (
                    <TableRow key={a.expenseId}>
                      <TableCell>{a.date}</TableCell>
                      <TableCell>{a.category}{a.subCategory ? ` / ${a.subCategory}` : ''}</TableCell>
                      <TableCell align="right">{formatCurrency(a.previousDue)}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={a.amountApplied}
                          onChange={(e) => handleAllocationEdit(a.expenseId, e.target.value)}
                          sx={{ width: 110 }}
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(a.previousDue - (parseFloat(a.amountApplied) || 0))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Total Allocated: <strong>{formatCurrency(totalAllocated)}</strong></Typography>
            {unallocatedAmount > 0.001 && (
              <Typography variant="body2" color="warning.main">
                Unallocated (exceeds total due): {formatCurrency(unallocatedAmount)}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={submitting || totalAllocated <= 0}
            onClick={handleConfirmPayment}
          >
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vendor Details Dialog: overall relationship — summary + every transaction + recorded lump-sum payments */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ wordBreak: 'break-word' }}>Vendor Details — {selectedVendor?.vendor}</DialogTitle>
        <DialogContent dividers>
          {selectedVendor && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Total Billed</Typography>
                <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, wordBreak: 'break-word' }}>{formatCurrency(selectedVendor.totalAmount)}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Total Paid</Typography>
                <Typography variant="h6" color="success.main" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, wordBreak: 'break-word' }}>{formatCurrency(selectedVendor.totalPaid)}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Outstanding</Typography>
                <Typography variant="h6" color="error.main" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, wordBreak: 'break-word' }}>{formatCurrency(selectedVendor.totalDue)}</Typography>
              </Grid>
            </Grid>
          )}

          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            All Transactions ({selectedVendor ? getVendorExpenses(selectedVendor.vendor).length : 0})
          </Typography>
          {selectedVendor && getVendorExpenses(selectedVendor.vendor).length === 0 ? (
            <Alert severity="info">No transactions recorded for this vendor.</Alert>
          ) : isMobile ? (
            <Stack spacing={1} sx={{ mb: 3, maxHeight: 300, overflowY: 'auto' }}>
              {selectedVendor && getVendorExpenses(selectedVendor.vendor).map((exp) => (
                <Card key={exp.id} variant="outlined">
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Typography variant="body2" sx={{ minWidth: 0 }}>{exp.date}</Typography>
                      <Chip
                        size="small"
                        label={exp.paymentStatus || 'Pending'}
                        color={exp.dueAmount <= 0.001 ? 'success' : (exp.paidAmountTotal > 0 ? 'warning' : 'default')}
                        sx={{ flexShrink: 0 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ wordBreak: 'break-word' }}>
                      {exp.category}{exp.subCategory ? ` / ${exp.subCategory}` : ''}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mt: 0.5 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Billed</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{formatCurrency(exp.billedAmount)}</Typography>
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Paid</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{formatCurrency(exp.paidAmountTotal)}</Typography>
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Due</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{formatCurrency(exp.dueAmount)}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Billed</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Due</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedVendor && getVendorExpenses(selectedVendor.vendor).map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>{exp.date}</TableCell>
                      <TableCell>{exp.category}{exp.subCategory ? ` / ${exp.subCategory}` : ''}</TableCell>
                      <TableCell align="right">{formatCurrency(exp.billedAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(exp.paidAmountTotal)}</TableCell>
                      <TableCell align="right">{formatCurrency(exp.dueAmount)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={exp.paymentStatus || 'Pending'}
                          color={exp.dueAmount <= 0.001 ? 'success' : (exp.paidAmountTotal > 0 ? 'warning' : 'default')}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1300 }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Container>
  );
};

export default VendorPayables;
