// store/slices/userSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authServiceApi } from '../apis/authServiceApi';
import { AppThunk, RootState } from '../configureStore';

export interface UserState {
    profile: any | null;
    addresses: any[];
    sessions: any[];
    isLoading: boolean;
    error: string | null;
}

const initialState: UserState = {
    profile: null,
    addresses: [],
    sessions: [],
    isLoading: false,
    error: null,
};

// Async thunks
export const updateUserProfile = createAsyncThunk(
    'user/updateProfile',
    async (profileData: any, { dispatch, rejectWithValue }) => {
        try {
            const response = await dispatch(
                authServiceApi.endpoints.updateProfile.initiate({ input: profileData })
            ).unwrap();

            return response;
        } catch (error: any) {
            return rejectWithValue(error?.data?.message || 'Failed to update profile');
        }
    }
);

export const setupTwoFactorAuth = createAsyncThunk(
    'user/setupTwoFactor',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const response = await dispatch(
                authServiceApi.endpoints.setupTwoFactor.initiate()
            ).unwrap();

            return response;
        } catch (error: any) {
            return rejectWithValue(error?.data?.message || 'Failed to setup two-factor authentication');
        }
    }
);

export const enableTwoFactorAuth = createAsyncThunk(
    'user/enableTwoFactor',
    async (code: string, { dispatch, rejectWithValue }) => {
        try {
            const response = await dispatch(
                authServiceApi.endpoints.enableTwoFactor.initiate({ code })
            ).unwrap();

            return { success: response.success, message: response.message };
        } catch (error: any) {
            return rejectWithValue(error?.data?.message || 'Failed to enable two-factor authentication');
        }
    }
);

export const changeUserPassword = createAsyncThunk(
    'user/changePassword',
    async (
        { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
        { dispatch, rejectWithValue }
    ) => {
        try {
            const response = await dispatch(
                authServiceApi.endpoints.changePassword.initiate({ currentPassword, newPassword })
            ).unwrap();

            return { success: response.success, message: response.message };
        } catch (error: any) {
            return rejectWithValue(error?.data?.message || 'Failed to change password');
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        clearUserError: (state) => {
            state.error = null;
        },
        setUserProfile: (state, action: PayloadAction<any>) => {
            state.profile = action.payload;
        },
        setUserAddresses: (state, action: PayloadAction<any[]>) => {
            state.addresses = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Update Profile
            .addCase(updateUserProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.profile = { ...state.profile, ...action.payload };
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Setup Two-Factor
            .addCase(setupTwoFactorAuth.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(setupTwoFactorAuth.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(setupTwoFactorAuth.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Enable Two-Factor
            .addCase(enableTwoFactorAuth.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(enableTwoFactorAuth.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(enableTwoFactorAuth.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Change Password
            .addCase(changeUserPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(changeUserPassword.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(changeUserPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearUserError, setUserProfile, setUserAddresses } = userSlice.actions;

// Selectors
export const selectUserProfile = (state: RootState) => state.user.profile;
export const selectUserAddresses = (state: RootState) => state.user.addresses;
export const selectUserLoading = (state: RootState) => state.user.isLoading;
export const selectUserError = (state: RootState) => state.user.error;

export default userSlice.reducer;