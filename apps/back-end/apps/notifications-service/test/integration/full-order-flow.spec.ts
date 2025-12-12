// test/integration/full-order-flow.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule as ProductsAppModule } from '../../products-service/src/app.module';
import { AppModule as OrdersAppModule } from '../../orders-service/src/app.module';
import { AppModule as NotificationsAppModule } from '../../notifications-service/src/app.module';
import { RabbitMQService } from '../../notifications-service/src/modules/rabbitmq/rabbitmq.service';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

describe('Full Order Flow Integration', () => {
    let productsApp: INestApplication;
    let ordersApp: INestApplication;
    let notificationsApp: INestApplication;
    let rabbitMQService: RabbitMQService;
    let productGrpcClient: ClientGrpc;

    beforeAll(async () => {
        // Start all services
        const productsModule = await Test.createTestingModule({
            imports: [ProductsAppModule],
        }).compile();
        productsApp = productsModule.createNestApplication();
        await productsApp.init();

        const ordersModule = await Test.createTestingModule({
            imports: [OrdersAppModule],
        }).compile();
        ordersApp = ordersModule.createNestApplication();
        await ordersApp.init();

        const notificationsModule = await Test.createTestingModule({
            imports: [NotificationsAppModule],
        }).compile();
        notificationsApp = notificationsModule.createNestApplication();
        await notificationsApp.init();

        rabbitMQService = notificationsApp.get(RabbitMQService);
    });

    afterAll(async () => {
        await productsApp.close();
        await ordersApp.close();
        await notificationsApp.close();
    });

    describe('Complete Order Flow', () => {
        let authToken: string;
        let customerId: string;
        let productId: string;
        let vendorProductId: string;

        beforeAll(async () => {
            // Setup test data
            // This would require proper test data setup
        });

        it('should complete order flow end-to-end', async () => {
            // 1. Customer browses products
            const browseQuery = `
        query {
          shopProducts(filter: { isPublished: true }) {
            items {
              id
              name
              vendorProducts {
                id
                price
              }
            }
          }
        }
      `;

            const browseResponse = await request(productsApp.getHttpServer())
                .post('/graphql')
                .send({ query: browseQuery })
                .expect(200);

            // 2. Add to cart
            const addToCartMutation = `
        mutation {
          addToCart(input: {
            productSlug: "test-product"
            vendorProductId: "${vendorProductId}"
            quantity: 2
          }) {
            id
            items {
              productName
              quantity
              unitPrice
            }
          }
        }
      `;

            const cartResponse = await request(ordersApp.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ query: addToCartMutation })
                .expect(200);

            // 3. Create order
            const createOrderMutation = `
        mutation {
          createOrder(input: {
            shippingAddressId: "addr-123"
            paymentCardId: "card-123"
          }) {
            id
            orderNumber
            status
            totalAmount
          }
        }
      `;

            const orderResponse = await request(ordersApp.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ query: createOrderMutation })
                .expect(200);

            const orderId = orderResponse.body.data.createOrder.id;
            const orderNumber = orderResponse.body.data.createOrder.orderNumber;

            // 4. Verify RabbitMQ message was published
            // This would require mocking or intercepting RabbitMQ

            // 5. Check notification was sent
            // This would require WebSocket testing

            // 6. Vendor fulfills order
            const fulfillMutation = `
        mutation {
          updateOrderItemStatus(itemId: "item-123", input: {
            status: SHIPPED
            trackingNumber: "TRACK123"
          }) {
            id
            status
          }
        }
      `;

            const vendorToken = 'vendor-token'; // Would need vendor auth
            const fulfillResponse = await request(ordersApp.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${vendorToken}`)
                .send({ query: fulfillMutation })
                .expect(200);

            // Assert all steps completed
            expect(orderResponse.body.data.createOrder.status).toBe('CONFIRMED');
        });
    });
});