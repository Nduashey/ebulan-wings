import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Layout components
import MainLayout from './components/layout/MainLayout';
import DriverLayout from './components/layout/DriverLayout';

// Pages
import HomePage from './pages/HomePage';
import UnifiedAuthPage from './pages/auth/UnifiedAuthPage';
import QRScanPage from './pages/passenger/QRScanPage';
import BookingPage from './pages/passenger/BookingPage';
import RideTrackingPage from './pages/passenger/RideTrackingPage';
import PaymentPage from './pages/passenger/PaymentPage';
import ProfilePage from './pages/passenger/ProfilePage';
import RideHistoryPage from './pages/passenger/RideHistoryPage';

// Guest Pages
import GuestLandingPage from './pages/guest/GuestLandingPage';
// import GuestBookingPage from './pages/guest/GuestBookingPage'; // Unified with BookingPage

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverRidesPage from './pages/driver/DriverRidesPage';
import DriverEarningsPage from './pages/driver/DriverEarningsPage';



// Utils
import PrivateRoute from './components/auth/PrivateRoute';

const App: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<UnifiedAuthPage />} />
          <Route path="register" element={<UnifiedAuthPage />} />
          <Route path="auth" element={<UnifiedAuthPage />} />
        </Route>

        {/* Guest Routes - No Layout */}
        <Route path="/guest" element={<GuestLandingPage />} />
        <Route path="/guest/booking" element={<BookingPage />} />

        {/* Passenger Routes */}
        <Route path="/passenger" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="scan" element={<QRScanPage />} />
          <Route path="book" element={<BookingPage />} />
          <Route path="track/:rideId" element={<RideTrackingPage />} />
          <Route path="payment/:rideId" element={<PaymentPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="history" element={<RideHistoryPage />} />
        </Route>

        {/* Driver Routes */}
        <Route path="/driver" element={<PrivateRoute role="driver"><DriverLayout /></PrivateRoute>}>
          <Route index element={<DriverDashboard />} />
          <Route path="rides" element={<DriverRidesPage />} />
          <Route path="earnings" element={<DriverEarningsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
};

export default App;
