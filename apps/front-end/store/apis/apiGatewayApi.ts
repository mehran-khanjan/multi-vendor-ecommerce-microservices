// store/apis/apiGatewayApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../configureStore';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000/graphql';

export const apiGatewayApi = createApi({
    reducerPath: 'apiGatewayApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_GATEWAY_URL,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.tokens?.accessToken;

            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }

            headers.set('Content-Type', 'application/json');
            headers.set('x-request-id', crypto.randomUUID());

            return headers;
        },
    }),
    endpoints: (builder) => ({
        // Products
        getProducts: builder.query<any, { filter?: any; pagination?: any }>({
            query: ({ filter, pagination }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            query GetProducts($filter: ProductFilterInput, $pagination: PaginationInput) {
              products(filter: $filter, pagination: $pagination) {
                items {
                  id
                  name
                  description
                  price
                  vendor {
                    id
                    name
                  }
                }
                meta {
                  totalItems
                  currentPage
                  totalPages
                }
              }
            }
          `,
                    variables: { filter, pagination },
                },
            }),
            transformResponse: (response: any) => response.data?.products || { items: [], meta: null },
        }),

        getProduct: builder.query<any, string>({
            query: (id) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            query GetProduct($id: ID!) {
              product(id: $id) {
                id
                name
                description
                price
                images
                vendor {
                  id
                  name
                }
                categories {
                  id
                  name
                }
              }
            }
          `,
                    variables: { id },
                },
            }),
            transformResponse: (response: any) => response.data?.product || null,
        }),

        // Orders
        createOrder: builder.mutation<any, { input: any }>({
            query: ({ input }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation CreateOrder($input: CreateOrderInput!) {
              createOrder(input: $input) {
                id
                status
                totalAmount
                items {
                  productId
                  quantity
                  price
                }
              }
            }
          `,
                    variables: { input },
                },
            }),
            transformResponse: (response: any) => response.data?.createOrder || null,
        }),

        getMyOrders: builder.query<any, { filter?: any; pagination?: any }>({
            query: ({ filter, pagination }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            query GetMyOrders($filter: OrderFilterInput, $pagination: PaginationInput) {
              myOrders(filter: $filter, pagination: $pagination) {
                items {
                  id
                  status
                  totalAmount
                  createdAt
                  items {
                    product {
                      id
                      name
                    }
                    quantity
                    price
                  }
                }
                meta {
                  totalItems
                  currentPage
                  totalPages
                }
              }
            }
          `,
                    variables: { filter, pagination },
                },
            }),
            transformResponse: (response: any) => response.data?.myOrders || { items: [], meta: null },
        }),

        // Vendors
        getVendorDashboard: builder.query<any, void>({
            query: () => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            query GetVendorDashboard {
              vendorDashboard {
                stats {
                  totalProducts
                  totalOrders
                  revenue
                }
                recentOrders {
                  id
                  customerName
                  totalAmount
                  status
                  createdAt
                }
              }
            }
          `,
                },
            }),
            transformResponse: (response: any) => response.data?.vendorDashboard || null,
        }),

        // Health check
        checkGatewayHealth: builder.query<any, void>({
            query: () => ({
                url: '/health',
                method: 'GET',
            }),
        }),
    }),
});

export const {
    useGetProductsQuery,
    useGetProductQuery,
    useCreateOrderMutation,
    useGetMyOrdersQuery,
    useGetVendorDashboardQuery,
    useCheckGatewayHealthQuery,
} = apiGatewayApi;