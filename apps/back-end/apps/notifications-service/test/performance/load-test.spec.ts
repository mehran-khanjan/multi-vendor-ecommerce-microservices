// test/performance/load-test.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ProductsModule } from '../../products-service/src/modules/products/products.module';
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseModule } from '../../products-service/src/database/database.module';
import { performance } from 'perf_hooks';

describe('Products Service Load Tests', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                CacheModule.register({ isGlobal: true }),
                DatabaseModule,
                ProductsModule,
            ],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('High Concurrency Tests', () => {
        it('should handle 100 concurrent product reads', async () => {
            const concurrentRequests = 100;
            const query = `
        query {
          shopProducts(limit: 10) {
            items {
              id
              name
              basePrice
            }
            meta {
              totalItems
            }
          }
        }
      `;

            const startTime = performance.now();
            const requests = Array(concurrentRequests).fill(null).map(() =>
                request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query })
                    .expect(200)
            );

            const responses = await Promise.all(requests);
            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // All requests should succeed
            responses.forEach((response) => {
                expect(response.status).toBe(200);
                expect(response.body.data).toBeDefined();
            });

            console.log(`Processed ${concurrentRequests} requests in ${totalTime}ms`);
            console.log(`Average response time: ${totalTime / concurrentRequests}ms`);
            expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
        });

        it('should handle rapid-fire cart operations', async () => {
            const operations = 50;
            const query = `
        mutation {
          addToCart(input: {
            productSlug: "test-product"
            vendorProductId: "vp-123"
            quantity: 1
          }) {
            id
            items {
              productName
              quantity
            }
          }
        }
      `;

            const startTime = performance.now();
            const successfulOps: number[] = [];
            const failedOps: number[] = [];

            for (let i = 0; i < operations; i++) {
                try {
                    const response = await request(app.getHttpServer())
                        .post('/graphql')
                        .send({ query })
                        .expect(200);
                    successfulOps.push(i);
                } catch (error) {
                    failedOps.push(i);
                }
            }

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            console.log(`Completed ${successfulOps.length} successful operations out of ${operations}`);
            console.log(`Total time: ${totalTime}ms`);
            console.log(`Success rate: ${(successfulOps.length / operations) * 100}%`);

            expect(successfulOps.length).toBeGreaterThan(operations * 0.9); // 90% success rate
        });
    });

    describe('Memory Leak Tests