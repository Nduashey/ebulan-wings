import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
} from '@mui/material';
import {
  LocalTaxi as TaxiIcon,
} from '@mui/icons-material';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static" color="primary">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'center' }}>
          <TaxiIcon sx={{ display: 'flex', mr: 1, fontSize: 40 }} />
          <Typography
            variant="h4"
            noWrap
            component="div"
            sx={{
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: { xs: '1.5rem', md: '2.125rem' },
            }}
            onClick={() => navigate('/')}
          >
            Ebulan Wings
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
