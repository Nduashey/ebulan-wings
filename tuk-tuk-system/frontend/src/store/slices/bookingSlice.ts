import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BookingState } from '../../types';
import * as bookingService from '../../services/bookingService';

const initialState: BookingState = {
  currentRide: null,
  rides: [],
  isLoading: false,
  error: null,
};

export const createBooking = createAsyncThunk(
  'booking/create',
  async (bookingData: any, { rejectWithValue }) => {
    try {
      const response = await bookingService.createBooking(bookingData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

export const getRideById = createAsyncThunk(
  'booking/getRide',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const response = await bookingService.getRideById(rideId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get ride');
    }
  }
);

export const getRideHistory = createAsyncThunk(
  'booking/getHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingService.getRideHistory();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get ride history');
    }
  }
);

export const cancelRide = createAsyncThunk(
  'booking/cancel',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const response = await bookingService.cancelRide(rideId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel ride');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRide: (state, action) => {
      state.currentRide = action.payload;
    },
    updateRideStatus: (state, action) => {
      if (state.currentRide?.id === action.payload.id) {
        state.currentRide = { ...state.currentRide, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createBooking.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createBooking.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentRide = action.payload;
    });
    builder.addCase(createBooking.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(getRideById.fulfilled, (state, action) => {
      state.currentRide = action.payload;
    });

    builder.addCase(getRideHistory.fulfilled, (state, action) => {
      state.rides = action.payload;
    });

    builder.addCase(cancelRide.fulfilled, (state, action) => {
      if (state.currentRide?.id === action.payload.id) {
        state.currentRide = action.payload;
      }
    });
  },
});

export const { clearError, setCurrentRide, updateRideStatus } = bookingSlice.actions;
export default bookingSlice.reducer;
