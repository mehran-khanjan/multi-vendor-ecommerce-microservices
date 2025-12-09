// store/apis/__tests__/apiGatewayApi.test.ts
import { setupApiStore } from '../../__tests__/testUtils';
import { apiGatewayApi } from '../apiGatewayApi';

const mockResponse = {
    data: {
        products: {
            items: [{ id: '1', name: 'Test Product', price: 100 }],
            meta: { totalItems: 1, currentPage: 1, totalPages: 1 }
        }
    }
};

describe('apiGatewayApi', () => {
    let store: any;

    beforeEach(() => {
        store = setupApiStore(apiGatewayApi);
        fetchMock.resetMocks();
    });

    describe('getProducts', () => {
        test('should fetch products successfully', async () => {
            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await store.dispatch(
                apiGatewayApi.endpoints.getProducts.initiate({})
            );

            expect(result.data).toEqual(mockResponse.data.products);
            expect(result.error).toBeUndefined();
        });

        test('should handle network error', async () => {
            fetchMock.mockRejectOnce(new Error('Network error'));

            const result = await store.dispatch(
                apiGatewayApi.endpoints.getProducts.initiate({})
            );

            expect(result.error).toBeDefined();
            expect(result.data).toBeUndefined();
        });

        test('should include authorization header when authenticated', async () => {
            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const customStore = setupApiStore(apiGatewayApi, {
                auth: {
                    tokens: { accessToken: 'test-token' },
                    isAuthenticated: true,
                    user: null,
                    isLoading: false,
                    error: null,
                    requiresTwoFactor: false,
                    tempToken: null
                }
            });

            await customStore.dispatch(
                apiGatewayApi.endpoints.getProducts.initiate({})
            );

            const call = fetchMock.mock.calls[0];
            const headers = call[1]?.headers as Record<string, string>;

            expect(headers.authorization).toBe('Bearer test-token');
            expect(headers['x-request-id']).toBeDefined();
        });
    });

    describe('getProduct', () => {
        test('should fetch single product', async () => {
            const mockProduct = {
                data: {
                    product: { id: '1', name: 'Test Product', price: 100 }
                }
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockProduct));

            const result = await store.dispatch(
                apiGatewayApi.endpoints.getProduct.initiate('1')
            );

            expect(result.data).toEqual(mockProduct.data.product);
        });
    });

    describe('createOrder', () => {
        test('should create order successfully', async () => {
            const mockOrder = {
                data: {
                    createOrder: { id: 'order-1', status: 'PENDING', totalAmount: 100 }
                }
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockOrder));

            const result = await store.dispatch(
                apiGatewayApi.endpoints.createOrder.initiate({
                    input: { items: [{ productId: '1', quantity: 1 }] }
                })
            );

            expect(result.data).toEqual(mockOrder.data.createOrder);
        });
    });
});