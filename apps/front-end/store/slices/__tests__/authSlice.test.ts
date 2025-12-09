// store/slices/__tests__/authSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
    AuthState,
    clearAuthState,
    setAuthState,
    clearError,
    loginUser,
    registerUser,
    refreshAuthToken,
    fetchCurrentUser,
    completeTwoFactorLogin,
    logoutUser,
    selectAuth,
    selectCurrentUser,
    selectIsAuthenticated
} from '../authSlice';
import { apiGatewayApi } from '../../apis/apiGatewayApi';
import { authServiceApi } from '../../apis/authServiceApi';

const mockAuthState: AuthState = {
    user: {
        id: '1',
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['customer'],
        permissions: ['user:read:own']
    },
    tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    requiresTwoFactor: false,
    tempToken: null
};

describe('authSlice', () => {
    let store: any;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                auth: authReducer,
                [apiGatewayApi.reducerPath]: apiGatewayApi.reducer,
                [authServiceApi.reducerPath]: authServiceApi.reducer
            },
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware().concat(
                    apiGatewayApi.middleware,
                    authServiceApi.middleware
                )
        });

        localStorage.clear();
        jest.clearAllMocks();
    });

    describe('reducers', () => {
        test('should handle initial state', () => {
            expect(authReducer(undefined, { type: 'unknown' })).toEqual({
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
                requiresTwoFactor: false,
                tempToken: null
            });
        });

        test('should handle clearAuthState', () => {
            const state = authReducer(mockAuthState, clearAuthState());

            expect(state.user).toBeNull();
            expect(state.tokens).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.error).toBeNull();
            expect(state.requiresTwoFactor).toBe(false);
            expect(state.tempToken).toBeNull();
        });

        test('should handle setAuthState', () => {
            const newState = {
                user: { id: '2', email: 'new@test.com' },
                isAuthenticated: true
            };

            const state = authReducer(mockAuthState, setAuthState(newState));

            expect(state.user).toEqual(newState.user);
            expect(state.isAuthenticated).toBe(true);
            // Other properties should remain unchanged
            expect(state.tokens).toEqual(mockAuthState.tokens);
        });

        test('should handle clearError', () => {
            const stateWithError = {
                ...mockAuthState,
                error: 'Some error'
            };

            const state = authReducer(stateWithError, clearError());

            expect(state.error).toBeNull();
        });
    });

    describe('async thunks', () => {
        describe('loginUser', () => {
            test('should handle successful login', async () => {
                const mockResponse = {
                    accessToken: 'new-access-token',
                    refreshToken: 'new-refresh-token',
                    expiresIn: 3600,
                    user: {
                        id: '2',
                        email: 'new@test.com',
                        firstName: 'Jane',
                        lastName: 'Smith',
                        roles: ['customer'],
                        permissions: ['user:read:own']
                    }
                };

                // Mock the API call
                jest.spyOn(authServiceApi.endpoints.login, 'initiate').mockReturnValue({
                    unwrap: () => Promise.resolve(mockResponse)
                } as any);

                await store.dispatch(
                    loginUser({ email: 'new@test.com', password: 'Password123!' })
                );

                const state = store.getState().auth;

                expect(state.isLoading).toBe(false);
                expect(state.user).toEqual(mockResponse.user);
                expect(state.tokens?.accessToken).toBe(mockResponse.accessToken);
                expect(state.isAuthenticated).toBe(true);
                expect(state.error).toBeNull();

                // Check localStorage
                const storedAuth = JSON.parse(localStorage.getItem('authState') || '{}');
                expect(storedAuth.user).toEqual(mockResponse.user);
                expect(storedAuth.isAuthenticated).toBe(true);
            });

            test('should handle 2FA required login', async () => {
                const mock2FAResponse = {
                    requiresTwoFactor: true,
                    tempToken: 'temp-token-123',
                    user: null,
                    tokens: null
                };

                jest.spyOn(authServiceApi.endpoints.login, 'initiate').mockReturnValue({
                    unwrap: () => Promise.resolve(mock2FAResponse)
                } as any);

                await store.dispatch(
                    loginUser({ email: 'test@test.com', password: 'Password123!' })
                );

                const state = store.getState().auth;

                expect(state.requiresTwoFactor).toBe(true);
                expect(state.tempToken).toBe('temp-token-123');
                expect(state.isAuthenticated).toBe(false);
                expect(state.user).toBeNull();
            });

            test('should handle login failure', async () => {
                const errorMessage = 'Invalid credentials';

                jest.spyOn(authServiceApi.endpoints.login, 'initiate').mockReturnValue({
                    unwrap: () => Promise.reject({ data: { message: errorMessage } })
                } as any);

                await store.dispatch(
                    loginUser({ email: 'wrong@test.com', password: 'wrong' })
                );

                const state = store.getState().auth;

                expect(state.isLoading).toBe(false);
                expect(state.error).toBe(errorMessage);
                expect(state.isAuthenticated).toBe(false);
            });
        });

        describe('completeTwoFactorLogin', () => {
            test('should complete 2FA login successfully', async () => {
                const mockResponse = {
                    accessToken: '2fa-access-token',
                    refreshToken: '2fa-refresh-token',
                    expiresIn: 3600,
                    user: {
                        id: '3',
                        email: '2fa@test.com',
                        firstName: 'Two',
                        lastName: 'Factor',
                        roles: ['customer']
                    }
                };

                jest.spyOn(authServiceApi.endpoints.completeTwoFactorLogin, 'initiate').mockReturnValue({
                    unwrap: () => Promise.resolve(mockResponse)
                } as any);

                await store.dispatch(
                    completeTwoFactorLogin({
                        tempToken: 'temp-token',
                        code: '123456',
                        isBackupCode: false
                    })
                );

                const state = store.getState().auth;

                expect(state.isLoading).toBe(false);
                expect(state.user).toEqual(mockResponse.user);
                expect(state.tokens?.accessToken).toBe(mockResponse.accessToken);
                expect(state.isAuthenticated).toBe(true);
                expect(state.requiresTwoFactor).toBe(false);
                expect(state.tempToken).toBeNull();
            });
        });

        describe('registerUser', () => {
            test('should register successfully', async () => {
                const mockResponse = {
                    accessToken: 'reg-access-token',
                    refreshToken: 'reg-refresh-token',
                    expiresIn: 3600,
                    user: {
                        id: '4',
                        email: 'register@test.com',
                        firstName: 'Register',
                        lastName: 'User',
                        roles: ['customer']
                    }
                };

                jest.spyOn(authServiceApi.endpoints.register, 'initiate').mockReturnValue({
                    unwrap: () => Promise.resolve(mockResponse)
                } as any);

                await store.dispatch(
                    registerUser({
                        email: 'register@test.com',
                        password: 'Password123!',
                        firstName: 'Register',
                        lastName: 'User'
                    })
                );

                const state = store.getState().auth;

                expect(state.isLoading).toBe(false);
                expect(state.user).toEqual(mockResponse.user);
                expect(state.isAuthenticated).toBe(true);
                expect(state.error).toBeNull();
            });
        });

        describe('refreshAuthToken', () => {
            test('should refresh token successfully', async () => {
                const mockResponse = {
                    accessToken: 'new-access-token',
                    refreshToken: 'new-refresh-token',
                    expiresIn: 3600,
                    user: {
                        id: '1',
                        email: 'test@test.com',
                        firstName: 'John',
                        lastName: 'Doe'
                    }
                };

                // Set initial state with expired token
                store.dispatch(setAuthState({
                    ...mockAuthState,
                    tokens: {
                        ...mockAuthState.tokens!,
                        expiresAt: Date.now() - 1000 // Expired
                    }
                }));

                jest.spyOn(authServiceApi.endpoints.refreshToken, 'initiate').mockReturnValue({
                    unwrap: () => Promise.resolve(mockResponse)
                } as any);

                await store.dispatch(refreshAuthToken());

                const state = store.getState().auth;

                expect(state.tokens?.accessToken).toBe(mockResponse.accessToken);
                expect(state.tokens?.expiresAt).toBeGreaterThan(Date.now());
            });

            test('should clear auth state on refresh failure', async () => {
                store.dispatch(setAuthState(mockAuthState));

                jest.spyOn(authServiceApi.endpoints.refreshToken, 'initiate').mockReturnValue({
                    unwrap: () => Promise.reject({ data: { message: 'Token invalid' } })
                } as any);

                await store.dispatch(refreshAuthToken());

                const state = store.getState().auth;

                expect(state.isAuthenticated).toBe(false);
                expect(state.tokens).toBeNull();
                expect(state.user).toBeNull();
            });
        });

        describe('logoutUser', () => {
            test('should clear auth state on logout', async () => {
                store.dispatch(setAuthState(mockAuthState));

                // Mock the logout API call
                jest.spyOn(authServiceApi.endpoints.logout, 'initiate').mockReturnValue({
                    unwrap: () => Promise.resolve(true)
                } as any);

                await store.dispatch(logoutUser());

                const state = store.getState().auth;

                expect(state.isAuthenticated).toBe(false);
                expect(state.tokens).toBeNull();
                expect(state.user).toBeNull();
                expect(localStorage.getItem('authState')).toBeNull();
            });
        });

        describe('fetchCurrentUser', () => {
            test('should fetch current user successfully', async () => {
                const mockUser = {
                    id: '1',
                    email: 'test@test.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    profile: { bio: 'Test bio' }
                };

                jest.spyOn(authServiceApi.endpoints.getMe, 'initiate').mockReturnValue({
                    unwrap: () => Promise.resolve(mockUser)
                } as any);

                await store.dispatch(fetchCurrentUser());

                const state = store.getState().auth;

                expect(state.user).toEqual(mockUser);
                expect(state.isLoading).toBe(false);
            });

            test('should clear auth state on 401 error', async () => {
                store.dispatch(setAuthState(mockAuthState));

                jest.spyOn(authServiceApi.endpoints.getMe, 'initiate').mockReturnValue({
                    unwrap: () => Promise.reject({ status: 401, data: { message: 'Unauthorized' } })
                } as any);

                await store.dispatch(fetchCurrentUser());

                const state = store.getState().auth;

                expect(state.isAuthenticated).toBe(false);
                expect(state.tokens).toBeNull();
                expect(state.user).toBeNull();
            });
        });
    });

    describe('selectors', () => {
        beforeEach(() => {
            store.dispatch(setAuthState(mockAuthState));
        });

        test('selectAuth should return entire auth state', () => {
            const result = selectAuth(store.getState());
            expect(result).toEqual(store.getState().auth);
        });

        test('selectCurrentUser should return user object', () => {
            const result = selectCurrentUser(store.getState());
            expect(result).toEqual(mockAuthState.user);
        });

        test('selectIsAuthenticated should return authentication status', () => {
            const result = selectIsAuthenticated(store.getState());
            expect(result).toBe(true);
        });
    });
});