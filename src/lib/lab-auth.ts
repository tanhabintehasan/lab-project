import { prisma } from '@/lib/db';

export interface LabAccessResult {
  labId: string;
  role: string;
}

/**
 * Verify that a user has lab access and return their lab association.
 * Throws an error with status info if access is denied.
 */
export async function requireLabAccess(userId: string): Promise<LabAccessResult> {
  const labUser = await prisma.labUser.findUnique({
    where: { userId },
    select: { labId: true, role: true },
  });

  if (!labUser) {
    const err = new Error('用户未关联实验室');
    (err as any).status = 403;
    throw err;
  }

  return { labId: labUser.labId, role: labUser.role };
}

/**
 * Check if a user is associated with a specific lab.
 */
export async function verifyLabOwnership(
  userId: string,
  expectedLabId: string
): Promise<boolean> {
  const labUser = await prisma.labUser.findUnique({
    where: { userId },
    select: { labId: true },
  });
  return labUser?.labId === expectedLabId;
}
