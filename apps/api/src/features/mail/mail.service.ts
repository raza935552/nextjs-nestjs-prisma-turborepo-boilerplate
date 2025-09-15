import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_NAME } from '@repo/constants/app';

/**
 * Service for sending emails using the configured mailer service.
 */
@Injectable()
export class MailService {
  /**
   * Creates an instance of MailService.
   *
   * @param {MailerService} mailerService - Service for sending emails.
   * @param {ConfigService} config - Service for accessing environment variables.
   */
  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Sends an email using the mailer service.
   *
   * @param {ISendMailOptions} mailOptions - Options for the email to be sent.
   * @returns {Promise<void>}
   */
  async sendEmail(mailOptions: ISendMailOptions): Promise<void> {
    const logger = new Logger(MailService.name);
    const hasTransport = !!this.config.get('MAIL_HOST') && !!this.config.get('MAIL_USERNAME');

    try {
      if (!hasTransport) {
        // Dev-friendly fallback: log the email instead of throwing
        logger.warn('MAIL_* env not fully configured. Logging email instead of sending.');
        logger.log({
          from: `${APP_NAME}<${this.config.get('MAIL_USERNAME') ?? 'no-reply@example.com'}>`,
          ...mailOptions,
        });
        return;
      }

      await this.mailerService.sendMail({
        from: `${APP_NAME}<${this.config.get('MAIL_USERNAME')}>`,
        ...mailOptions,
      });
    } catch (err) {
      // Never fail business logic because of email send
      logger.error('Failed to send email. Continuing without blocking.', err as Error);
    }
  }
}
