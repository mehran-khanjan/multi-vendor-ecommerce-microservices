// store/configureStore.ts
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import notificationReducer from './slices/notificationSlice';
import { apiGatewayApi } from './apis/apiGatewayApi';
import { authServiceApi } from './apis/authServiceApi';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        user: userReducer,
        notifications: notificationReducer,
        [apiGatewayApi.reducerPath]: apiGatewayApi.reducer,
        [authServiceApi.reducerPath]: authServiceApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['auth/persistAuthState', 'auth/clearAuthState'],
                ignoredPaths: ['auth.user', 'auth.tokens'],
            },
        }).concat(apiGatewayApi.middleware, authServiceApi.middleware),
    devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.reducer>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;