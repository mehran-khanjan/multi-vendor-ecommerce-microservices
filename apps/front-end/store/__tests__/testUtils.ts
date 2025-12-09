// store/__tests__/testUtils.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Mock fetch for RTK Query tests
global.fetch = jest.fn() as jest.Mock;
const fetchMock = global.fetch as jest.Mock;

// Setup store utility for API testing
export const setupApiStore = (api: any, preloadedState?: any) => {
    const store = configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            ...(preloadedState ?
                    Object.keys(preloadedState).reduce((acc, key) => {
                        acc[key] = (state = preloadedState[key]) => state;
                        return acc;
                    }, {} as any) : {}
            )
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(api.middleware),
        preloadedState
    });

    setupListeners(store.dispatch);
    return store;
};

// Mock localStorage
export const mockLocalStorage = () => {
    const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0
    };

    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
    });

    return localStorageMock;
};

// Mock crypto.randomUUID
export const mockCrypto = () => {
    Object.defineProperty(global, 'crypto', {
        value: {
            randomUUID: jest.fn(() => 'mocked-uuid')
        },
        writable: true
    });
};

// Reset all mocks
export const resetAllMocks = () => {
    fetchMock.mockReset();
    jest.clearAllMocks();
    localStorage.clear();
};

export { fetchMock };