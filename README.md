# 🛒 Multi-Vendor E-Commerce Platform - Microservices Architecture

A modern, scalable multi-vendor E-commerce marketplace built with Microservices architecture. This platform enables multiple vendors to sell products through a unified storefront, with comprehensive features for customers, vendors, and administrators.

## 📋 Table of Contents

- [Demo](#demo)
- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## 📱 Demo

A lightweight demo of this project is deployed on Vercel for quick preview and testing. The demo uses a simplified front-end and a minimal back-end (no Microservices) to reduce hosting costs. It's intended for demonstration purposes only and does not include the full production Microservices architecture.

- **Demo URL:** [🌐 Live Demo](https://ecommerce.mehran.codes/)
- **What the demo shows:** Core UI flows and basic functionality without the full-scale Microservices backend.
- **Limitations:** Reduced performance, stubbed or simplified API endpoints, and no production-grade scaling, authentication, or persistence.

If you need the complete, production-ready setup (full Microservices architecture on AWS), clone the repository and follow the instructions in the [Development](#development) / [Deployment](#deployment) sections to run the full version locally or on your cloud of choice.

## 🎯 Overview

This is a full-stack multi-vendor E-commerce platform that supports:

- **Customers**: Browse products, manage cart, checkout, track orders, and manage returns
- **Vendors**: Register, manage storefronts, list products, fulfill orders, and track earnings
- **Admins**: Manage vendors, moderate catalog, handle disputes, and configure platform settings

The platform is built with a Microservices architecture for scalability, maintainability, and independent service deployment.

## 🏗️ Architecture

### Backend Architecture

The backend follows a **Microservices architecture** using NestJS with a **monorepo** structure:

- **API Gateway**: Single entry point for all client requests, handles routing, authentication, rate limiting, and request aggregation (GraphQL Federation)
- **Authentication Service**: User registration, login, JWT token management, password reset, RBAC with CASL
- **Products Service**: Product catalog management, categories, inventory, variants
- **Orders Service**: Order processing, fulfillment tracking, order history
- **Notifications Service**: Real-time notifications via email, in-app, and WebSocket

### Frontend Architecture

The frontend is built with **Next.js 16** using the App Router and implements a **multi-tenant architecture**:

- Server-side rendering (SSR) and static site generation (SSG) for optimal performance
- Multi-tenant support for vendor-specific storefronts and admin pages
- Responsive design with modern UI components (Radix UI and ShadCN)
- Real-time updates via WebSocket connections

### Communication Patterns

- **GraphQL**: Primary API protocol via Apollo Gateway/Federation
- **gRPC**: Inter-service communication for high-performance operations
- **RabbitMQ**: Asynchronous messaging for event-driven workflows
- **WebSocket**: Real-time updating with Socket.io library

## ✨ Features

### Customer Features
- 🔍 Product browsing and search with advanced filters
- 🛒 Multi-vendor shopping cart
- 💳 Secure checkout with payment gateway integration
- 📦 Order tracking and history
- ⭐ Product and vendor reviews
- 🔄 Returns and refunds management
- 📧 Email notifications

### Vendor Features
- 🏪 Storefront management and customization
- 📦 Product catalog management with variants
- 📊 Inventory tracking
- 📈 Sales analytics and earnings dashboard
- 🚚 Order fulfillment and shipping management
- 💰 Payout tracking and financial reports
- 📧 Real-time notifications

### Admin Features
- 👥 Vendor approval and management
- 📋 Catalog moderation and quality control
- 💼 Dispute resolution
- ⚙️ Platform configuration
- 📊 Analytics and reporting
- 🔐 Role-based access control (RBAC)

## 🛠️ Tech Stack

### Backend

- **Framework**: [NestJS](https://nestjs.com/) 
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **API Protocols**:
    - GraphQL (Apollo Gateway/Federation)
    - gRPC
- **Authentication**: JWT with Passport
- **Authorization**: JWT with CASL
- **Service Discovery**: Consul
- **Monitoring**: Prometheus, Grafana
- **Tracing**: OpenTelemetry
- **Real-time**: Socket.io
- **Validation**: class-validator, class-transformer

### Frontend

- **Framework**: [Next.js](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **UI Library**: React 
- **Styling**: Tailwind CSS 
- **Components**: Radix UI and ShadCN
- **Forms**: React Hook Form with Zod validation
- **State Management**: Redux + Redux Toolkit
- **Analytics**: Vercel Analytics

### DevOps & Infrastructure

- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions, Jenkins
- **Infrastructure as Code**: Terraform
- **Configuration Management**: Ansible
- **Code Quality**: SonarQube
- **Package Registry**: Nexus
- **Monitoring**: Prometheus, Grafana

## 📁 Project Structure

```
E-commerce/
├── apps/
│   ├── back-end/                 
│   │   ├── apps/                 
│   │   │   ├── api-gateway/      
│   │   │   ├── authentication-service/
│   │   │   ├── products-service/
│   │   │   ├── orders-service/
│   │   │   ├── notifications-service/
│   │   ├── libs/                 
│   │   │   └── common/           
│   │   ├── config/               
│   │   └── package.json
│   │
│   └── front-end/                
│       ├── app/                   
│       │   ├── admin/            
│       │   ├── vendor/           
│       │   ├── customer/             
│       ├── components/           
│       │   ├── ui/               
│       │   └── layout/           
│       ├── hooks/                
│       ├── lib/                  
│       └── public/              
│
├── dev-ops/                      
│   ├── 01-docker/               
│   ├── 02-kubernetes/           
│   ├── 03-github-actions/       
│   ├── 04-jenkins/              
│   ├── 05-sonar-qube/           
│   ├── 06-nexus/                
│   ├── 07-terrraform/           
│   └── 08-ansible/              
│
├── docs/                      
│   └── RPD (Product Requirements Document)
│
└── README.md                        
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ (recommended: v20+)
- **npm** or **pnpm**: Latest version
- **Docker** & **Docker Compose**: For running services locally
- **PostgreSQL**: v14+ (or use Docker)
- **Redis**: v6+ (or use Docker)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/mehran-khanjan/multi-vendor-ecommerce-microservices.git
cd multi-vendor-ecommerce-microservices
```

2. **Install Backend Dependencies**

```bash
cd apps/back-end
pnpm install
```

3. **Install Frontend Dependencies**

```bash
cd apps/front-end
pnpm install
```

4. **Set Up Environment Variables**

Create `.env` files in both backend and frontend directories. See `.env.example` files for reference.

5. **Start Infrastructure Services (Docker)**

```bash
cd dev-ops/01-docker
docker compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- RabbitMQ message broker
- pgAdmin (optional)

### Running the Application

#### Development Mode

**Backend** (Terminal 1):
```bash
cd apps/back-end

# Run all services
pnpm run start:dev

# Or run specific service
pnpm run start:dev:apig      # API Gateway
pnpm run start:dev:vendors   # Vendors Service
```

**Frontend** (Terminal 2):
```bash
cd apps/front-end
pnpm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **GraphQL Playground**: http://localhost:3001/graphql

#### Production Mode

**Backend**:
```bash
cd apps/back-end
pnpm run build
pnpm run start:prod
```

**Frontend**:
```bash
cd apps/front-end
pnpm run build
pnpm run start
```

## 💻 Development

### Backend Development

#### Running Tests

```bash
cd apps/back-end

# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

#### Code Quality

```bash
# Linting
pnpm run lint

# Formatting
pnpm run format
```

#### Adding a New Service

1. Generate a new NestJS application:
```bash
cd apps/back-end
nest generate app new-service-name
```

2. Update API Gateway routing

### Frontend Development

#### Running Tests

```bash
cd apps/front-end
pnpm run lint
```

#### Building for Production

```bash
pnpm run build
```

## 🐳 Deployment

### Docker Deployment

Build and run with Docker Compose:

```bash
cd dev-ops/01-docker
docker compose -f docker-compose.yml up -d
```

### Kubernetes Deployment

Deploy to Kubernetes:

```bash
kubectl apply -f dev-ops/02-kubernetes/
```

### CI/CD

The project includes:
- **GitHub Actions**: Automated testing and deployment
- **Jenkins**: Pipeline configuration for CI/CD

## 📚 API Documentation

### GraphQL

Access the GraphQL Playground at `http://localhost:3000/graphql` when running in development mode.

### REST API

REST endpoints are available for specific operations. API documentation is available via Swagger at:
- `http://localhost:3001/api/docs` (when configured)

### Service Endpoints

- **API Gateway**: `http://localhost:3001`
- **Authentication Service**: Internal (via Gateway)
- **Products Service**: Internal (via Gateway)
- **Orders Service**: Internal (via Gateway)
- **Vendors Service**: Internal (via Gateway)
- **Notifications Service**: Internal (via Gateway)

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC) with CASL
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (TypeORM parameterized queries)
- XSS protection

## 📊 Monitoring & Observability

- **Metrics**: Prometheus endpoints for each service
- **Tracing**: OpenTelemetry for distributed tracing
- **Logging**: Structured logging with Winston
- **Health Checks**: Built-in health check endpoints
- **Dashboards**: Grafana dashboards for visualization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation as needed
- Follow the existing code style
- Ensure all tests pass before submitting PR

## 🙏 Acknowledgments

- NestJS community
- Next.js team
- All open-source contributors

## 📞 Support

For support, please open an issue in the repository or contact the developer.

---

**Built with ❤️ using NestJS and Next.js**

