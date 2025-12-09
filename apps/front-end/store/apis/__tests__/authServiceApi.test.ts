// store/apis/__tests__/authServiceApi.test.ts
import { setupApiStore } from '../../__tests__/testUtils';
import { authServiceApi } from '../authServiceApi';

const mockAuthResponse = {
    data: {
        register: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresIn: 3600,
            user: { id: '1', email: 'test@test.com', firstName: 'John', lastName: 'Doe', roles: ['customer'] }
        }
    }
};

describe('authServiceApi', () => {
    let store: any;

    beforeEach(() => {
        store = setupApiStore(authServiceApi);
        fetchMock.resetMocks();
        localStorage.clear();
    });

    describe('register', () => {
        test('should register user successfully', async () => {
            fetchMock.mockResponseOnce(JSON.stringify(mockAuthResponse));

            const result = await store.dispatch(
                authServiceApi.endpoints.register.initiate({
                    input: {
                        email: 'test@test.com',
                        password: 'Password123!',
                        firstName: 'John',
                        lastName: 'Doe'
                    }
                })
            );

            expect(result.data).toEqual(mockAuthResponse.data.register);
            expect(result.error).toBeUndefined();
        });

        test('should handle validation errors', async () => {
            const errorResponse = {
                errors: [{ message: 'Email already exists' }],
                data: null
            };

            fetchMock.mockResponseOnce(JSON.stringify(errorResponse), { status: 400 });

            const result = await store.dispatch(
                authServiceApi.endpoints.register.initiate({
                    input: {
                        email: 'existing@test.com',
                        password: 'Password123!',
                        firstName: 'John',
                        lastName: 'Doe'
                    }
                })
            );

            expect(result.error).toBeDefined();
        });
    });

    describe('login', () => {
        test('should login successfully', async () => {
            const mockLogin = {
                data: {
                    login: {
                        accessToken: 'access-token',
                        refreshToken: 'refresh-token',
                        expiresIn: 3600,
                        user: { id: '1', email: 'test@test.com', roles: ['customer'] }
                    }
                }
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockLogin));

            const result = await store.dispatch(
                authServiceApi.endpoints.login.initiate({
                    input: { email: 'test@test.com', password: 'Password123!' }
                })
            );

            expect(result.data).toEqual(mockLogin.data.login);
        });

        test('should handle 2FA required response', async () => {
            const mock2FA = {
                data: {
                    login: {
                        requiresTwoFactor: true,
                        tempToken: 'temp-token-123'
                    }
                }
            };

            fetchMock.mockResponseOnce(JSON.stringify(mock2FA));

            const result = await store.dispatch(
                authServiceApi.endpoints.login.initiate({
                    input: { email: 'test@test.com', password: 'Password123!' }
                })
            );

            expect(result.data).toEqual(mock2FA.data.login);
            expect(result.data.requiresTwoFactor).toBe(true);
        });
    });

    describe('getMe', () => {
        test('should fetch current user with auth token', async () => {
            const mockUser = {
                data: {
                    me: {
                        id: '1',
                        email: 'test@test.com',
                        firstName: 'John',
                        lastName: 'Doe'
                    }
                }
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockUser));

            const customStore = setupApiStore(authServiceApi, {
                auth: {
                    tokens: { accessToken: 'valid-token' },
                    isAuthenticated: true,
                    user: null,
                    isLoading: false,
                    error: null,
                    requiresTwoFactor: false,
                    tempToken: null
                }
            });

            const result = await customStore.dispatch(
                authServiceApi.endpoints.getMe.initiate()
            );

            const call = fetchMock.mock.calls[0];
            const headers = call[1]?.headers as Record<string, string>;

            expect(headers.authorization).toBe('Bearer valid-token');
            expect(result.data).toEqual(mockUser.data.me);
        });
    });

    describe('logout', () => {
        test('should call logout endpoint', async () => {
            fetchMock.mockResponseOnce(JSON.stringify({ data: { logout: true } }));

            const result = await store.dispatch(
                authServiceApi.endpoints.logout.initiate()
            );

            expect(result.data).toBe(true);
        });
    });
});