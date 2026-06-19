import { actor, failure, success } from '@/server/api';
import { updateProfile } from '@/server/services';
export async function PATCH(request: Request) { try { await updateProfile(await actor(), await request.json()); return success(); } catch (error) { return failure(error); } }
