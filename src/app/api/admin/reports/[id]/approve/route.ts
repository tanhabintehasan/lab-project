import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { reportReadyEmail } from '@/lib/email-templates';
import { processReportPdf, fetchFileBuffer, deriveReportPassword } from '@/lib/report-processor';
import { getMediaService } from '@/services/media-service';

const approveSchema = z.object({
  note: z.string().optional(),
});

const handler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const reportId = pathParts[pathParts.length - 2];

    const body = await request.json();
    const data = approveSchema.parse(body);

    // Get report with order info
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        order: { include: { user: true } },
      },
    });

    if (!report) return errorResponse('Report not found', 404);
    if (report.status !== 'UNDER_REVIEW') {
      return errorResponse('Only reports under review can be approved', 422);
    }

    // Fetch raw PDF
    if (!report.fileUrl) {
      return errorResponse('Report file missing', 400);
    }

    const rawBuffer = await fetchFileBuffer(report.fileUrl);

    // Process PDF: add digital signature + encrypt
    const password = deriveReportPassword(report.order.orderNo, report.reportNo);
    const processedBuffer = await processReportPdf({
      buffer: rawBuffer,
      signerName: user.name || user.email || 'Admin',
      signerRole: user.role,
      password,
    });

    // Upload processed PDF
    const media = getMediaService();
    const uploadResult = await media.upload(
      {
        buffer: processedBuffer,
        originalName: `${report.reportNo}-signed.pdf`,
        mimeType: 'application/pdf',
        size: processedBuffer.length,
      },
      {
        context: 'report',
        folder: 'reports',
        entityType: 'Report',
        entityId: report.id,
        uploadedBy: user.userId,
      }
    );

    // Update report
    const approvedReport = await prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id: reportId },
        data: {
          status: 'PUBLISHED',
          fileUrl: uploadResult.url,
          approvedBy: user.userId,
          approvedAt: new Date(),
          digitalSignature: {
            signerName: user.name || user.email,
            signerRole: user.role,
            signedAt: new Date().toISOString(),
            note: data.note,
          },
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: report.orderId },
        data: { status: 'REPORT_DELIVERED' },
      });

      // Add order timeline
      await tx.orderTimeline.create({
        data: {
          orderId: report.orderId,
          status: 'REPORT_DELIVERED',
          title: 'Report Approved & Delivered',
          description: `Report ${report.reportNo} has been approved by ${user.name || user.email}`,
          operator: user.userId,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: report.order.userId,
          type: 'REPORT',
          titleZh: '检测报告已生成',
          titleEn: 'Report Ready',
          contentZh: `订单 ${report.order.orderNo} 的检测报告已审核通过，现在可以查看和下载`,
          contentEn: `Report for order ${report.order.orderNo} is now available`,
          link: `/dashboard/reports/${reportId}`,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: 'APPROVE_REPORT',
          entity: 'Report',
          entityId: reportId,
          details: {
            orderNo: report.order.orderNo,
            reportNo: report.reportNo,
            note: data.note,
          },
        },
      });

      return updated;
    });

    // Send email notification
    const emailContent = reportReadyEmail({
      name: report.order.user.name,
      orderNo: report.order.orderNo,
      reportUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/reports/${reportId}`,
    });

    if (report.order.user.email) {
      await sendEmail({
        to: report.order.user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    }

    return successResponse({ report: approvedReport });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || 'Invalid parameters', 400);
    }
    console.error('Report approval error:', error);
    return errorResponse('Approval failed', 500);
  }
};

export const POST = withAuth(handler, ['SUPER_ADMIN']);
