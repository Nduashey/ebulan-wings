import { Box, Typography, Paper } from '@mui/material';

export default function UsersPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Users Management
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Users management interface will be implemented here...
        </Typography>
      </Paper>
    </Box>
  );
}
