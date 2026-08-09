import { Box, Typography, Paper } from '@mui/material';

export default function DriversPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Drivers Management
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Drivers management interface will be implemented here...
        </Typography>
      </Paper>
    </Box>
  );
}
