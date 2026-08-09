import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

const AdminLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Outlet />
    </Box>
  );
};

export default AdminLayout;
