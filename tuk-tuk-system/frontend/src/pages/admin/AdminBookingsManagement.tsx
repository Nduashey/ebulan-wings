import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  Visibility,
  CheckCircle,
  Cancel,
  Refresh,
} from '@mui/icons-material';
import axios from 'axios';

interface Booking {
  id: number;
  booking_id: string;
  service_type: string;
  pickup_location: string;
  dropoff_location: string;
  phone: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  is_guest: boolean;
  created_at: string;
}

const AdminBookingsManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchBookings = async () => {
    try {
      // setLoading(true);
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterService !== 'all') params.serviceType = filterService;

      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/bookings`, { params });
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filterStatus, filterService]);

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'warning',
      confirmed: 'info',
      'in-progress': 'primary',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getServiceIcon = (serviceType: string) => {
    const icons: any = {
      taxi: '',
      cargo: '📦',
      delivery: '🛵',
      airport: '✈️',
    };
    return icons[serviceType] || '🚗';
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/bookings/${bookingId}/status`,
        { status: newStatus }
      );
      fetchBookings();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.booking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone.includes(searchTerm) ||
      booking.pickup_location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          📋 Booking Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all bookings (guest & registered users)
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            placeholder="Search by booking ID, phone, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Service</InputLabel>
            <Select value={filterService} onChange={(e) => setFilterService(e.target.value)} label="Service">
              <MenuItem value="all">All Services</MenuItem>
              <MenuItem value="taxi">Taxi</MenuItem>
              <MenuItem value="cargo">Cargo</MenuItem>
              <MenuItem value="delivery">Delivery</MenuItem>
              <MenuItem value="airport">Airport</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<Refresh />} onClick={fetchBookings}>
            Refresh
          </Button>
        </Stack>
      </Paper>

      {/* Bookings Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#FFB800' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Booking ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Schedule</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBookings.map((booking) => (
              <TableRow key={booking.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {booking.booking_id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>{getServiceIcon(booking.service_type)}</span>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {booking.service_type}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" display="block" color="text.secondary">
                    From: {booking.pickup_location.substring(0, 30)}...
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    To: {booking.dropoff_location.substring(0, 30)}...
                  </Typography>
                </TableCell>
                <TableCell>{booking.phone}</TableCell>
                <TableCell>
                  <Typography variant="body2">{new Date(booking.scheduled_date).toLocaleDateString()}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {booking.scheduled_time}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={booking.status} color={getStatusColor(booking.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Chip label={booking.is_guest ? 'Guest' : 'User'} size="small" variant={booking.is_guest ? 'outlined' : 'filled'} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setDialogOpen(true);
                      }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="success" onClick={() => updateBookingStatus(booking.booking_id, 'confirmed')}>
                      <CheckCircle fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => updateBookingStatus(booking.booking_id, 'cancelled')}>
                      <Cancel fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {filteredBookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No bookings found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Booking Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Booking Details</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Stack spacing={2} sx={{ pt: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Booking ID
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                  {selectedBooking.booking_id}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Service Type
                </Typography>
                <Typography>{getServiceIcon(selectedBooking.service_type)} {selectedBooking.service_type}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Pickup Location
                </Typography>
                <Typography>{selectedBooking.pickup_location}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Drop-off Location
                </Typography>
                <Typography>{selectedBooking.dropoff_location}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Contact Phone
                </Typography>
                <Typography>{selectedBooking.phone}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Schedule
                </Typography>
                <Typography>
                  {new Date(selectedBooking.scheduled_date).toLocaleDateString()} at {selectedBooking.scheduled_time}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Status
                </Typography>
                <Chip label={selectedBooking.status} color={getStatusColor(selectedBooking.status)} />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Update Status
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => updateBookingStatus(selectedBooking.booking_id, 'pending')}
                  >
                    Pending
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="info"
                    onClick={() => updateBookingStatus(selectedBooking.booking_id, 'confirmed')}
                  >
                    Confirmed
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => updateBookingStatus(selectedBooking.booking_id, 'in-progress')}
                  >
                    In Progress
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    onClick={() => updateBookingStatus(selectedBooking.booking_id, 'completed')}
                  >
                    Completed
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => updateBookingStatus(selectedBooking.booking_id, 'cancelled')}
                  >
                    Cancelled
                  </Button>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminBookingsManagement;
