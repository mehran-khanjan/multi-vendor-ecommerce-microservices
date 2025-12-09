// store/slices/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authServiceApi } from '../apis/authServiceApi';
import { apiGatewayApi } from '../apis/apiGatewayApi';
import { AppThunk, RootState } from '../configureStore';

export interface AuthState {
    user: any | null;
    tokens: {
        accessToken: string | null;
        refreshToken: string | null;
        expiresAt: number | null;
    } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    requiresTwoFactor: boolean;
    tempToken: string | null;
}

const getInitialState = (): AuthState => {
    if (typeof window === 'undefined') {
        return {
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            requiresTwoFactor: false,
            tempToken: null,
        };
    }

    try {
        const storedAuth = localStorage.getItem('authState');
        if (storedAuth) {
            const parsed = JSON.parse(storedAuth);
            // Check if token is still valid
            if (parsed.tokens?.expiresAt && parsed.tokens.expiresAt > Date.now()) {
                return {
                    ...parsed,
                    isLoading: false,
                    error: null,
                };
            }
        }
    } catch (error) {
        console.error('Failed to parse stored auth state:', error);
    }

    return {
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        requiresTwoFactor: false,
        tempToken: null,
    };
};

const initialState: AuthState = getInitialState();

// Async thunks
export const loginUser = createAsyncThunk(
    'auth/login',
    async (
        { email, password, twoFactorCode, backupCode }:
        { email: string; password: string; twoFactorCode?: string; backupCode?: string },
        { dispatch, rejectWithValue }
    ) => {
        try {
            const response = await dispatch(
                authServiceApi.endpoints.login.initiate({
                    input: { email, password, twoFactorCode, backupCode },
                })
            ).unwrap();

            if (response.requiresTwoFactor) {
                return {
                    requiresTwoFactor: true,
                    tempToken: response.tempToken,
                    user: null,
                    tokens: null,
                };
            }

            // Successful login
            const tokens = {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresAt: Date.now() + response.expiresIn * 1000,
            };

            // Store auth state
            localStorage.setItem('authState', JSON.stringify({
                user: response.user,
                tokens,
                isAuthenticated: true,
            }));

            return {
                user: response.user,
                tokens,
                isAuthenticated: true,
                requiresTwoFactor: false,
                tempToken: null,
            };
        } catch (error: any) {
            return rejectWithValue(error?.data?.message || 'Login failed');
        }
    }
);

export const completeTwoFactorLogin = createAsyncThunk(
    'auth/completeTwoFactor',
    async (
        { tempToken, code, isBackupCode = false }:
        { tempToken: string; code: string; isBackupCode?: boolean },
        { dispatch, rejectWithValue }
    ) => {
        try {
            const response = await dispatch(
                authServiceApi.endpoints.completeTwoFactorLogin.initiate({
                    tempToken,
                    code,
                    isBackupCode,
                })
            ).unwrap();

            const tokens = {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresAt: Date.now() + response.expiresIn * 1000,
            };

            localStorage.setItem('authState', JSON.stringify({
                user: response.user,
                tokens,
                isAuthenticated: true,
            }));

            return {
                user: response.user,
                tokens,
                isAuthenticated: true,
                requiresTwoFactor: false,
                tempToken: null,
            };
        } catch (error: any) {
            return rejectWithValue(error?.data?.message || 'Two-factor authentication failed');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (
        { email, password, firstName, lastName, phoneNumber }:
        { email: string; password: string; firstName: string; lastName: string; phoneNumber?: string },
        { dispatch, rejectWithValue }
    ) => {
        try {
            const response = await dispatch(
                authServiceApi.endpoints.register.initiate({
                    input: { email, password, firstName, lastName, phoneNumber },
                })
            ).unwrap();

            const tokens = {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresAt: Date.now() + response.expiresIn * 1000,
            };

            localStorage.setItem('authState', JSON.stringify({
                user: response.user,
                tokens,
                isAuthenticated: true,
            }));

            return {
                user: response.user,
                tokens,
                isAuthenticated: true,
                requiresTwoFactor: false,
                tempToken: null,
            };
        } catch (error: any) {
            return rejectWithValue(error?.data?.message || 'Registration failed');
        }
    }
);

export const refreshAuthToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { getState, dispatch, rejectWithValue }) => {
        const state = getState() as RootState;
        const refreshToken = state.auth.tokens?.refreshToken;

        if (!refreshToken) {
            return rejectWithValue('No refresh token available');
        }

        try {
            const response = await dispatch(
                authServiceApi.endpoints.refreshToken.initiate({ refreshToken })
            ).unwrap();

            const tokens = {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresAt: Date.now() + response.expiresIn * 1000,
            };

            localStorage.setItem('authState', JSON.stringify({
                user: response.user,
                tokens,
                isAuthenticated: true,
            }));

            return {
                user: response.user,
                tokens,
                isAuthenticated: true,
            };
        } catch (error: any) {
            // Clear auth state on refresh failure
            dispatch(clearAuthState());
            return rejectWithValue(error?.data?.message || 'Token refresh failed');
        }
    }
);

export const logoutUser = (): AppThunk => async (dispatch, getState) => {
    const state = getState() as RootState;

    try {
        if (state.auth.isAuthenticated) {
            await dispatch(
                authServiceApi.endpoints.logout.initiate()
            ).unwrap();
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        dispatch(clearAuthState());
        // Clear all API caches
        dispatch(apiGatewayApi.util.resetApiState());
        dispatch(authServiceApi.util.resetApiState());
    }
};

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const response = await dispatch(
                authServiceApi.endpoints.getMe.initiate()
            ).unwrap();

            return response;
        } catch (error: any) {
            // If unauthorized, clear auth state
            if (error?.status === 401) {
                dispatch(clearAuthState());
            }
            return rejectWithValue(error?.data?.message || 'Failed to fetch user');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthState: (state) => {
            state.user = null;
            state.tokens = null;
            state.isAuthenticated = false;
            state.error = null;
            state.requiresTwoFactor = false;
            state.tempToken = null;
            localStorage.removeItem('authState');
        },
        setAuthState: (state, action: PayloadAction<Partial<AuthState>>) => {
            Object.assign(state, action.payload);
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                Object.assign(state, action.payload);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Complete Two-Factor
            .addCase(completeTwoFactorLogin.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(completeTwoFactorLogin.fulfilled, (state, action) => {
                state.isLoading = false;
                Object.assign(state, action.payload);
            })
            .addCase(completeTwoFactorLogin.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Register
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;
                Object.assign(state, action.payload);
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Refresh Token
            .addCase(refreshAuthToken.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(refreshAuthToken.fulfilled, (state, action) => {
                state.isLoading = false;
                Object.assign(state, action.payload);
            })
            .addCase(refreshAuthToken.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
                state.tokens = null;
                state.user = null;
            })

            // Fetch Current User
            .addCase(fetchCurrentUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearAuthState, setAuthState, clearError } = authSlice.actions;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectRequiresTwoFactor = (state: RootState) => state.auth.requiresTwoFactor;
export const selectTempToken = (state: RootState) => state.auth.tempToken;
export const selectAccessToken = (state: RootState) => state.auth.tokens?.accessToken;

export default authSlice.reducer;