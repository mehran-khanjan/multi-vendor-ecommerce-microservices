// src/config/services.config.ts
import { ServiceType } from '@common/enums';

export interface SubgraphConfig {
  name: string;
  url: string;
  timeout: number;
  healthPath: string;
}

export default () => ({
  subgraphs: [
    {
      name: process.env.AUTH_SERVICE_NAME || 'auth',
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:4001/graphql',
      timeout: parseInt(process.env.AUTH_SERVICE_TIMEOUT, 10) || 10000,
      healthPath: '/health',
    },
    {
      name: process.env.USERS_SERVICE_NAME || 'users',
      url: process.env.USERS_SERVICE_URL || 'http://localhost:4002/graphql',
      timeout: parseInt(process.env.USERS_SERVICE_TIMEOUT, 10) || 10000,
      healthPath: '/health',
    },
    {
      name: process.env.PRODUCTS_SERVICE_NAME || 'products',
      url: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:4003/graphql',
      timeout: parseInt(process.env.PRODUCTS_SERVICE_TIMEOUT, 10) || 15000,
      healthPath: '/health',
    },
    {
      name: process.env.ORDERS_SERVICE_NAME || 'orders',
      url: process.env.ORDERS_SERVICE_URL || 'http://localhost:4004/graphql',
      timeout: parseInt(process.env.ORDERS_SERVICE_TIMEOUT, 10) || 15000,
      healthPath: '/health',
    },
    {
      name: process.env.VENDORS_SERVICE_NAME || 'vendors',
      url: process.env.VENDORS_SERVICE_URL || 'http://localhost:4005/graphql',
      timeout: parseInt(process.env.VENDORS_SERVICE_TIMEOUT, 10) || 15000,
      healthPath: '/health',
    },
    {
      name: process.env.ADMIN_SERVICE_NAME || 'admin',
      url: process.env.ADMIN_SERVICE_URL || 'http://localhost:4006/graphql',
      timeout: parseInt(process.env.ADMIN_SERVICE_TIMEOUT, 10) || 15000,
      healthPath: '/health',
    },
  ] as SubgraphConfig[],

  // Map subgraph names to service types
  serviceTypeMap: {
    auth: ServiceType.AUTH,
    users: ServiceType.USERS,
    products: ServiceType.PRODUCTS,
    orders: ServiceType.ORDERS,
    vendors: ServiceType.VENDORS,
    admin: ServiceType.ADMIN,
  } as Record<string, ServiceType>,
});
