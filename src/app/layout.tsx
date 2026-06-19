import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';
import '@/app/contrast-fixes.css';
import '@/app/route-refactor.css';
import { AppShell } from '@/components/layout/app-shell';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'), title: { default: 'StudentFlow — маршрут розвитку', template: '%s · StudentFlow' }, description: 'Маршрути розвитку, докази та студентське портфоліо.', icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' }, manifest: '/site.webmanifest', openGraph: { title: 'StudentFlow', description: 'Маршрути розвитку, докази та студентське портфоліо.', images: [{ url: '/og-preview.png', width: 1680, height: 945 }] } };
export const viewport: Viewport = { themeColor: '#191b1f' };
export const dynamic = 'force-dynamic';
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="uk" data-scroll-behavior="smooth"><body><ToastProvider><AppShell>{children}</AppShell></ToastProvider></body></html>; }
