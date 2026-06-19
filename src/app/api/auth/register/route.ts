import { registerStudent } from '@/server/services';
import { sessionCookie } from '@/server/auth';
import { NextResponse } from 'next/server';
import { failure } from '@/server/api';
export async function POST(request: Request) { try { const user = await registerStudent(await request.json()); const response = NextResponse.json({ success: true, data: { role: user.role } }); response.cookies.set(sessionCookie(user.id)); return response; } catch (error) { return failure(error); } }
