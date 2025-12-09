// store/middleware/__tests__/authMiddleware.test.ts
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { authMiddleware } from '../authMiddleware';
import { refreshAuthToken, clearAuthState } from '../../slices/authSlice';

jest.mock('../../slices/authSlice', () => ({
    ...jest.requireActual('../../slices/authSlice'),
    refreshAuthToken: jest.fn(() => ({ type: 'auth/refreshToken' })),
    clearAuthState: jest.fn(() => ({ type: 'auth/clearAuthState' }))
}));

describe('authMiddleware', () => {
    let store: any;

    const testSlice = createSlice({
        name: 'test',
        initialState: {},
        reducers: {
            testAction: (state) => state
        }
    });

    beforeEach(() => {
        store = configureStore({
            reducer: {
                auth: (state = {
                    tokens: null,
                    isAuthenticated: false,
                    user: null,
                    isLoading: false,
                    error: null,
                    requiresTwoFactor: false,
                    tempToken: null
                }) => state,
                test: testSlice.reducer
            },
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware().concat(authMiddleware)
        });

        jest.clearAllMocks();
    });

    test('should not refresh token when no token exists', async () => {
        await store.dispatch(testSlice.actions.testAction());

        expect(refreshAuthToken).not.toHaveBeenCalled();
        expect(clearAuthState).not.toHaveBeenCalled();
    });

    test('should not refresh token when token is not expiring soon', async () => {
        // Token expires in 10 minutes (not soon)
        store.getState().auth.tokens = {
            accessToken: 'token',
            refreshToken: 'refresh',
            expiresAt: Date.now() + 10 * 60 * 1000
        };

        await store.dispatch(testSlice.actions.testAction());

        expect(refreshAuthToken).not.toHaveBeenCalled();
    });

    test('should refresh token when token is expiring soon (less than 5 minutes)', async () => {
        // Token expires in 4 minutes (soon)
        store.getState().auth.tokens = {
            accessToken: 'token',
            refreshToken: 'refresh',
            expiresAt: Date.now() + 4 * 60 * 1000
        };

        await store.dispatch(testSlice.actions.testAction());

        expect(refreshAuthToken).toHaveBeenCalled();
    });

    test('should clear auth state when refresh fails', async () => {
        // Token expires soon
        store.getState().auth.tokens = {
            accessToken: 'token',
            refreshToken: 'refresh',
            expiresAt: Date.now() + 2 * 60 * 1000
        };

        // Mock refresh to fail
        (refreshAuthToken as jest.Mock).mockImplementation(() => {
            throw new Error('Refresh failed');
        });

        await store.dispatch(testSlice.actions.testAction());

        expect(refreshAuthToken).toHaveBeenCalled();
        expect(clearAuthState).toHaveBeenCalled();
    });
});