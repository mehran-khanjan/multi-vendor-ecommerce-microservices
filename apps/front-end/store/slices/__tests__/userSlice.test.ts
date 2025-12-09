// store/slices/__tests__/userSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import userReducer, {
    UserState,
    clearUserError,
    setUserProfile,
    setUserAddresses,
    updateUserProfile,
    setupTwoFactorAuth,
    enableTwoFactorAuth,
    changeUserPassword,
    selectUserProfile,
    selectUserAddresses,
    selectUserLoading,
    selectUserError
} from '../userSlice';
import { authServiceApi } from '../../apis/authServiceApi';

const mockUserState: UserState = {
    profile: {
        id: '1',
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Test bio',
        timezone: 'UTC'
    },
    addresses: [
        {
            id: 'addr-1',
            label: 'Home',
            fullName: 'John Doe',
            addressLine1: '123 Main St',
            city: 'City',
            state: 'State',
            postalCode: '12345',
            countryCode: 'US',
            isDefault: true
        }
    ],
    sessions: [],
    isLoading: false,
    error: null
};

describe('userSlice', () => {
    let store: any;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                user: userReducer,
                [authServiceApi.reducerPath]: authServiceApi.reducer
            },
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware().concat(authServiceApi.middleware)
        });

        jest.clearAllMocks();
    });

    describe('reducers', () => {
        test('should handle initial state', () => {
            expect(userReducer(undefined, { type: 'unknown' })).toEqual({
                profile: null,
                addresses: [],
                sessions: [],
                isLoading: false,
                error: null
            });
        });

        test('should handle clearUserError', () => {
            const stateWithError = {
                ...mockUserState,
                error: 'Some error'
            };

            const state = userReducer(stateWithError, clearUserError());

            expect(state.error).toBeNull();
        });

        test('should handle setUserProfile', () => {
            const newProfile = {
                id: '1',
                email: 'updated@test.com',
                firstName: 'Updated',
                lastName: 'Name',
                bio: 'Updated bio'
            };

            const state = userReducer(mockUserState, setUserProfile(newProfile));

            expect(state.profile).toEqual(newProfile);
            expect(state.addresses).toEqual(mockUserState.addresses); // Unchanged
        });

        test('should handle setUserAddresses', () => {
            const newAddresses = [
                {
                    id: 'addr-2',
                    label: 'Work',
                    fullName: 'John Doe',
                    addressLine1: '456 Office St',
                    city: 'City',
                    state: 'State',
                    postalCode: '67890',
                    countryCode: 'US',
                    isDefault: false
                }
            ];

            const state = userReducer(mockUserState, setUserAddresses(newAddresses));

            expect(state.addresses).toEqual(newAddresses);
            expect(state.profile).toEqual(mockUserState.profile); // Unchanged
        });
    });

    describe('async thunks', () => {
        describe('updateUserProfile', () => {
            test('should update profile successfully', async () => {
                const updatedProfile = {
                    id: '1',
                    firstName: 'Updated',
                    lastName: 'Name'
                };

                jest.spyOn(authServiceApi.endpoints.updateProfile, 'initiate').mockReturnValue({
                    unwrap: () => Promise.resolve(updatedProfile)
                } as any);

                await store.dispatch(updateUserProfile(updatedProfile));

                const state = store.getState().user;

                expect(state.isLoading).toBe(false);
                expect(state.profile).toEqual({
                    ...mockUserState.profile,
                    ...updatedProfile
                });
                expect(state.error).toBeNull();
            });

            test('should handle update profile failure', async () => {
                const errorMessage = 'Update failed';

                jest.spyOn(authServiceApi.endpoints.updateProfile, 'initiate').mockReturnValue({
                    unwrap: () => Promise.reject({ data: { message: errorMessage } })
                } as any);

                store.dispatch(setUserProfile(mockUserState.profile));

                await store.dispatch(updateUserProfile({ firstName: 'New' }));

                const state = store.getState().user;

                expect(state.isLoading).toBe(false);
                expect(state.error).toBe(errorMessage);
                expect(state.profile).toEqual(mockUserState.profile); // Unchanged
            });
        });

        describe('setupTwoFactorAuth', () => {
            test('should setup 2FA successfully', async () => {
                const mockResponse = {
                    secret: 'JBSWY3DPEHPK3PXP',
                    qrCodeUrl: 'data:image/png;base64,...',
                    backupCodes: ['CODE1', 'CODE2', 'CODE3']
                };

                jest.spyOn(authServiceApi.endpoints.setupTwoFactor, 'initiate').mockReturnValue({
                    unwrap: () => Promise.resolve(mockResponse)
                } as any);

                await store.dispatch(setupTwoFactorAuth());

                const state = store.getState().user;

                expect(state.isLoading).toBe(false);
                expect(state.error).toBeNull();
            });
        });

        describe('enableTwoFactorAuth', () => {
            test('should enable 2FA successfully', async () => {
                const mockResponse = {
                    success: true,
                    message: 'Two-factor authentication enabled'
                };

                jest.spyOn(authServiceApi.endpoints.enableTwoFactor, 'initiate').mockReturnValue({
                    unwrap: () => Promise.resolve(mockResponse)
                } as any);

                await store.dispatch(enableTwoFactorAuth('123456'));

                const state = store.getState().user;

                expect(state.isLoading).toBe(false);
                expect(state.error).toBeNull();
            });
        });

        describe('changeUserPassword', () => {
            test('should change password successfully', async () => {
                const mockResponse = {
                    success: true,
                    message: 'Password changed successfully'
                };

                jest.spyOn(authServiceApi.endpoints.changePassword, 'initiate').mockReturnValue({
                    unwrap: () => Promise.resolve(mockResponse)
                } as any);

                await store.dispatch(
                    changeUserPassword({
                        currentPassword: 'OldPass123!',
                        newPassword: 'NewPass123!'
                    })
                );

                const state = store.getState().user;

                expect(state.isLoading).toBe(false);
                expect(state.error).toBeNull();
            });
        });
    });

    describe('selectors', () => {
        beforeEach(() => {
            store.dispatch(setUserProfile(mockUserState.profile));
            store.dispatch(setUserAddresses(mockUserState.addresses));
        });

        test('selectUserProfile should return profile', () => {
            const result = selectUserProfile(store.getState());
            expect(result).toEqual(mockUserState.profile);
        });

        test('selectUserAddresses should return addresses', () => {
            const result = selectUserAddresses(store.getState());
            expect(result).toEqual(mockUserState.addresses);
        });

        test('selectUserLoading should return loading state', () => {
            const result = selectUserLoading(store.getState());
            expect(result).toBe(false);
        });

        test('selectUserError should return error state', () => {
            const result = selectUserError(store.getState());
            expect(result).toBeNull();
        });
    });
});