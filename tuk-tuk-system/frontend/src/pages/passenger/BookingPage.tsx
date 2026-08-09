import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import {
  DirectionsCar,
  LocalShipping,
  DeliveryDining,
  FlightTakeoff,
  LocationOn,
  Phone,
  CalendarToday,
  AccessTime,
  ArrowBack,
  CheckCircle,
  History,
  Settings,
  Logout,
  Download,
} from '@mui/icons-material';
import axios from 'axios';

interface ServiceType {
  id: string;
  name: string;
  icon: JSX.Element;
  color: string;
  description: string;
}

interface BookingResponse {
  success: boolean;
  bookingId: string;
  booking: any;
}

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedService = location.state?.service;
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [selectedService, setSelectedService] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const services: ServiceType[] = [
    {
      id: 'taxi',
      name: 'Taxi Services',
      icon: <DirectionsCar />,
      color: '#FFB800',
      description: 'Quick rides with tuk-tuks',
    },
    {
      id: 'cargo',
      name: 'Cargo Transport',
      icon: <LocalShipping />,
      color: '#FF9800',
      description: 'Move goods and packages',
    },
    {
      id: 'delivery',
      name: 'Delivery Services',
      icon: <DeliveryDining />,
      color: '#FF5722',
      description: 'Fast delivery',
    },
    {
      id: 'airport',
      name: 'Airport Transfers',
      icon: <FlightTakeoff />,
      color: '#FFC107',
      description: 'Airport pickup/drop-off',
    },
  ];

  useEffect(() => {
    if (preselectedService) {
      const service = services.find(s => s.name === preselectedService);
      if (service) setSelectedService(service.id);
    }
  }, [preselectedService]);

  useEffect(() => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    setDate(dateStr);
    setTime(timeStr);

    // Pre-fill phone for authenticated users
    if (isAuthenticated && user?.phone) {
      setPhone(user.phone);
    }
  }, [isAuthenticated, user]);

  const handleAccountMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewHistory = () => {
    handleAccountMenuClose();
    navigate('/passenger/history');
  };

  const handleAccountSettings = () => {
    handleAccountMenuClose();
    navigate('/passenger/profile');
  };

  const handleLogout = () => {
    handleAccountMenuClose();
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isAuthenticated ? '/api/bookings' : '/api/bookings/guest';
      const response = await axios.post<BookingResponse>(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${endpoint}`,
        {
          serviceType: selectedService,
          pickupLocation,
          dropoffLocation,
          phone,
          scheduledDate: date,
          scheduledTime: time,
          notes,
          isGuest: !isAuthenticated,
          userId: user?.id,
        },
        isAuthenticated ? {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        } : {}
      );

      setBookingId(response.data.bookingId);
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (format: 'pdf' | 'txt') => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/bookings/${bookingId}/receipt`,
        {
          params: { format },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `booking-${bookingId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download receipt:', err);
    }
  };

  const isFormValid = () => {
    return selectedService && pickupLocation && dropoffLocation && phone && date && time;
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#fff' }}>
        <Box sx={{ bgcolor: '#FFB800', py: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
            Ebulan Wings
          </Typography>
          {isAuthenticated && user && (
            <>
              <IconButton onClick={handleAccountMenuOpen} sx={{ color: '#000' }}>
                <Avatar sx={{ bgcolor: '#000', color: '#FFB800' }}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleAccountMenuClose}
                PaperProps={{
                  sx: { bgcolor: '#1a1a1a', color: '#fff', mt: 1 },
                }}
              >
                <MenuItem onClick={handleViewHistory}>
                  <History sx={{ mr: 2 }} /> Booking History
                </MenuItem>
                <MenuItem onClick={handleAccountSettings}>
                  <Settings sx={{ mr: 2 }} /> Account Settings
                </MenuItem>
                <Divider sx={{ bgcolor: '#444' }} />
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 2 }} /> Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
        <Container maxWidth="sm">
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: '#4CAF50', mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ color: '#FFB800', fontWeight: 600 }}>
              Booking Confirmed!
            </Typography>
            <Card sx={{ bgcolor: '#1a1a1a', border: '2px solid #FFB800', borderRadius: 3, p: 3, mt: 4 }}>
              <Typography variant="h6" sx={{ color: '#FFB800', mb: 2 }}>
                Booking ID
              </Typography>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>
                {bookingId}
              </Typography>
              <Typography sx={{ color: '#ccc', mb: 3 }}>
                {isAuthenticated 
                  ? 'Your booking has been saved to your account. You can view it in your booking history.'
                  : 'Please save this booking ID. You\'ll need it to track your service.'}
              </Typography>

              {/* Receipt Download Buttons */}
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleDownloadReceipt('pdf')}
                  sx={{
                    borderColor: '#FFB800',
                    color: '#FFB800',
                    '&:hover': { borderColor: '#FFC933', bgcolor: 'rgba(255, 184, 0, 0.1)' },
                  }}
                >
                  Download Receipt (PDF)
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleDownloadReceipt('txt')}
                  sx={{
                    borderColor: '#FFB800',
                    color: '#FFB800',
                    '&:hover': { borderColor: '#FFC933', bgcolor: 'rgba(255, 184, 0, 0.1)' },
                  }}
                >
                  Download Receipt (TXT)
                </Button>
              </Stack>
            </Card>
            <Stack spacing={2} sx={{ mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => window.location.reload()}
                sx={{ bgcolor: '#FFB800', color: '#000', '&:hover': { bgcolor: '#FFC933' } }}
              >
                Make Another Booking
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate(isAuthenticated ? '/passenger' : '/')}
                sx={{ borderColor: '#FFB800', color: '#FFB800' }}
              >
                Back to Home
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#fff' }}>
      <Box
        sx={{
          bgcolor: '#FFB800',
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(isAuthenticated ? '/passenger' : '/')} sx={{ color: '#000' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
            Ebulan Wings - {isAuthenticated ? 'Book Service' : 'Guest Booking'}
          </Typography>
        </Box>
        {isAuthenticated && user && (
          <>
            <IconButton onClick={handleAccountMenuOpen} sx={{ color: '#000' }}>
              <Avatar sx={{ bgcolor: '#000', color: '#FFB800' }}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleAccountMenuClose}
              PaperProps={{
                sx: { bgcolor: '#1a1a1a', color: '#fff', mt: 1 },
              }}
            >
              <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #444' }}>
                <Typography variant="subtitle2" sx={{ color: '#FFB800' }}>
                  {user.name || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  {user.email}
                </Typography>
              </Box>
              <MenuItem onClick={handleViewHistory}>
                <History sx={{ mr: 2 }} /> Booking History
              </MenuItem>
              <MenuItem onClick={handleAccountSettings}>
                <Settings sx={{ mr: 2 }} /> Account Settings
              </MenuItem>
              <Divider sx={{ bgcolor: '#444' }} />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 2 }} /> Logout
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ bgcolor: '#1a1a1a', border: '2px solid #333', borderRadius: 3, p: 3 }}>
          <Typography variant="h5" sx={{ color: '#FFB800', fontWeight: 600, mb: 3 }}>
            Book Your Service
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Service Type Selection */}
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#FFB800', mb: 2, fontWeight: 600 }}>
                  Select Service Type
                </Typography>
                <Grid container spacing={2}>
                  {services.map((service) => (
                    <Grid item xs={12} sm={6} key={service.id}>
                      <Card
                        onClick={() => setSelectedService(service.id)}
                        sx={{
                          bgcolor: selectedService === service.id ? service.color : '#252525',
                          border: selectedService === service.id ? `2px solid ${service.color}` : '2px solid #444',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          '&:hover': {
                            borderColor: service.color,
                            transform: 'scale(1.02)',
                          },
                        }}
                      >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                          <Box sx={{ color: selectedService === service.id ? '#000' : service.color, fontSize: 40 }}>
                            {service.icon}
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ color: selectedService === service.id ? '#000' : '#fff', fontWeight: 600 }}>
                              {service.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: selectedService === service.id ? '#000' : '#aaa' }}>
                              {service.description}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Location Details */}
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#FFB800', mb: 2, fontWeight: 600 }}>
                  Location Details
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Pickup Location"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn sx={{ color: '#FFB800' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#252525',
                        color: '#fff',
                        '& fieldset': { borderColor: '#444' },
                        '&:hover fieldset': { borderColor: '#FFB800' },
                        '&.Mui-focused fieldset': { borderColor: '#FFB800' },
                      },
                      '& .MuiInputLabel-root': { color: '#aaa' },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#FFB800' },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Drop-off Location"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn sx={{ color: '#FF5722' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#252525',
                        color: '#fff',
                        '& fieldset': { borderColor: '#444' },
                        '&:hover fieldset': { borderColor: '#FFB800' },
                        '&.Mui-focused fieldset': { borderColor: '#FFB800' },
                      },
                      '& .MuiInputLabel-root': { color: '#aaa' },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#FFB800' },
                    }}
                  />
                </Stack>
              </Box>

              {/* Contact Information */}
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#FFB800', mb: 2, fontWeight: 600 }}>
                  Contact Information
                </Typography>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+254700123456"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: '#FFB800' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#252525',
                      color: '#fff',
                      '& fieldset': { borderColor: '#444' },
                      '&:hover fieldset': { borderColor: '#FFB800' },
                      '&.Mui-focused fieldset': { borderColor: '#FFB800' },
                    },
                    '& .MuiInputLabel-root': { color: '#aaa' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#FFB800' },
                  }}
                />
              </Box>

              {/* Schedule */}
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#FFB800', mb: 2, fontWeight: 600 }}>
                  Schedule
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday sx={{ color: '#FFB800' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#252525',
                          color: '#fff',
                          '& fieldset': { borderColor: '#444' },
                          '&:hover fieldset': { borderColor: '#FFB800' },
                          '&.Mui-focused fieldset': { borderColor: '#FFB800' },
                        },
                        '& .MuiInputLabel-root': { color: '#aaa' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#FFB800' },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTime sx={{ color: '#FFB800' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#252525',
                          color: '#fff',
                          '& fieldset': { borderColor: '#444' },
                          '&:hover fieldset': { borderColor: '#FFB800' },
                          '&.Mui-focused fieldset': { borderColor: '#FFB800' },
                        },
                        '& .MuiInputLabel-root': { color: '#aaa' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#FFB800' },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Additional Notes */}
              <TextField
                fullWidth
                label="Additional Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="Any special requirements or instructions..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#252525',
                    color: '#fff',
                    '& fieldset': { borderColor: '#444' },
                    '&:hover fieldset': { borderColor: '#FFB800' },
                    '&.Mui-focused fieldset': { borderColor: '#FFB800' },
                  },
                  '& .MuiInputLabel-root': { color: '#aaa' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#FFB800' },
                }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={!isFormValid() || loading}
                sx={{
                  bgcolor: '#FFB800',
                  color: '#000',
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#FFC933' },
                  '&:disabled': { bgcolor: '#555', color: '#888' },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#000' }} /> : 'Confirm Booking'}
              </Button>
            </Stack>
          </form>
        </Card>

        {/* Info Alert */}
        {!isAuthenticated && (
          <Alert severity="info" sx={{ mt: 3, bgcolor: '#1a1a1a', border: '1px solid #FFB800' }}>
            <Typography variant="body2">
              <strong>Guest Mode:</strong> Your booking will not be saved to any account history. 
              Please save your Booking ID to track your service. 
              <Button 
                size="small" 
                onClick={() => navigate('/login')}
                sx={{ ml: 1, color: '#FFB800', textTransform: 'none' }}
              >
                Login to save bookings
              </Button>
            </Typography>
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default BookingPage;
