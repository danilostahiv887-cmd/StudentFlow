'use client';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="icon-button"
      aria-label="Вийти"
      type="button"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
      }}
    >
      <LogOut size={17} />
    </button>
  );
}
