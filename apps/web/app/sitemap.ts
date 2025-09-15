import { APP_URL } from '@repo/constants/app';

export default async function sitemap() {
  const base = APP_URL.replace(/\/$/, '');
  const routes = ['/', '/auth/sign-in', '/auth/sign-up', '/auth/confirm-email'];
  return routes.map((route) => ({ url: `${base}${route}`, changefreq: 'weekly', priority: route === '/' ? 1.0 : 0.6 }));
}

