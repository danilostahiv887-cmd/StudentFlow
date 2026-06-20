import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/server/repository';
import { sessionCookie } from '@/server/auth';
import { failure } from '@/server/api';

const schema = z.object({
  email: z.string().email('Вкажіть коректну електронну пошту.'),
  password: z.string().min(1, 'Вкажіть пароль.'),
});
export async function POST(request: Request) {
  try {
    const values = schema.parse(await request.json());
    const user = await authenticate(values.email, values.password);
    if (!user)
      return NextResponse.json(
        { success: false, formError: 'Неправильна пошта, пароль або статус облікового запису.' },
        { status: 401 },
      );
    const response = NextResponse.json({ success: true, data: { role: user.role } });
    response.cookies.set(sessionCookie(user.id));
    return response;
  } catch (error) {
    return failure(error);
  }
}
