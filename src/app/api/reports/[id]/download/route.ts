import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, getAuthUser } from '@/lib/api-helpers';
import { canAccessReport } from '@/lib/company-scope';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { id } = await params;

    // Check access permission
    const hasAccess = await canAccessReport(user.userId, id);
    if (!hasAccess) return errorResponse('权限不足', 403);

    // Get report
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        attachments: true,
      },
    });

    if (!report) return errorResponse('报告不存在', 404);
    if (report.status !== 'PUBLISHED') return errorResponse('报告尚未发布', 403);

    // Record download
    await prisma.reportDownload.create({
      data: {
        reportId: id,
        userId: user.userId,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    // In production, you would:
    // 1. Generate a signed URL for the file
    // 2. Return a redirect to the signed URL
    // For now, return the file URL

    const mainAttachment = report.attachments[0];
    if (!mainAttachment) return errorResponse('报告文件不存在', 404);

    // Redirect to file URL
    return Response.redirect(mainAttachment.fileUrl, 302);
  } catch (error) {
    console.error('Report download error:', error);
    return errorResponse('下载失败', 500);
  }
}
