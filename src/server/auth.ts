import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Profile, Role } from '@/types/entities';
import { getProfile } from '@/server/repository';

const cookieName = 'studentflow-session';

export async function currentUser(): Promise<Profile | undefined> {
  const id = (await cookies()).get(cookieName)?.value;
  return id ? getProfile(id) : undefined;
}

export async function requireUser(roles?: Role[]) {
  const user = await currentUser();
  if (!user || user.status !== 'active') redirect('/login');
  if (roles && !roles.includes(user.role)) redirect(`/${user.role}`);
  return user;
}

export function sessionCookie(id: string) {
  return { name: cookieName, value: id, httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 12 };
}

export { cookieName };
