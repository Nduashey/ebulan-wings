import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  DirectionsCar as CarIcon,
  Payment as PaymentIcon,
  Speed as SpeedIcon,
  PersonOutline as GuestIcon,
  Person as MemberIcon,
} from '@mui/icons-material';
import { RootState } from '../store';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const features = [
    {
      icon: <QrCodeIcon sx={{ fontSize: 60 }} />,
      title: 'QR Code Booking',
      description: 'Simply scan the QR code on any tuk-tuk to book your ride instantly.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 60 }} />,
      title: 'Fast & Reliable',
      description: 'Quick pickup times and reliable service to get you to your destination.',
    },
    {
      icon: <PaymentIcon sx={{ fontSize: 60 }} />,
      title: 'Multiple Payment Options',
      description: 'Pay with cash, card, or digital wallet for your convenience.',
    },
    {
      icon: <CarIcon sx={{ fontSize: 60 }} />,
      title: 'Track Your Ride',
      description: 'Real-time tracking of your tuk-tuk driver and estimated arrival time.',
    },
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box
        sx={{
          py: 8,
          textAlign: 'center',
        }}
      >
        <Typography
          component="h1"
          variant="h2"
          gutterBottom
          sx={{ fontWeight: 700, color: 'primary.main' }}
        >
          Welcome to Ebulan Wings
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Taxi & Cargo Services within Wilson Airport and Out of Wilson Airport
        </Typography>

        {/* Three Access Modes */}
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
            Choose Your Access Mode
          </Typography>
          
          <Grid container spacing={3} justifyContent="center">
            {/* Member Mode */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: '100%',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(255, 184, 0, 0.3)',
                  },
                }}
                onClick={() => navigate(isAuthenticated ? '/passenger/scan' : '/login')}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <MemberIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    Member
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Track bookings, view history, and earn rewards
                  </Typography>
                  {isAuthenticated ? (
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        bgcolor: 'primary.main',
                        color: '#000',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                    >
                      Go to Dashboard
                    </Button>
                  ) : (
                    <Stack spacing={1}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/login');
                        }}
                        sx={{
                          bgcolor: 'primary.main',
                          color: '#000',
                          '&:hover': { bgcolor: 'primary.dark' },
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/register');
                        }}
                        sx={{
                          borderColor: 'primary.main',
                          color: 'primary.main',
                        }}
                      >
                        Register
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Guest Mode */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: '100%',
                  border: '2px solid',
                  borderColor: '#66BB6A',
                  borderRadius: 3,
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(102, 187, 106, 0.3)',
                  },
                }}
                onClick={() => navigate('/guest')}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <GuestIcon sx={{ fontSize: 80, color: '#66BB6A', mb: 2 }} />
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    Guest
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Book instantly without registration or history
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: '#66BB6A',
                      color: '#fff',
                      '&:hover': { bgcolor: '#4CAF50' },
                    }}
                  >
                    Continue as Guest
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Divider sx={{ my: 6 }} />

      {/* Features Section */}
      <Box sx={{ py: 6 }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
          Why Choose Us?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                <CardContent>
                  <Typography gutterBottom variant="h6" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA Section */}
      {!isAuthenticated && (
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: 'primary.main',
            borderRadius: 2,
            my: 6,
          }}
        >
          <Typography variant="h4" gutterBottom>
            Ready to get started?
          </Typography>
          <Typography variant="body1" paragraph>
            Create your account today and enjoy hassle-free transportation!
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => navigate('/register')}
            >
              Sign Up Now
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/guest')}
              sx={{
                borderColor: '#000',
                color: '#000',
                '&:hover': {
                  borderColor: '#000',
                  bgcolor: 'rgba(0,0,0,0.1)',
                },
              }}
            >
              Try Guest Mode
            </Button>
          </Stack>
        </Box>
      )}
    </Container>
  );
};

export default HomePage;
