import { actor, failure, success } from '@/server/api';
import { cancelApplication, submitApplication } from '@/server/services';
export async function POST(request: Request) {
  try {
    await submitApplication(await actor(), await request.json());
    return success();
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    await cancelApplication(await actor(), body.applicationId, body.reason ?? '');
    return success();
  } catch (error) {
    return failure(error);
  }
}
