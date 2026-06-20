import { NextResponse } from 'next/server';
import { cookieName } from '@/server/auth';
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({ name: cookieName, value: '', path: '/', maxAge: 0 });
  return response;
}
