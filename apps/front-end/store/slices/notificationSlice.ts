// store/slices/notificationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    createdAt: number;
}

export interface NotificationState {
    notifications: Notification[];
}

const initialState: NotificationState = {
    notifications: [],
};

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: {
            reducer: (state, action: PayloadAction<Notification>) => {
                state.notifications.push(action.payload);
            },
            prepare: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
                const id = crypto.randomUUID();
                const createdAt = Date.now();
                return {
                    payload: { ...notification, id, createdAt },
                };
            },
        },
        removeNotification: (state, action: PayloadAction<string>) => {
            state.notifications = state.notifications.filter(
                (notification) => notification.id !== action.payload
            );
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },
    },
});

export const { addNotification, removeNotification, clearNotifications } = notificationSlice.actions;

// Selectors
export const selectNotifications = (state: { notifications: NotificationState }) =>
    state.notifications.notifications;

export default notificationSlice.reducer;