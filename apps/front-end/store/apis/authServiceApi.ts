// store/apis/authServiceApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../configureStore';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:4001/graphql';

export const authServiceApi = createApi({
    reducerPath: 'authServiceApi',
    baseQuery: fetchBaseQuery({
        baseUrl: AUTH_SERVICE_URL,
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
        // Authentication
        register: builder.mutation<any, { input: any }>({
            query: ({ input }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation Register($input: RegisterInput!) {
              register(input: $input) {
                accessToken
                refreshToken
                expiresIn
                user {
                  id
                  email
                  firstName
                  lastName
                  roles
                }
              }
            }
          `,
                    variables: { input },
                },
            }),
            transformResponse: (response: any) => response.data?.register || null,
        }),

        login: builder.mutation<any, { input: any }>({
            query: ({ input }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                ... on AuthResponse {
                  accessToken
                  refreshToken
                  expiresIn
                  user {
                    id
                    email
                    firstName
                    lastName
                    roles
                    permissions
                  }
                }
                ... on TwoFactorResponse {
                  requiresTwoFactor
                  tempToken
                }
              }
            }
          `,
                    variables: { input },
                },
            }),
            transformResponse: (response: any) => response.data?.login || null,
        }),

        completeTwoFactorLogin: builder.mutation<any, { tempToken: string; code: string; isBackupCode?: boolean }>({
            query: ({ tempToken, code, isBackupCode }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation CompleteTwoFactorLogin($tempToken: String!, $code: String!, $isBackupCode: Boolean) {
              completeTwoFactorLogin(tempToken: $tempToken, code: $code, isBackupCode: $isBackupCode) {
                accessToken
                refreshToken
                expiresIn
                user {
                  id
                  email
                  firstName
                  lastName
                  roles
                  permissions
                }
              }
            }
          `,
                    variables: { tempToken, code, isBackupCode },
                },
            }),
            transformResponse: (response: any) => response.data?.completeTwoFactorLogin || null,
        }),

        refreshToken: builder.mutation<any, { refreshToken: string }>({
            query: ({ refreshToken }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation RefreshToken($input: RefreshTokenInput!) {
              refreshToken(input: { refreshToken: $refreshToken }) {
                accessToken
                refreshToken
                expiresIn
                user {
                  id
                  email
                  firstName
                  lastName
                  roles
                }
              }
            }
          `,
                    variables: { refreshToken },
                },
            }),
            transformResponse: (response: any) => response.data?.refreshToken || null,
        }),

        logout: builder.mutation<any, void>({
            query: () => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation Logout {
              logout
            }
          `,
                },
            }),
        }),

        logoutAllDevices: builder.mutation<any, void>({
            query: () => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation LogoutAllDevices {
              logoutAllDevices
            }
          `,
                },
            }),
        }),

        // User management
        getMe: builder.query<any, void>({
            query: () => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            query GetMe {
              me {
                id
                email
                firstName
                lastName
                roles
                permissions
                emailVerified
                twoFactorEnabled
                profile {
                  bio
                  website
                  timezone
                }
                addresses {
                  id
                  label
                  fullName
                  addressLine1
                  city
                  state
                  postalCode
                  countryCode
                  isDefault
                }
              }
            }
          `,
                },
            }),
            transformResponse: (response: any) => response.data?.me || null,
        }),

        updateProfile: builder.mutation<any, { input: any }>({
            query: ({ input }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation UpdateMyProfile($input: UpdateUserInput!) {
              updateMyProfile(input: $input) {
                id
                firstName
                lastName
                avatarUrl
              }
            }
          `,
                    variables: { input },
                },
            }),
            transformResponse: (response: any) => response.data?.updateMyProfile || null,
        }),

        // Two-Factor Authentication
        setupTwoFactor: builder.mutation<any, void>({
            query: () => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation SetupTwoFactor {
              setupTwoFactor {
                secret
                qrCodeUrl
                backupCodes
              }
            }
          `,
                },
            }),
            transformResponse: (response: any) => response.data?.setupTwoFactor || null,
        }),

        enableTwoFactor: builder.mutation<any, { code: string }>({
            query: ({ code }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation EnableTwoFactor($input: VerifyTwoFactorInput!) {
              enableTwoFactor(input: { code: $code }) {
                success
                message
              }
            }
          `,
                    variables: { input: { code } },
                },
            }),
            transformResponse: (response: any) => response.data?.enableTwoFactor || null,
        }),

        // Password management
        forgotPassword: builder.mutation<any, { email: string }>({
            query: ({ email }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation ForgotPassword($input: ForgotPasswordInput!) {
              forgotPassword(input: { email: $email }) {
                success
                message
              }
            }
          `,
                    variables: { input: { email } },
                },
            }),
            transformResponse: (response: any) => response.data?.forgotPassword || null,
        }),

        resetPassword: builder.mutation<any, { token: string; newPassword: string }>({
            query: ({ token, newPassword }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation ResetPassword($input: ResetPasswordInput!) {
              resetPassword(input: { token: $token, newPassword: $newPassword }) {
                success
                message
              }
            }
          `,
                    variables: { input: { token, newPassword } },
                },
            }),
            transformResponse: (response: any) => response.data?.resetPassword || null,
        }),

        changePassword: builder.mutation<any, { currentPassword: string; newPassword: string }>({
            query: ({ currentPassword, newPassword }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation ChangePassword($input: ChangePasswordInput!) {
              changePassword(input: { currentPassword: $currentPassword, newPassword: $newPassword }) {
                success
                message
              }
            }
          `,
                    variables: { input: { currentPassword, newPassword } },
                },
            }),
            transformResponse: (response: any) => response.data?.changePassword || null,
        }),

        // Email verification
        verifyEmail: builder.mutation<any, { token: string }>({
            query: ({ token }) => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation VerifyEmail($input: VerifyEmailInput!) {
              verifyEmail(input: { token: $token }) {
                success
                message
              }
            }
          `,
                    variables: { input: { token } },
                },
            }),
            transformResponse: (response: any) => response.data?.verifyEmail || null,
        }),

        resendVerificationEmail: builder.mutation<any, void>({
            query: () => ({
                url: '',
                method: 'POST',
                body: {
                    query: `
            mutation ResendVerificationEmail {
              resendVerificationEmail {
                success
                message
              }
            }
          `,
                },
            }),
            transformResponse: (response: any) => response.data?.resendVerificationEmail || null,
        }),

        // Health check
        checkAuthHealth: builder.query<any, void>({
            query: () => ({
                url: '/health',
                method: 'GET',
            }),
        }),
    }),
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useCompleteTwoFactorLoginMutation,
    useRefreshTokenMutation,
    useLogoutMutation,
    useLogoutAllDevicesMutation,
    useGetMeQuery,
    useUpdateProfileMutation,
    useSetupTwoFactorMutation,
    useEnableTwoFactorMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useChangePasswordMutation,
    useVerifyEmailMutation,
    useResendVerificationEmailMutation,
    useCheckAuthHealthQuery,
} = authServiceApi;