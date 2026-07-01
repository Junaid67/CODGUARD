import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CONSTANTS } from './app.constants';

/**
 * Configures Swagger/OpenAPI docs. Only mounted outside of production
 * (see main.ts). Auth is via Shopify session token (Bearer) + shop domain header.
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle(`${CONSTANTS.APP_NAME} API`)
    .setDescription('COD Risk Scorer Shopify app API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Shopify session token',
      },
      'shopify-session',
    )
    .addApiKey(
      { type: 'apiKey', name: 'x-shopify-shop-domain', in: 'header' },
      'shop-domain',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(CONSTANTS.SWAGGER_PATH, app, document);
}
