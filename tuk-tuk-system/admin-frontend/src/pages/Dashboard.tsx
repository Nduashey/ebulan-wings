import { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  DirectionsCar,
  People,
  LocalShipping,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Visibility,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  Assessment,
  Settings,
  Security,
  Notifications,
  LocalTaxi,
  DriveEta,
  Receipt,
  VerifiedUser,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats] = useState({
    totalBookings: 1234,
    activeDrivers: 56,
    totalUsers: 890,
    revenue: 45200,
    pendingVerifications: 12,
    activeRides: 23,
    completedToday: 87,
    ssiUsers: 145,
  });

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      color: '#FFA500',
      change: '+12.5%',
      trend: 'up',
    },
    {
      title: 'Active Drivers',
      value: stats.activeDrivers,
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      color: '#4CAF50',
      change: '+8.2%',
      trend: 'up',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#2196F3',
      change: '+15.3%',
      trend: 'up',
    },
    {
      title: 'Revenue',
      value: `$${(stats.revenue / 1000).toFixed(1)}K`,
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: '#FF5722',
      change: '+23.1%',
      trend: 'up',
    },
    {
      title: 'Active Rides',
      value: stats.activeRides,
      icon: <DriveEta sx={{ fontSize: 40 }} />,
      color: '#9C27B0',
      change: 'Real-time',
      trend: 'neutral',
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#00BCD4',
      change: '+5.7%',
      trend: 'up',
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications,
      icon: <Schedule sx={{ fontSize: 40 }} />,
      color: '#FF9800',
      change: stats.pendingVerifications > 10 ? 'High' : 'Normal',
      trend: stats.pendingVerifications > 10 ? 'down' : 'neutral',
    },
    {
      title: 'SSI/DID Users',
      value: stats.ssiUsers,
      icon: <VerifiedUser sx={{ fontSize: 40 }} />,
      color: '#673AB7',
      change: '+18.9%',
      trend: 'up',
    },
  ];

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage passengers, drivers, and admin accounts',
      icon: <People sx={{ fontSize: 40, color: '#2196F3' }} />,
      actions: [
        { label: 'View All Users', path: '/users' },
        { label: 'Pending Drivers', path: '/drivers?status=pending', badge: stats.pendingVerifications },
        { label: 'Create Admin', path: '/users/create-admin' },
      ],
    },
    {
      title: 'Driver Management',
      description: 'Approve, verify, and manage driver accounts',
      icon: <LocalTaxi sx={{ fontSize: 40, color: '#4CAF50' }} />,
      actions: [
        { label: 'All Drivers', path: '/drivers' },
        { label: 'Verify Documents', path: '/drivers/verify', badge: 8 },
        { label: 'Driver Earnings', path: '/drivers/earnings' },
      ],
    },
    {
      title: 'Booking Management',
      description: 'Monitor and manage all ride bookings',
      icon: <DirectionsCar sx={{ fontSize: 40, color: '#FFA500' }} />,
      actions: [
        { label: 'All Bookings', path: '/bookings' },
        { label: 'Active Rides', path: '/bookings?status=active', badge: stats.activeRides },
        { label: 'Disputes', path: '/bookings/disputes', badge: 3 },
      ],
    },
    {
      title: 'Analytics & Reports',
      description: 'View platform analytics and generate reports',
      icon: <Assessment sx={{ fontSize: 40, color: '#FF5722' }} />,
      actions: [
        { label: 'Revenue Reports', path: '/reports/revenue' },
        { label: 'Driver Performance', path: '/reports/drivers' },
        { label: 'User Analytics', path: '/reports/users' },
      ],
    },
    {
      title: 'Payment Management',
      description: 'Handle transactions, payouts, and refunds',
      icon: <Receipt sx={{ fontSize: 40, color: '#00BCD4' }} />,
      actions: [
        { label: 'Transactions', path: '/payments/transactions' },
        { label: 'Driver Payouts', path: '/payments/payouts' },
        { label: 'Refunds', path: '/payments/refunds', badge: 5 },
      ],
    },
    {
      title: 'SSI/DID Management',
      description: 'Manage decentralized identities and credentials',
      icon: <Security sx={{ fontSize: 40, color: '#673AB7' }} />,
      actions: [
        { label: 'DID Registry', path: '/ssi/dids' },
        { label: 'Credentials', path: '/ssi/credentials' },
        { label: 'Verification Logs', path: '/ssi/logs' },
      ],
    },
    {
      title: 'Platform Settings',
      description: 'Configure platform settings and preferences',
      icon: <Settings sx={{ fontSize: 40, color: '#607D8B' }} />,
      actions: [
        { label: 'General Settings', path: '/settings/general' },
        { label: 'Pricing', path: '/settings/pricing' },
        { label: 'Service Areas', path: '/settings/areas' },
      ],
    },
    {
      title: 'Notifications',
      description: 'Send and manage platform notifications',
      icon: <Notifications sx={{ fontSize: 40, color: '#FF9800' }} />,
      actions: [
        { label: 'Send Notification', path: '/notifications/send' },
        { label: 'Notification History', path: '/notifications/history' },
        { label: 'Templates', path: '/notifications/templates' },
      ],
    },
  ];

  const systemAlerts = [
    { type: 'warning', message: '12 drivers pending verification', action: 'Review Now', path: '/drivers/verify' },
    { type: 'error', message: '3 payment disputes require attention', action: 'View', path: '/bookings/disputes' },
    { type: 'info', message: '5 new SSI registrations today', action: 'Check', path: '/ssi/dids' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#333' }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ebulan Wings Platform Management - Welcome back!
        </Typography>
      </Box>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {systemAlerts.map((alert, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor:
                  alert.type === 'error'
                    ? '#ffebee'
                    : alert.type === 'warning'
                    ? '#fff3e0'
                    : '#e3f2fd',
                border: '1px solid',
                borderColor:
                  alert.type === 'error'
                    ? '#f44336'
                    : alert.type === 'warning'
                    ? '#ff9800'
                    : '#2196f3',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {alert.type === 'error' ? (
                  <Error sx={{ color: '#f44336' }} />
                ) : alert.type === 'warning' ? (
                  <Warning sx={{ color: '#ff9800' }} />
                ) : (
                  <CheckCircle sx={{ color: '#2196f3' }} />
                )}
                <Typography>{alert.message}</Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(alert.path)}
                sx={{ borderColor: 'inherit' }}
              >
                {alert.action}
              </Button>
            </Paper>
          ))}
        </Box>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card
              sx={{
                height: '100%',
                bgcolor: stat.color,
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  {stat.icon}
                  {stat.trend === 'up' ? (
                    <TrendingUp />
                  ) : stat.trend === 'down' ? (
                    <TrendingDown />
                  ) : null}
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                  {stat.title}
                </Typography>
                <Chip
                  label={stat.change}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {quickActions.map((action) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={action.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 2 }}>{action.icon}</Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {action.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ flexDirection: 'column', alignItems: 'stretch', p: 2, pt: 0 }}>
                  {action.actions.map((btn) => (
                    <Button
                      key={btn.label}
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(btn.path)}
                      sx={{ mb: 1, justifyContent: 'space-between' }}
                      endIcon={
                        btn.badge ? (
                          <Chip
                            label={btn.badge}
                            size="small"
                            color="error"
                            sx={{ height: 20, minWidth: 20 }}
                          />
                        ) : null
                      }
                    >
                      {btn.label}
                    </Button>
                  ))}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Recent Activity */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Recent Activity
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { time: '2 min ago', activity: 'New booking created', user: 'John Doe', status: 'active' },
                { time: '5 min ago', activity: 'Driver verified', user: 'Jane Smith', status: 'completed' },
                { time: '12 min ago', activity: 'Payment processed', user: 'Mike Johnson', status: 'completed' },
                { time: '23 min ago', activity: 'New DID registered', user: 'Sarah Williams', status: 'pending' },
                { time: '45 min ago', activity: 'Booking completed', user: 'Tom Brown', status: 'completed' },
              ].map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>{row.time}</TableCell>
                  <TableCell>{row.activity}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>{row.user[0]}</Avatar>
                      {row.user}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      color={
                        row.status === 'completed'
                          ? 'success'
                          : row.status === 'active'
                          ? 'primary'
                          : 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
