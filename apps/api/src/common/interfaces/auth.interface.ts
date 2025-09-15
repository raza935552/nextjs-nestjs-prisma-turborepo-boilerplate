type ProfileData = {
  id: string;
  userId: string;
  name: string;
  gender?: string | null;
  phoneNumber?: string | null;
  profilePicture?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
};

export type UserData = {
  id: string;
  email: string;
  username: string;
  isEmailVerified?: boolean | null;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile?: ProfileData | null;
};

export type SessionData = {
  id: string;
  userId: string;
  refreshToken: string;
  ip?: string | null;
  location?: string | null;
  device_os?: string | null;
  device_name?: string | null;
  device_type?: string | null;
  browser?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Sign in or generic message response.
 *
 * @property {string} message - Response message.
 */
export interface MessageResponse {
  message: string;
}

/**
 * Sign in response containing user data and authentication tokens.
 *
 * @property {string} message - Response message.
 * @property {Omit<User, 'password' | 'sessions' | 'generateUserInfo'>} data - User data excluding sensitive fields.
 * @property {{ access_token: string; refresh_token: string }} tokens - Authentication tokens.
 */
export interface SignInResponse {
  message: string;
  data: UserData;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * Response containing an array of session entities.
 *
 * @property {Session[]} data - List of session entities.
 */
export interface SessionsResponse {
  data: SessionData[];
}

/**
 * Response containing a single session entity.
 *
 * @property {Session} data - Session entity.
 */
export interface SessionResponse {
  data: SessionData;
}

/**
 * Response for refresh token operation.
 *
 * @property {string} message - Response message.
 * @property {string} access_token - New access token.
 * @property {string} refresh_token - New refresh token.
 * @property {string} access_token_refresh_time - Access token expiration or refresh time.
 * @property {string} session_token - Session token.
 */
export interface RefreshTokenResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  access_token_refresh_time: string;
  session_token: string;
}

/**
 * Interface for authentication tokens.
 *
 * @property {string} access_token - Access token.
 * @property {string} refresh_token - Refresh token.
 */
export interface AuthTokensInterface {
  access_token: string;
  refresh_token: string;
}

/**
 * Interface for login user response.
 *
 * @property {User} data - User entity.
 * @property {{
 *   session_token: string;
 *   access_token: string;
 *   refresh_token: string;
 *   session_refresh_time: string;
 * }} tokens - Authentication and session tokens.
 */
export interface LoginUserInterface {
  data: UserData;
  tokens: {
    session_token: string;
    access_token: string;
    refresh_token: string;
    session_refresh_time: string;
  };
}

/**
 * Interface for refresh token details.
 *
 * @property {string} access_token - Access token.
 * @property {string} refresh_token - Refresh token.
 * @property {string} access_token_refresh_time - Access token refresh time.
 * @property {string} session_token - Session token.
 */
export interface RefreshTokenInterface {
  access_token: string;
  refresh_token: string;
  access_token_refresh_time: string;
  session_token: string;
}

/**
 * Interface for register user response.
 *
 * @property {User} data - Registered user entity.
 */
export interface RegisterUserInterface {
  data: UserData;
}
