import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { MoodProvider } from '@/lib/mood-context';
import { AvatarProvider } from '@/lib/avatar-context';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LifeOS - 生命操作系统',
  description: '整合身体、心灵与认知的综合生命管理系统',
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <MoodProvider>
            <AvatarProvider>
              {children}
              <Toaster />
            </AvatarProvider>
          </MoodProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
