// store/__tests__/integration/authIntegration.test.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loginUser, clearAuthState } from '../../slices/authSlice';
import { apiGatewayApi } from '../../apis/apiGatewayApi';
import { authServiceApi } from '../../apis/authServiceApi';

describe('Auth Integration', () => {
    let store: any;
    let localStorageMock: any;

    beforeEach(() => {
        localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };

        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });

        store = configureStore({
            reducer: {
                auth: authReducer,
                [apiGatewayApi.reducerPath]: apiGatewayApi.reducer,
                [authServiceApi.reducerPath]: authServiceApi.reducer
            },
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware({
                    serializableCheck: {
                        ignoredActions: ['auth/persistAuthState', 'auth/clearAuthState'],
                        ignoredPaths: ['auth.user', 'auth.tokens']
                    }
                }).concat(apiGatewayApi.middleware, authServiceApi.middleware)
        });

        global.fetch = jest.fn();
        jest.clearAllMocks();
    });

    test('full login flow should update state and localStorage', async () => {
        const mockLoginResponse = {
            data: {
                login: {
                    accessToken: 'access-token-123',
                    refreshToken: 'refresh-token-456',
                    expiresIn: 3600,
                    user: {
                        id: 'user-1',
                        email: 'test@test.com',
                        firstName: 'Test',
                        lastName: 'User',
                        roles: ['customer'],
                        permissions: ['user:read:own']
                    }
                }
            }
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockLoginResponse)
        });

        await store.dispatch(
            loginUser({ email: 'test@test.com', password: 'Password123!' })
        );

        const state = store.getState().auth;

        // Check state
        expect(state.isAuthenticated).toBe(true);
        expect(state.user?.email).toBe('test@test.com');
        expect(state.tokens?.accessToken).toBe('access-token-123');
        expect(state.error).toBeNull();

        // Check localStorage was called
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'authState',
            expect.stringContaining('test@test.com')
        );
    });

    test('logout should clear all states', async () => {
        // First login
        const mockLoginResponse = {
            data: {
                login: {
                    accessToken: 'token',
                    refreshToken: 'refresh',
                    expiresIn: 3600,
                    user: { id: '1', email: 'test@test.com' }
                }
            }
        };

        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockLoginResponse)
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: { logout: true } })
            });

        await store.dispatch(
            loginUser({ email: 'test@test.com', password: 'Password123!' })
        );

        // Then logout
        store.dispatch(clearAuthState());

        const state = store.getState().auth;

        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.tokens).toBeNull();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('authState');
    });

    test('API calls should include auth token after login', async () => {
        // Login first
        const mockLoginResponse = {
            data: {
                login: {
                    accessToken: 'test-token',
                    refreshToken: 'refresh',
                    expiresIn: 3600,
                    user: { id: '1', email: 'test@test.com' }
                }
            }
        };

        const mockProductsResponse = {
            data: {
                products: {
                    items: [],
                    meta: { totalItems: 0, currentPage: 1, totalPages: 0 }
                }
            }
        };

        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockLoginResponse)
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockProductsResponse)
            });

        await store.dispatch(
            loginUser({ email: 'test@test.com', password: 'Password123!' })
        );

        // Make API call
        await store.dispatch(
            apiGatewayApi.endpoints.getProducts.initiate({})
        );

        // Check that fetch was called with auth header
        const fetchCalls = (global.fetch as jest.Mock).mock.calls;
        expect(fetchCalls).toHaveLength(2);

        const apiCallConfig = fetchCalls[1][1];
        expect(apiCallConfig.headers.authorization).toBe('Bearer test-token');
    });
});