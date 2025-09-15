import { Env } from '@/common/utils';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Module for configuring and providing the Nodemailer-based mailer service.
 *
 * Sets up the mail transport using environment variables for host, username, and password.
 * Integrates with NestJS ConfigModule for dynamic configuration.
 */


@Module({
  
  imports: [
    MailerModule.forRootAsync({

      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env>) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: 25,
          secure: false, // true for 465, false for other ports
          auth: {
            user: config.get('MAIL_USERNAME'),
            pass: config.get('MAIL_PASSWORD'),
          },
          tls: {
            rejectUnauthorized: false, // Allow self-signed certificates
          },
        },
        defaults: {
          from: `"${config.get('MAIL_FROM_NAME')}" <${config.get('MAIL_FROM_ADDRESS')}>`,
        },
      }),
    }),
  ],
})
export class NodeMailerModule {}
