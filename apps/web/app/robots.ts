import { APP_URL } from '@repo/constants/app';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}

