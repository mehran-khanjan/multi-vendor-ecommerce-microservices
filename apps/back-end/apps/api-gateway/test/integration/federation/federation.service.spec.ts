import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { FederationService } from '@federation/federation.service';

describe('FederationService Integration', () => {
    let service: FederationService;
    let httpService: HttpService;
    let configService: ConfigService;

    const mockSubgraphs = [
        {
            name: 'auth',
            url: 'http://localhost:4001/graphql',
            timeout: 10000,
            healthPath: '/health',
        },
        {
            name: 'users',
            url: 'http://localhost:4002/graphql',
            timeout: 10000,
            healthPath: '/health',
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    load: [
                        () => ({
                            services: {
                                subgraphs: mockSubgraphs,
                            },
                            app: {
                                health: {
                                    subgraphTimeout: 5000,
                                },
                            },
                        }),
                    ],
                }),
                HttpModule,
            ],
            providers: [FederationService],
        }).compile();

        service = module.get<FederationService>(FederationService);
        httpService = module.get<HttpService>(HttpService);
        configService = module.get<ConfigService>(ConfigService);
    });

    describe('checkSubgraphHealth', () => {
        it('should return healthy status when health endpoint responds', async () => {
            const subgraph = mockSubgraphs[0];
            const mockResponse: AxiosResponse = {
                data: { status: 'ok' },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as any,
            };

            jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

            const result = await service.checkSubgraphHealth(subgraph);

            expect(result).toEqual({
                name: subgraph.name,
                url: subgraph.url,
                status: 'healthy',
                latency: expect.any(Number),
                lastChecked: expect.any(Date),
            });
            expect(httpService.get).toHaveBeenCalledWith(
                'http://localhost:4001/health',
                { timeout: 5000 }
            );
        });

        it('should fallback to GraphQL introspection when health endpoint fails', async () => {
            const subgraph = mockSubgraphs[0];
            const mockHealthError = { message: 'Health endpoint unavailable' };
            const mockIntrospectionResponse: AxiosResponse = {
                data: { data: { __typename: 'Query' } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as any,
            };

            jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => mockHealthError));
            jest.spyOn(httpService, 'post').mockReturnValue(of(mockIntrospectionResponse));

            const result = await service.checkSubgraphHealth(subgraph);

            expect(result.status).toBe('healthy');
            expect(httpService.post).toHaveBeenCalledWith(
                subgraph.url,
                { query: '{ __typename }' },
                { timeout: 5000 }
            );
        });

        it('should return unhealthy when both health and introspection fail', async () => {
            const subgraph = mockSubgraphs[0];
            const mockError = { message: 'Connection refused' };

            jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => mockError));
            jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => mockError));

            const result = await service.checkSubgraphHealth(subgraph);

            expect(result.status).toBe('unhealthy');
            expect(result.error).toBe(mockError.message);
        });

        it('should handle URL parsing errors gracefully', async () => {
            const invalidSubgraph = {
                ...mockSubgraphs[0],
                url: 'invalid-url',
            };

            const result = await service.checkSubgraphHealth(invalidSubgraph);

            expect(result.status).toBe('unhealthy');
            expect(result.error).toBeDefined();
        });
    });

    describe('checkAllSubgraphsHealth', () => {
        it('should check all subgraphs and cache results', async () => {
            const mockResponses = mockSubgraphs.map((subgraph) => ({
                name: subgraph.name,
                url: subgraph.url,
                status: 'healthy',
                latency: 100,
                lastChecked: new Date(),
            }));

            jest.spyOn(service, 'checkSubgraphHealth')
                .mockResolvedValueOnce(mockResponses[0])
                .mockResolvedValueOnce(mockResponses[1]);

            const results = await service.checkAllSubgraphsHealth();

            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('auth');
            expect(results[1].name).toBe('users');
            expect(service.checkSubgraphHealth).toHaveBeenCalledTimes(2);
        });
    });

    describe('getCachedHealth', () => {
        it('should return cached health status', async () => {
            const mockHealthStatus = {
                name: 'auth',
                url: 'http://localhost:4001/graphql',
                status: 'healthy',
                latency: 50,
                lastChecked: new Date(),
            };

            // Manually set cache
            (service as any).healthCache.set('auth', mockHealthStatus);

            const cached = service.getCachedHealth();

            expect(cached).toHaveLength(1);
            expect(cached[0]).toEqual(mockHealthStatus);
        });
    });

    describe('isHealthy', () => {
        it('should return true when all services are healthy', () => {
            const healthyStatus = {
                name: 'auth',
                url: 'http://localhost:4001/graphql',
                status: 'healthy',
                latency: 50,
                lastChecked: new Date(),
            };

            (service as any).healthCache.set('auth', healthyStatus);

            expect(service.isHealthy()).toBe(true);
        });

        it('should return false when any service is unhealthy', () => {
            const unhealthyStatus = {
                name: 'auth',
                url: 'http://localhost:4001/graphql',
                status: 'unhealthy',
                latency: 50,
                lastChecked: new Date(),
                error: 'Connection failed',
            };

            (service as any).healthCache.set('auth', unhealthyStatus);

            expect(service.isHealthy()).toBe(false);
        });

        it('should return false when cache is empty', () => {
            (service as any).healthCache.clear();
            expect(service.isHealthy()).toBe(false);
        });
    });

    describe('getUnhealthyServices', () => {
        it('should return only unhealthy services', () => {
            const healthyStatus = {
                name: 'auth',
                url: 'http://localhost:4001/graphql',
                status: 'healthy',
                latency: 50,
                lastChecked: new Date(),
            };

            const unhealthyStatus = {
                name: 'users',
                url: 'http://localhost:4002/graphql',
                status: 'unhealthy',
                latency: 50,
                lastChecked: new Date(),
                error: 'Connection failed',
            };

            (service as any).healthCache.set('auth', healthyStatus);
            (service as any).healthCache.set('users', unhealthyStatus);

            const unhealthy = service.getUnhealthyServices();

            expect(unhealthy).toHaveLength(1);
            expect(unhealthy[0].name).toBe('users');
        });
    });
});