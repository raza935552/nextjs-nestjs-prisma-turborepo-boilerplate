import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Sets up Swagger API documentation for the application.
 *
 * @param {NestFastifyApplication} app - The NestJS Fastify application instance.
 * @returns {Promise<void>} A promise that resolves when Swagger is set up.
 */
export const swagger = async (app: NestFastifyApplication): Promise<void> => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Next + Nest Prisma Boilerplate API')
    .setDescription('API documentation for the boilerplate. Import /openapi.json into Postman')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // In development, expose Swagger UI and JSON via Nest Swagger
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api-docs', app, document, {
      jsonDocumentUrl: 'openapi.json',
    });
  } else {
    // In production, expose only the raw OpenAPI JSON
    const fastify = app.getHttpAdapter().getInstance();
    fastify.get('/openapi.json', async (_req, reply) => {
      reply.header('Content-Type', 'application/json; charset=utf-8').send(document);
    });
  }
};
