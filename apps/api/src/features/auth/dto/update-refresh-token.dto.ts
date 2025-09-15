import { SessionData } from '@/common/interfaces';

export class UpdateRefreshTokenDto {
  session: SessionData;
  refresh_token: string;
}
