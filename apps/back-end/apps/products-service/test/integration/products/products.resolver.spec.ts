// test/integration/products/products.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ProductsModule } from '@modules/products/products.module';
import { AuthorizationModule } from '@modules/authorization/authorization.module';
import { DatabaseModule } from '@database/database.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '@config/configuration';

describe('ProductsResolver (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    load: [configuration],
                    isGlobal: true,
                }),
                DatabaseModule,
                GraphQLModule.forRoot<ApolloDriverConfig>({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    context: ({ req }) => ({ req }),
                }),
                ProductsModule,
                AuthorizationModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('shopProducts query', () => {
        it('should return published products', () => {
            const query = `
        query {
          shopProducts {
            items {
              id
              name
              slug
              basePrice
              isPublished
            }
            meta {
              totalItems
              currentPage
            }
          }
        }
      `;

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query })
                .expect(200)
                .expect((res) => {
                    expect(res.body.data.shopProducts).toBeDefined();
                    expect(Array.isArray(res.body.data.shopProducts.items)).toBe(true);
                });
        });

        it('should filter products by category', () => {
            const query = `
        query {
          shopProducts(filter: { categoryId: "cat-123" }) {
            items {
              id
              name
            }
          }
        }
      `;

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query })
                .expect(200);
        });
    });

    describe('adminProducts query', () => {
        it('should require authentication', () => {
            const query = `
        query {
          adminProducts {
            items {
              id
              name
              sku
              costPrice
            }
          }
        }
      `;

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query })
                .expect(200)
                .expect((res) => {
                    expect(res.body.errors).toBeDefined();
                    expect(res.body.errors[0].message).toContain('Unauthorized');
                });
        });
    });
});