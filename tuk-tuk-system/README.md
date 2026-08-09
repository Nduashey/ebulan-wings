# EAA Tuk-Tuk Digital Taxi System

## Overview
The EAA Tuk-Tuk Digital Taxi System is a comprehensive QR code-based ride-hailing platform designed specifically for airport tuk-tuk services. This system provides seamless booking, payment processing, and ride management through a modern microservices architecture.

## System Architecture

### Microservices
This project follows a microservices architecture pattern with the following services:

1. **Frontend Service** - React-based user interface
2. **API Gateway** - Central entry point for all client requests
3. **Auth Service** - Authentication and authorization management
4. **Booking Service** - Ride request and booking management
5. **Driver Service** - Driver management and availability tracking
6. **Payment Service** - Payment processing and transaction management
7. **Notification Service** - Real-time notifications (WebSocket/Push)
8. **Location Service** - GPS tracking and route optimization
9. **Admin Service** - Administrative dashboard and management

### Technology Stack

#### Frontend
- React 18+ with TypeScript
- Redux Toolkit for state management
- Material-UI (MUI) for UI components
- React Router for navigation
- Axios for API calls
- Socket.io-client for real-time updates

#### Backend Services
- Node.js with Express/NestJS
- TypeScript
- PostgreSQL for persistent data
- MongoDB for logging and analytics
- Redis for caching and sessions
- RabbitMQ for message queuing
- Socket.io for real-time communication

#### Infrastructure
- Docker & Docker Compose for containerization
- Kubernetes for orchestration
- Nginx as reverse proxy
- Prometheus & Grafana for monitoring
- ELK Stack for centralized logging

## Features

### For Passengers
- QR code-based booking system
- Real-time driver tracking
- Multiple payment options
- Ride history and receipts
- Rating and review system
- In-app notifications

### For Drivers
- Driver dashboard
- Ride request notifications
- Navigation assistance
- Earnings tracking
- Trip history
- Performance metrics

### For Administrators
- System monitoring dashboard
- User and driver management
- Booking oversight
- Financial reports
- Analytics and insights
- Configuration management

## Project Structure

```
tuk-tuk-system/
├── services/
│   ├── api-gateway/          # API Gateway service
│   ├── auth-service/         # Authentication service
│   ├── booking-service/      # Booking management
│   ├── driver-service/       # Driver management
│   ├── payment-service/      # Payment processing
│   ├── notification-service/ # Notifications
│   ├── location-service/     # GPS and tracking
│   └── admin-service/        # Admin operations
├── frontend/                 # React frontend
├── shared/                   # Shared libraries
│   ├── models/              # Data models
│   ├── utils/               # Utility functions
│   └── config/              # Shared configurations
├── infrastructure/           # Infrastructure configs
│   ├── docker/              # Docker files
│   ├── kubernetes/          # K8s manifests
│   └── monitoring/          # Monitoring configs
└── docs/                    # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Kubernetes (minikube or kind for local)
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd EAA/tuk-tuk-system
```

2. Install dependencies for all services:
```bash
# Install root dependencies
npm install

# Install service dependencies
npm run install:all
```

3. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start services with Docker Compose:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
npm run migrate
```

### Development

Run all services in development mode:
```bash
npm run dev
```

Run specific service:
```bash
npm run dev:frontend
npm run dev:gateway
npm run dev:auth
# etc.
```

### Testing

Run all tests:
```bash
npm test
```

Run service-specific tests:
```bash
npm run test:auth
npm run test:booking
# etc.
```

### Deployment

#### Docker Compose (Development/Staging)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Kubernetes (Production)
```bash
kubectl apply -f infrastructure/kubernetes/
```

## API Documentation

API documentation is available at:
- Development: http://localhost:3000/api-docs
- Swagger UI: http://localhost:3000/swagger

Detailed API docs: [docs/API.md](docs/API.md)

## Environment Variables

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for complete environment variable reference.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please contact:
- Email: support@eaa-tuktuk.com
- Documentation: [docs/](docs/)
- Issues: GitHub Issues

## Roadmap

- [x] Core microservices architecture
- [x] Basic booking functionality
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered route optimization
- [ ] Multi-language support
- [ ] Integration with third-party payment gateways

## Authors

- EAA Development Team

## Acknowledgments

- Airport Tuk-Tuk Digital Taxi System specification
- Open source community
- All contributors
