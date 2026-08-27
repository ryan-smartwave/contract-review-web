'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Review queue' },
  { href: '/upload', label: 'Upload' },
  { href: '/search', label: 'Drive search' },
];

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface-raised/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            CR
          </span>
          Contract Review Agent
        </Link>
        <nav className="flex gap-1 text-sm" aria-label="Main">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  active
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-text-muted hover:bg-surface hover:text-text'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
