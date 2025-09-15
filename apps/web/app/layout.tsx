import Providers from '@/components/providers';
import { APP_NAME, APP_URL } from '@repo/constants/app';
import { cn } from '@repo/shadcn/lib/utils';
import { Metadata } from 'next';
import { Geist, Geist_Mono, Roboto, Roboto_Mono } from 'next/font/google';
import { ReactNode } from 'react';

/** Tailwindcss **/
import '@repo/shadcn/shadcn.css';
import { Toaster } from '@repo/shadcn/sonner';
import { cookies } from 'next/headers';

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-geist',
});

const geist_mono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-geist-mono',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-roboto',
});

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-roboto-mono',
});

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description:
    'Production-ready Next.js + NestJS + Prisma boilerplate. Full‑stack monorepo with JWT auth, sessions, PostgreSQL, Fastify, and TurboRepo.',
  keywords: [
    APP_NAME,
    'Next.js boilerplate',
    'NestJS boilerplate',
    'Prisma',
    'PostgreSQL',
    'TypeScript',
    'Turborepo',
    'Auth',
    'JWT',
    'Fastify',
    'Full stack starter',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: APP_NAME,
    description:
      'Next.js + NestJS + Prisma monorepo starter with auth, sessions, and PostgreSQL.',
    url: APP_URL,
    locale: 'en-US',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description:
      'Next.js + NestJS + Prisma monorepo starter with auth and PostgreSQL.',
  },
  verification: {
    google: '',
  },
  // Icons and manifest removed to keep boilerplate unbranded
} satisfies Metadata;

const RootLayout = async ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => {
  const select_font =
    (await cookies()).get('select-font')?.value ?? '--font-geist';
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'antialiased tracking-normal leading-normal',
          geist.variable,
          geist_mono.variable,
          roboto.variable,
          roboto_mono.variable,
        )}
        style={{
          fontFamily: `var(${select_font})`,
        }}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
};

export default RootLayout;
