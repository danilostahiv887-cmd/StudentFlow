import { actor, failure, success } from '@/server/api';
import {
  createActivity,
  createReference,
  createTeacher,
  deleteAdminEntity,
  grantStudentBadge,
  toggleUser,
  updateAdminEntity,
} from '@/server/services';
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    await toggleUser(await actor(), body.profileId);
    return success();
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await actor();
    if (body.action === 'teacher') await createTeacher(user, body);
    else if (body.action === 'activity') await createActivity(user, body);
    else if (body.action === 'reference') await createReference(user, body.kind, body);
    else if (body.action === 'studentBadge') await grantStudentBadge(user, body);
    else throw new Error('Невідома адміністративна дія.');
    return success();
  } catch (error) {
    return failure(error);
  }
}
export async function PUT(request: Request) {
  try {
    await updateAdminEntity(await actor(), await request.json());
    return success();
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  try {
    await deleteAdminEntity(await actor(), await request.json());
    return success();
  } catch (error) {
    return failure(error);
  }
}
