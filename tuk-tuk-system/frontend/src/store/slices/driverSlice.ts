import { createSlice } from '@reduxjs/toolkit';
import { DriverState } from '../../types';

const initialState: DriverState = {
  driver: null,
  availableRides: [],
  currentRide: null,
  earnings: {
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  },
  isLoading: false,
  error: null,
};

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    setDriverStatus: (state, action) => {
      if (state.driver) {
        state.driver.status = action.payload;
      }
    },
    setAvailableRides: (state, action) => {
      state.availableRides = action.payload;
    },
    acceptRide: (state, action) => {
      state.currentRide = action.payload;
      state.availableRides = state.availableRides.filter(r => r.id !== action.payload.id);
    },
    completeRide: (state) => {
      state.currentRide = null;
    },
    updateEarnings: (state, action) => {
      state.earnings = action.payload;
    },
  },
});

export const { setDriverStatus, setAvailableRides, acceptRide, completeRide, updateEarnings } = driverSlice.actions;
export default driverSlice.reducer;
