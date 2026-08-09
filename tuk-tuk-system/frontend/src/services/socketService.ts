import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3005';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): void {
    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Driver specific events
  updateDriverLocation(location: { latitude: number; longitude: number }): void {
    this.emit('driver:location', location);
  }

  acceptRide(rideId: string): void {
    this.emit('driver:accept', { rideId });
  }

  // Passenger specific events
  requestRide(rideData: any): void {
    this.emit('passenger:request', rideData);
  }

  trackRide(rideId: string): void {
    this.emit('passenger:track', { rideId });
  }
}

export default new SocketService();
