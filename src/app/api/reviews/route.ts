import { actor, failure, success } from '@/server/api';
import { reviewApplication, reviewReport } from '@/server/services';
export async function POST(request: Request) { try { const body = await request.json(); const user = await actor(); if (body.kind === 'application') await reviewApplication(user, body.id, body.status, body.feedback ?? ''); else await reviewReport(user, body.id, body.status, body.feedback ?? ''); return success(); } catch (error) { return failure(error); } }
