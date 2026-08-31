import { Fira_Code, Plus_Jakarta_Sans } from 'next/font/google';
import { AppHeader } from '@/components/layout/app-header';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });

export const metadata = {
  title: 'Contract Review Agent',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${firaCode.variable}`}>
      <body className="font-sans">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
