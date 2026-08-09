import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';
import {
  DirectionsCar as TaxiIcon,
  LocalShipping as CargoIcon,
  DeliveryDining as DeliveryIcon,
  FlightTakeoff as AirportIcon,
  PersonOutline as GuestIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

const GuestLandingPage: React.FC = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: <TaxiIcon sx={{ fontSize: 50 }} />,
      title: 'Taxi Services',
      description: 'Quick rides with tuk-tuks and cars for city travel',
      color: '#FFB800',
    },
    {
      icon: <CargoIcon sx={{ fontSize: 50 }} />,
      title: 'Cargo Transport',
      description: 'Move goods and packages with our cargo services',
      color: '#FF9800',
    },
    {
      icon: <DeliveryIcon sx={{ fontSize: 50 }} />,
      title: 'Delivery Services',
      description: 'Fast and reliable delivery for all your needs',
      color: '#FF5722',
    },
    {
      icon: <AirportIcon sx={{ fontSize: 50 }} />,
      title: 'Airport Transfers',
      description: 'Comfortable airport pickup and drop-off services',
      color: '#FFC107',
    },
  ];

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
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
          Ebulan Wings
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<LoginIcon />}
            onClick={() => navigate('/login')}
            sx={{
              color: '#000',
              borderColor: '#000',
              '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.1)' },
            }}
          >
            Login
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/register')}
            sx={{ bgcolor: '#000', color: '#FFB800', '&:hover': { bgcolor: '#333' } }}
          >
            Register
          </Button>
        </Stack>
      </Box>

      <Container maxWidth="lg">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Chip
            icon={<GuestIcon />}
            label="Guest Mode - Book Without Registration"
            sx={{ bgcolor: '#FFB800', color: '#000', fontWeight: 600, mb: 3, px: 2, py: 3, fontSize: '1rem' }}
          />
          <Typography
            variant="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #FFB800 30%, #FFC933 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Welcome to Ebulan Wings
          </Typography>
          <Typography variant="h5" sx={{ color: '#ccc', mb: 4 }}>
            Taxi & Cargo Services - Your Reliable Transport Partner
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<GuestIcon />}
              onClick={() => navigate('/guest/booking')}
              sx={{ bgcolor: '#FFB800', color: '#000', px: 6, py: 2, fontSize: '1.1rem', fontWeight: 600, '&:hover': { bgcolor: '#FFC933' } }}
            >
              Continue as Guest
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ borderColor: '#FFB800', color: '#FFB800', px: 6, py: 2, fontSize: '1.1rem', '&:hover': { borderColor: '#FFC933', bgcolor: 'rgba(255, 184, 0, 0.1)' } }}
            >
              Create Account
            </Button>
          </Stack>

          <Typography variant="body2" sx={{ color: '#999', mt: 3, fontStyle: 'italic' }}>
            Guest mode: Book services instantly without registration. No history tracking - perfect for quick bookings!
          </Typography>
        </Box>

        <Box sx={{ py: 6 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 6, color: '#FFB800', fontWeight: 600 }}>
            Our Services
          </Typography>
          <Grid container spacing={3}>
            {services.map((service, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    bgcolor: '#1a1a1a',
                    border: '2px solid #333',
                    borderRadius: 3,
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: service.color,
                      transform: 'translateY(-8px)',
                      boxShadow: `0 8px 24px ${service.color}40`,
                    },
                  }}
                  onClick={() => navigate('/guest/booking', { state: { service: service.title } })}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3 }}>
                    <Box sx={{ color: service.color, mb: 2 }}>{service.icon}</Box>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                      {service.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      {service.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ py: 6, my: 6, bgcolor: '#1a1a1a', borderRadius: 3, border: '2px solid #FFB800', px: 4 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ color: '#FFB800', fontWeight: 600 }}>
            Why Use Guest Mode?
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#FFB800', mb: 1 }}>⚡ Instant Booking</Typography>
                <Typography sx={{ color: '#ccc' }}>No registration required. Book services in seconds.</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#FFB800', mb: 1 }}>🔒 Privacy First</Typography>
                <Typography sx={{ color: '#ccc' }}>No history tracking. Your bookings stay private.</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#FFB800', mb: 1 }}>🎯 Simple & Fast</Typography>
                <Typography sx={{ color: '#ccc' }}>Minimalistic interface for quick bookings.</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
            Want to track your bookings and earn rewards?
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ bgcolor: '#FFB800', color: '#000', px: 6, py: 2, fontWeight: 600, '&:hover': { bgcolor: '#FFC933' } }}
          >
            Create Free Account
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default GuestLandingPage;
