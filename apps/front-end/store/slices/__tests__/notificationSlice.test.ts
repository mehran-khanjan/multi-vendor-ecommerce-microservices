// store/slices/__tests__/notificationSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import notificationReducer, {
    Notification,
    addNotification,
    removeNotification,
    clearNotifications,
    selectNotifications
} from '../notificationSlice';

const mockNotification: Omit<Notification, 'id' | 'createdAt'> = {
    type: 'success',
    title: 'Success',
    message: 'Operation completed successfully',
    duration: 5000
};

describe('notificationSlice', () => {
    let store: any;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                notifications: notificationReducer
            }
        });

        jest.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid');
        jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('reducers', () => {
        test('should handle initial state', () => {
            expect(notificationReducer(undefined, { type: 'unknown' })).toEqual({
                notifications: []
            });
        });

        test('should handle addNotification', () => {
            const action = addNotification(mockNotification);

            const state = notificationReducer(undefined, action);

            expect(state.notifications).toHaveLength(1);
            expect(state.notifications[0]).toEqual({
                id: 'test-uuid',
                createdAt: 1234567890,
                ...mockNotification
            });
        });

        test('should handle removeNotification', () => {
            const initialState = {
                notifications: [
                    { id: '1', createdAt: 123, type: 'success', title: 'Test', message: 'Test' },
                    { id: '2', createdAt: 456, type: 'error', title: 'Error', message: 'Error' }
                ]
            };

            const state = notificationReducer(initialState, removeNotification('1'));

            expect(state.notifications).toHaveLength(1);
            expect(state.notifications[0].id).toBe('2');
        });

        test('should handle clearNotifications', () => {
            const initialState = {
                notifications: [
                    { id: '1', createdAt: 123, type: 'success', title: 'Test', message: 'Test' }
                ]
            };

            const state = notificationReducer(initialState, clearNotifications());

            expect(state.notifications).toHaveLength(0);
        });
    });

    describe('selectors', () => {
        test('selectNotifications should return notifications array', () => {
            const notifications = [
                { id: '1', createdAt: 123, type: 'success', title: 'Test', message: 'Test' }
            ];

            store.dispatch(addNotification(mockNotification));

            const result = selectNotifications(store.getState());

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-uuid');
        });
    });
});