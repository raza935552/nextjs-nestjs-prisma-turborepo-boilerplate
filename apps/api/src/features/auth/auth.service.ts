import {
  AuthTokensInterface,
  LoginUserInterface,
  RefreshTokenInterface,
  RegisterUserInterface,
} from '@/common/interfaces';
import {
  Env,
  extractName,
  generateOTP,
  generateRefreshTime,
  hashString,
  validateString,
} from '@/common/utils';
import { TransactionService } from '@/database';
import { PrismaService } from '@/database/prisma.service';
import {
  ChangePasswordDto,
  ConfirmEmailDto,
  CreateUserDto,
  DeleteUserDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SignInUserDto,
  SignOutAllDeviceUserDto,
  SignOutUserDto,
  ValidateUserDto,
} from '@/features/auth/dto';
// TypeORM entities removed in favor of Prisma
import { MailService } from '@/features/mail/mail.service';
import {
  ChangePasswordSuccessMail,
  ConfirmEmailSuccessMail,
  RegisterSuccessMail,
  ResetPasswordMail,
  SignInSuccessMail,
} from '@/features/mail/templates';
// TypeORM entities removed in favor of Prisma
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';
import { Prisma } from '@prisma/client';

/**
 * Service for handling authentication, registration, session, and user security logic.
 */
