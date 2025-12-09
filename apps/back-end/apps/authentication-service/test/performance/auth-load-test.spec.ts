import * as autocannon from 'autocannon';
import { start, done } from 'autocannon';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

describe('Authentication Service Performance', () => {
    const baseUrl = 'http://localhost:4001';
    let authToken: string;

    beforeAll(async () => {
        // Ensure service is running
        await waitForService(baseUrl);

        // Get auth token for authenticated tests
        authToken = await getAuthToken();
    }, 30000);

    describe('Public Endpoints Load Test', () => {
        it('should handle high volume of health check requests', async () => {
            const instance = autocannon({
                url: `${baseUrl}/health/live`,
                connections: 50,
                duration: 30,
                requests: [
                    {
                        method: 'GET',
                        path: '/health/live',
                    },
                ],
            });

            const result = await promisify(instance.on)('done');

            console.log('Health Check Load Test Results:');
            console.log(`Requests/sec: ${result.requests.average}`);
            console.log(`Latency (avg): ${result.latency.average}ms`);
            console.log(`Errors: ${result.errors}`);

            expect(result.errors).toBe(0);
            expect(result.requests.average).toBeGreaterThan(100); // Minimum 100 req/sec
            expect(result.latency.average).toBeLessThan(100); // Less than 100ms avg latency
        });

        it('should handle concurrent registration requests', async () => {
            const requests = Array.from({ length: 100 }, (_, i) => ({
                method: 'POST',
                path: '/graphql',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
            mutation Register($input: RegisterInput!) {
              register(input: $input) {
                accessToken
                user { id email }
              }
            }
          `,
                    variables: {
                        input: {
                            email: `test${Date.now() + i}@example.com`,
                            password: 'SecurePass123!',
                            firstName: 'Load',
                            lastName: `Test${i}`,
                        },
                    },
                }),
            }));

            const instance = autocannon({
                url: baseUrl,
                connections: 20,
                duration: 60,
                requests,
            });

            const result = await promisify(instance.on)('done');

            console.log('Registration Load Test Results:');
            console.log(`Total Requests: ${result.requests.total}`);
            console.log(`Requests/sec: ${result.requests.average}`);
            console.log(`2xx Responses: ${result['2xx']}`);
            console.log(`4xx/5xx Responses: ${result['4xx'] + result['5xx']}`);

            expect(result['4xx'] + result['5xx']).toBeLessThan(result['2xx'] * 0.1); // Less than 10% errors
        });
    });

    describe('Authenticated Endpoints Load Test', () => {
        it('should handle high volume of token validation requests', async () => {
            const instance = autocannon({
                url: baseUrl,
                connections: 30,
                duration: 30,
                requests: [
                    {
                        method: 'POST',
                        path: '/graphql',
                        headers: {
                            'content-type': 'application/json',
                            'authorization': `Bearer ${authToken}`,
                        },
                        body: JSON.stringify({
                            query: `
                query Me {
                  me {
                    id
                    email
                    firstName
                    lastName
                  }
                }
              `,
                        }),
                    },
                ],
            });

            const result = await promisify(instance.on)('done');

            console.log('Token Validation Load Test Results:');
            console.log(`Requests/sec: ${result.requests.average}`);
            console.log(`Latency (p95): ${result.latency.p95}ms`);
            console.log(`Errors: ${result.errors}`);

            expect(result.errors).toBe(0);
            expect(result.latency.p95).toBeLessThan(200); // 95% under 200ms
        });

        it('should handle mixed workload of authenticated requests', async () => {
            const requests = [
                {
                    method: 'POST',
                    path: '/graphql',
                    headers: {
                        'content-type': 'application/json',
                        'authorization': `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        query: `
              query Me {
                me {
                  id
                  email
                }
              }
            `,
                    }),
                },
                {
                    method: 'POST',
                    path: '/graphql',
                    headers: {
                        'content-type': 'application/json',
                        'authorization': `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        query: `
              mutation UpdateProfile($input: UpdateProfileInput!) {
                updateProfile(input: $input) {
                  id
                  bio
                }
              }
            `,
                        variables: {
                            input: {
                                bio: 'Updated bio from load test',
                            },
                        },
                    }),
                },
            ];

            const instance = autocannon({
                url: baseUrl,
                connections: 10,
                duration: 60,
                requests,
            });

            const result = await promisify(instance.on)('done');

            console.log('Mixed Workload Load Test Results:');
            console.log(`Total Requests: ${result.requests.total}`);
            console.log(`Throughput: ${result.throughput.average} bytes/sec`);
            console.log(`Error Rate: ${((result['4xx'] + result['5xx']) / result.requests.total * 100).toFixed(2)}%`);

            expect((result['4xx'] + result['5xx']) / result.requests.total).toBeLessThan(0.05); // Less than 5% error rate
        });
    });

    describe('Database Connection Pool Stress Test', () => {
        it('should handle maximum database connections', async () => {
            const instance = autocannon({
                url: baseUrl,
                connections: 100, // High connection count
                duration: 45,
                requests: [
                    {
                        method: 'POST',
                        path: '/graphql',
                        headers: {
                            'content-type': 'application/json',
                        },
                        body: JSON.stringify({
                            query: `
                query {
                  __typename
                }
              `,
                        }),
                    },
                ],
            });

            const result = await promisify(instance.on)('done');

            console.log('Database Connection Stress Test Results:');
            console.log(`Connection Errors: ${result.errors}`);
            console.log(`Timeouts: ${result.timeouts}`);
            console.log(`Requests Completed: ${result.requests.total}`);

            expect(result.timeouts).toBe(0);
            expect(result.errors).toBeLessThan(result.requests.total * 0.01); // Less than 1% errors
        });
    });

    // Helper functions
    async function waitForService(url: string): Promise<void> {
        const maxAttempts = 30;
        const delay = 1000;

        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(`${url}/health/live`);
                if (response.ok) {
                    console.log(`Service at ${url} is ready`);
                    return;
                }
            } catch {
                // Service not ready yet
            }

            if (i < maxAttempts - 1) {
                console.log(`Waiting for service at ${url}... (attempt ${i + 1}/${maxAttempts})`);
                await sleep(delay);
            }
        }

        throw new Error(`Service at ${url} did not become ready within ${maxAttempts} attempts`);
    }

    async function getAuthToken(): Promise<string> {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              ... on AuthResponse {
                accessToken
              }
            }
          }
        `,
                variables: {
                    input: {
                        email: 'test@example.com',
                        password: 'SecurePass123!',
                    },
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get auth token');
        }

        const result = await response.json();
        return result.data.login.accessToken;
    }
}, 120000); // 2 minute timeout for performance tests