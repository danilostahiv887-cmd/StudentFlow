import Link from 'next/link';
import { Command, Grid2X2 } from 'lucide-react';
import { currentUser } from '@/server/auth';
import { initials } from '@/lib/formatters';
import { roleLabel } from '@/lib/constants';
import { LogoutButton } from '@/components/layout/logout-button';

export async function AppShell({ children }: { children: React.ReactNode }) { const user = await currentUser(); const home = user ? `/${user.role}` : '/'; return <><header className="topbar"><Link className="brand" href={home}><span className="brand-mark"><i /><i /></span><span>Student<span>Flow</span></span></Link><nav className="topnav"><Link href="/activities"><Command size={16} />Навігатор</Link>{user && <Link href={home}><Grid2X2 size={16} />Панель</Link>}</nav><div className="top-actions">{user ? <><Link className="user-chip" href={`/${user.role}/profile`}><b>{initials(user.fullName)}</b><span><strong>{user.fullName}</strong><small>{roleLabel[user.role]}</small></span></Link><LogoutButton /></> : <><Link className="button button-ghost" href="/login">Увійти</Link><Link className="button button-primary" href="/register">Створити профіль</Link></>}</div></header><main>{children}</main></>; }
