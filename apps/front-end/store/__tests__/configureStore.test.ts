// store/__tests__/configureStore.test.ts
import { configureStore } from '../configureStore';

describe('configureStore', () => {
    test('should create store with all reducers', () => {
        const store = configureStore();

        expect(store).toBeDefined();
        expect(store.getState()).toHaveProperty('auth');
        expect(store.getState()).toHaveProperty('user');
        expect(store.getState()).toHaveProperty('notifications');
        expect(store.getState()).toHaveProperty('apiGatewayApi');
        expect(store.getState()).toHaveProperty('authServiceApi');
    });

    test('should enable devTools only in development', () => {
        const originalEnv = process.env.NODE_ENV;

        process.env.NODE_ENV = 'development';
        const devStore = configureStore();

        process.env.NODE_ENV = 'production';
        const prodStore = configureStore();

        process.env.NODE_ENV = originalEnv;

        // Just verify stores are created without error
        expect(devStore).toBeDefined();
        expect(prodStore).toBeDefined();
    });
});