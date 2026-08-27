import { Inter } from 'next/font/google';
import { AppHeader } from '@/components/layout/app-header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = { title: 'Contract Review Agent' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
