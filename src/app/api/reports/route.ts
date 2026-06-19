import { actor, failure, success } from '@/server/api';
import { submitReport } from '@/server/services';
export async function POST(request: Request) { try { await submitReport(await actor(), await request.json()); return success(); } catch (error) { return failure(error); } }
