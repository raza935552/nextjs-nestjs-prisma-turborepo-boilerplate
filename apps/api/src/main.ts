import { AppModule } from '@/app.module';
import { bootstrap as configureApp } from '@/bootstrap';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
/**
 * Main entry point to bootstrap the NestJS Fastify application.
 *
 * @returns {Promise<void>} A promise that resolves when the application has started.
 */
const main = async (): Promise<void> => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
    },
  );
  app.useLogger(app.get(Logger));
  await configureApp(app);
};

/**
 * Invokes the main bootstrap function and handles any errors.
 *
 * @returns {void}
 */
main().catch((error) => {
  // Log to stderr for visibility in container/orchestrators
  // Logger may not be available here if creation failed
  console.error('Failed to start application:', error);
  process.exit(1);
});