@Injectable()
export class AuthService {
  /**
   * Creates an instance of AuthService.
   *
   * @param {JwtService} jwtService - JWT service for token operations.
   * @param {ConfigService<Env>} config - Configuration service for environment variables.
   * @param {Repository<User>} UserRepository - Repository for user entities.
   * @param {Repository<Profile>} profileRepository - Repository for profile entities.
   * @param {Repository<Session>} SessionRepository - Repository for session entities.
   * @param {Repository<Otp>} OtpRepository - Repository for OTP entities.
   * @param {TransactionService} transactionService - TransactionService to run typeorm query
   * @param {MailService} mailService - Service for sending emails.
   * @param {Logger} logger - Logger instance.
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env>,
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly mailService: MailService,
    private readonly logger: Logger,
  ) {}

  /**
   * Generates access and refresh tokens for a user.
   *
   * @param {User} user - User entity.
   * @returns {Promise<AuthTokensInterface>} Object containing access and refresh tokens.
   */
  async generateTokens(user: { id: string; email: string; username: string }): Promise<AuthTokensInterface> {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        {
          username: user.username,
          email: user.email,
          id: user.id,
        },
        {
          secret: this.config.get('ACCESS_TOKEN_SECRET'),
          expiresIn: this.config.get('ACCESS_TOKEN_EXPIRATION'),
        },
      ),
      this.jwtService.signAsync(
        {
          username: user.username,
          email: user.email,
          id: user.id,
        },
        {
          secret: this.config.get('REFRESH_TOKEN_SECRET'),
          expiresIn: this.config.get('REFRESH_TOKEN_EXPIRATION'),
        },
      ),
    ]);
    return {
      access_token,
      refresh_token,
    };
  }

  /**
   * Finds a user by email address.
   *
   * @param {string} email - The email address to search for.
   * @returns {Promise<User | null>} The user if found, null otherwise.
   */
  async findUserByEmail(email: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  /**
   * Validates a user with identifier and password.
   *
   * @param {ValidateUserDto} dto - Validation DTO containing identifier and password.
   * @returns {Promise<User>} The validated user entity.
   * @throws {NotFoundException} If user is not found.
   * @throws {UnauthorizedException} If credentials are invalid.
   */
  async validateUser(dto: ValidateUserDto): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { username: dto.identifier }],
      },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const isValid = await validateString(dto.password, user.password ?? '');
    if (!isValid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  /**
   * Registers a new user account with email and password.
   *
   * @param {CreateUserDto} createUserDto - Data for creating a new user.
   * @returns {Promise<RegisterUserInterface>} Registered user data.
   * @throws {BadRequestException} If registration fails.
   */
  async register(createUserDto: CreateUserDto): Promise<RegisterUserInterface> {
    this.logger.log(`Starting registration for email: ${createUserDto.email}`);
    const email_confirmation_otp = await generateOTP();
    
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const username = createUserDto.email.split('@')[0];
        const password = createUserDto.password
          ? await hashString(createUserDto.password)
          : null;

        const user = await tx.user.create({
          data: {
            email: createUserDto.email,
            username,
            // allow null password for social accounts
            password: password as any,
          },
        });

        const profile = await tx.profile.create({
          data: {
            userId: user.id,
            name: extractName(createUserDto.email),
          },
        });

        const otp = await tx.otp.create({
          data: {
            otp: email_confirmation_otp,
            type: 'EMAIL_CONFIRMATION',
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
          },
        });

        return { user, profile, otp };
      });
    
      // Try to send email, but don't fail registration if email fails
      // Try to send email, but don't fail registration if email fails
      this.mailService.sendEmail({
        to: [result.user.email],
        subject: 'Confirm your email',
        html: RegisterSuccessMail({
          name: result.profile.name,
          otp: email_confirmation_otp,
        }),
      })
      .then(() => {
        this.logger.log(`Email sent successfully to: ${result.user.email}`);
      })
      .catch((emailError) => {
        this.logger.error(`Failed to send email to ${result.user.email}:`, emailError);
        // Don't throw here - registration was successful, just email failed
        // In production, you might want to queue this for retry
      });

      this.logger.log(`User registered successfully: ${result.user.email}`);
      return { data: result.user as any };
    } catch (error) {
      this.logger.error(`Registration failed for ${createUserDto.email}:`, error);
      
      // Handle specific database errors
      if (
        error &&
        (error as any).code === 'P2002'
      ) {
        const meta = (error as Prisma.PrismaClientKnownRequestError).meta as any;
        const target: string[] | undefined = meta?.target;
        if (target?.includes('email')) {
          throw new ConflictException('Email is already registered. Please use a different email or sign in.');
        }
        if (target?.includes('username')) {
          throw new ConflictException('Username is already taken. Please choose a different username.');
        }
        throw new ConflictException('User already exists. Please sign in instead.');
      }
      
      throw new BadRequestException('Registration failed. Please try again.');
    }
  }

  /**
   * Signs in a user account.
   *
   * @param {SignInUserDto} dto - Sign-in DTO.
   * @returns {Promise<LoginUserInterface>} Login response with user data and tokens.
   */
  async signIn(dto: SignInUserDto): Promise<LoginUserInterface> {
    const user = await this.validateUser(dto);
    const tokens = await this.generateTokens(user);
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refresh_token,
        ip: dto.ip ?? 'unknown',
        device_name: dto.device_name ?? 'unknown',
        device_os: dto.device_os ?? 'unknown',
        browser: dto.browser ?? 'unknown',
        location: dto.location ?? 'unknown',
        userAgent: dto.userAgent ?? 'unknown',
      },
    });
    await this.mailService.sendEmail({
      to: [user.email],
      subject: 'SignIn with your email',
      html: SignInSuccessMail({
        username: user.profile?.name ?? user.username,
        loginTime: session.createdAt,
        ipAddress: session.ip ?? 'unknown',
        location: session.location ?? 'unknown',
        device: session.device_name ?? 'unknown',
      }),
    });
    const session_refresh_time = await generateRefreshTime();
    return {
      data: user,
      tokens: { ...tokens, session_token: session.id, session_refresh_time },
    };
  }

  /**
   * Confirms the user's email account.
   *
   * @param {ConfirmEmailDto} dto - Confirmation DTO.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If user or OTP is not found.
   * @throws {BadRequestException} If the confirmation code is invalid or expired.
   */
  async confirmEmail(dto: ConfirmEmailDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const otp = await this.prisma.otp.findFirst({
      where: { otp: dto.token, type: 'EMAIL_CONFIRMATION' },
    });
    if (!otp) throw new NotFoundException('Invalid confirmation code');
    if (otp.otp !== dto.token)
      throw new BadRequestException('Invalid confirmation code');
    if (otp.expires && new Date(otp.expires) < new Date())
      throw new BadRequestException('Email confirm token expired');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.otp.delete({ where: { id: otp.id } }),
    ]);
    await this.mailService.sendEmail({
      to: [user.email],
      subject: 'Confirmation Successful',
      html: ConfirmEmailSuccessMail({
        name: user.profile?.name ?? user.username,
      }),
    });
  }

  /**
   * Sends a password reset token to the user's email.
   *
   * @param {ForgotPasswordDto} dto - Forgot password DTO.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If user is not found.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.identifier }, { username: dto.identifier }] },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const passwordResetToken = await generateOTP();
    await this.prisma.otp.create({
      data: {
        otp: passwordResetToken,
        type: 'PASSWORD_RESET',
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    await this.mailService.sendEmail({
      to: [user.email],
      subject: 'Reset your password',
      html: ResetPasswordMail({
        name: user.profile?.name ?? user.username,
        code: passwordResetToken,
      }),
    });
  }

  /**
   * Resets the user's password using a reset token.
   *
   * @param {ResetPasswordDto} dto - Reset password DTO.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If user or OTP is not found.
   * @throws {BadRequestException} If the reset token is invalid or expired.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.identifier }, { username: dto.identifier }] },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const otp = await this.prisma.otp.findFirst({
      where: { otp: dto.resetToken, type: 'PASSWORD_RESET' },
    });
    if (!otp) throw new NotFoundException('Invalid password reset token');
    if (otp.otp !== dto.resetToken)
      throw new BadRequestException('Invalid password reset token');
    if (otp.otp && new Date() > otp.expires)
      throw new BadRequestException('Password reset token expired');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: await hashString(dto.newPassword) },
      }),
      this.prisma.otp.delete({ where: { id: otp.id } }),
    ]);
    await this.mailService.sendEmail({
      to: [user.email],
      subject: 'Password Reset Successful',
      html: ChangePasswordSuccessMail({
        name: user.profile?.name ?? user.username,
      }),
    });
  }

  /**
   * Changes the user's password.
   *
   * @param {ChangePasswordDto} dto - Change password DTO.
   * @returns {Promise<void>}
   */
  async changePassword(dto: ChangePasswordDto): Promise<void> {
    const user = await this.validateUser(dto);
    const newHashed = await hashString(dto.newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: newHashed },
    });
    await this.mailService.sendEmail({
      to: [user.email],
      subject: 'Password Change Successful',
      html: ChangePasswordSuccessMail({
        name: user.profile.name,
      }),
    });
  }

  /**
   * Signs out the user from the current session.
   *
   * @param {SignOutUserDto} dto - Sign out DTO.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If session is not found.
   */
  async signOut(dto: SignOutUserDto): Promise<void> {
    const session = await this.prisma.session.findUnique({ where: { id: dto.session_token } });
    if (!session) throw new NotFoundException('Session not found');
    await this.prisma.session.delete({ where: { id: dto.session_token } });
  }

  /**
   * Signs out the user from all devices by user ID.
   *
   * @param {SignOutAllDeviceUserDto} dto - Sign out all devices DTO.
   * @returns {Promise<void>}
   */
  async signOutAllDevices(dto: SignOutAllDeviceUserDto): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId: dto.userId } });
  }

  /**
   * Refreshes the user's access token.
   *
   * @param {RefreshTokenDto} dto - Refresh token DTO.
   * @returns {Promise<RefreshTokenInterface>} New tokens and session info.
   * @throws {NotFoundException} If user or session is not found.
   */
  async refreshToken(dto: RefreshTokenDto): Promise<RefreshTokenInterface> {
    const user = await this.prisma.user.findUnique({ where: { id: dto.user_id } });
    if (!user) throw new NotFoundException('User not found');
    const { access_token, refresh_token } = await this.generateTokens(user);
    const session = await this.prisma.session.findFirst({
      where: { id: dto.session_token, userId: dto.user_id },
    });
    if (!session) throw new NotFoundException('Session not found');
    const access_token_refresh_time = await generateRefreshTime();
    await this.prisma.session.update({
      where: { id: dto.session_token },
      data: { refreshToken: refresh_token },
    });
    return {
      access_token,
      refresh_token,
      session_token: dto.session_token,
      access_token_refresh_time,
    };
  }

  /**
   * Retrieves all sessions for a user by user ID.
   *
   * @param {string} userId - User ID.
   * @returns {Promise<Session[]>} List of sessions.
   */
  async getSessions(userId: string): Promise<any[]> {
    return this.prisma.session.findMany({ where: { userId } });
  }

  /**
   * Retrieves a session by session ID.
   *
   * @param {string} id - Session ID.
   * @returns {Promise<Session>} Session entity.
   * @throws {NotFoundException} If session is not found.
   */
  async getSession(id: string): Promise<any> {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found!');
    return session;
  }

  /**
   * Deletes a user account.
   *
   * @param {DeleteUserDto} dto - Delete user DTO.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If user is not found.
   * @throws {BadRequestException} If credentials are invalid or deletion fails.
   */
  async deleteAccount(dto: DeleteUserDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: dto.user_id } });
    if (!user) throw new NotFoundException('User not found');
    const isValidPassword = await validateString(dto.password, user.password ?? '');
    if (!isValidPassword) throw new BadRequestException('Invalid credentials');
    try {
      await this.prisma.user.delete({ where: { id: user.id } });
    } catch (e) {
      // Prisma unique constraint etc
      throw new BadRequestException(e);
    }
  }
}
