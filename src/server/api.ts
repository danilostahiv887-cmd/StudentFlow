import { ZodError } from 'zod';
import { NextResponse } from 'next/server';
import { currentUser } from '@/server/auth';
import { DomainError } from '@/server/services';

export const success = (data?: unknown) => NextResponse.json({ success: true, data });
export const failure = (error: unknown) => {
  if (error instanceof ZodError) return NextResponse.json({ success: false, formError: 'Перевірте заповнення полів.', fieldErrors: error.flatten().fieldErrors }, { status: 422 });
  return NextResponse.json({ success: false, formError: error instanceof Error ? error.message : 'Сталася неочікувана помилка.' }, { status: error instanceof DomainError ? 400 : 500 });
};
export async function actor() {
  const user = await currentUser();
  if (!user) throw new DomainError('Спершу увійдіть до системи.');
  return user;
}
