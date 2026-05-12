import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  errorResponse,
  getAuthUser,
  getPaginationParams,
  paginatedResponse,
  successResponse,
} from '@/lib/api-helpers';

const createCertificateSchema = z.object({
  orderId: z.string().optional(),
  orderNo: z.string().optional(),
  title: z.string().min(1, '证书标题不能为空'),
  fileUrl: z.string().url('请提供有效的文件地址'),
  fileName: z.string().optional(),
  expiresAt: z.string().datetime().optional().or(z.literal('')).optional(),
});

function isBackofficeRole(role?: string) {
  return ['SUPER_ADMIN', 'FINANCE_ADMIN', 'LAB_PARTNER'].includes(role || '');
}

function canIssueCertificate(role?: string) {
  return ['SUPER_ADMIN', 'LAB_PARTNER'].includes(role || '');
}

function buildCertificateFileType(input: {
  status: string;
  certificateNo: string;
  issuedAt: string;
  expiresAt?: string | null;
}) {
  return `certificate::${input.status}::${input.certificateNo}::${input.issuedAt}::${input.expiresAt || ''}`;
}

function parseCertificateFileType(fileType?: string | null) {
  if (!fileType || !fileType.startsWith('certificate::')) {
    return {
      isCertificate: false,
      status: 'ISSUED',
      certificateNo: '',
      issuedAt: null as string | null,
      expiresAt: null as string | null,
    };
  }

  const [, status = 'ISSUED', certificateNo = '', issuedAt = '', expiresAt = ''] = fileType.split('::');

  return {
    isCertificate: true,
    status,
    certificateNo,
    issuedAt: issuedAt || null,
    expiresAt: expiresAt || null,
  };
}

async function generateCertificateNo() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, '0');
  const dd = `${now.getDate()}`.padStart(2, '0');
  const prefix = `CERT-${yyyy}${mm}${dd}`;

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const countToday = await prisma.orderDocument.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      fileType: {
        startsWith: 'certificate::',
      },
    },
  });

  return `${prefix}-${String(countToday + 1).padStart(4, '0')}`;
}

function mapCertificate(
  doc: Prisma.OrderDocumentGetPayload<{
    include: {
      order: {
        select: {
          id: true;
          orderNo: true;
          status: true;
          userId: true;
          user: {
            select: {
              id: true;
              name: true;
              email: true;
            };
          };
        };
      };
    };
  }>
) {
  const meta = parseCertificateFileType(doc.fileType);

  return {
    id: doc.id,
    title: doc.fileName,
    fileUrl: doc.fileUrl,
    fileSize: doc.fileSize,
    createdAt: doc.createdAt,
    uploadedBy: doc.uploadedBy,
    status: meta.status,
    certificateNo: meta.certificateNo || `CERT-${doc.id.slice(0, 8).toUpperCase()}`,
    issuedAt: meta.issuedAt || doc.createdAt.toISOString(),
    expiresAt: meta.expiresAt,
    order: {
      id: doc.order.id,
      orderNo: doc.order.orderNo,
      status: doc.order.status,
      userId: doc.order.userId,
      user: doc.order.user,
    },
  };
}

// GET - dashboard/admin certificate list
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);

    const scope = url.searchParams.get('scope') || 'dashboard';
    const q = url.searchParams.get('q')?.trim() || '';

    if (scope === 'admin' && !isBackofficeRole(user.role)) {
      return errorResponse('权限不足', 403);
    }

    const where: Prisma.OrderDocumentWhereInput = {
      fileType: {
        startsWith: 'certificate::',
      },
      ...(scope !== 'admin'
        ? {
            order: {
              userId: user.userId,
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { fileName: { contains: q } },
              { uploadedBy: { contains: q } },
              { order: { orderNo: { contains: q } } },
              { fileType: { contains: q } },
            ],
          }
        : {}),
    };

    const [docs, total] = await Promise.all([
      prisma.orderDocument.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNo: true,
              status: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.orderDocument.count({ where }),
    ]);

    return paginatedResponse(docs.map(mapCertificate), total, page, pageSize);
  } catch (error) {
    console.error('Certificates GET error:', error);
    return errorResponse('获取证书列表失败', 500);
  }
}

// POST - create/issue certificate
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  if (!canIssueCertificate(user.role)) {
    return errorResponse('权限不足', 403);
  }

  try {
    const body = await request.json();
    const data = createCertificateSchema.parse(body);

    if (!data.orderId && !data.orderNo) {
      return errorResponse('请提供订单ID或订单编号', 400);
    }

    const order = await prisma.order.findFirst({
      where: data.orderId ? { id: data.orderId } : { orderNo: data.orderNo },
      include: {
        user: true,
      },
    });

    if (!order) {
      return errorResponse('订单不存在', 404);
    }

    const certificateNo = await generateCertificateNo();
    const issuedAt = new Date().toISOString();
    const expiresAt = data.expiresAt ? new Date(data.expiresAt).toISOString() : null;

    const created = await prisma.$transaction(async (tx) => {
      const doc = await tx.orderDocument.create({
        data: {
          orderId: order.id,
          fileName: data.title,
          fileUrl: data.fileUrl,
          fileType: buildCertificateFileType({
            status: 'ISSUED',
            certificateNo,
            issuedAt,
            expiresAt,
          }),
          uploadedBy: user.email || user.userId,
        },
        include: {
          order: {
            select: {
              id: true,
              orderNo: true,
              status: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'CERTIFICATE_ISSUED',
          title: '证书已签发',
          description: `证书 ${certificateNo} 已上传，可在用户中心下载`,
          operator: user.email || user.userId,
        },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'REPORT',
          titleZh: '检测证书已签发',
          titleEn: 'Certificate Issued',
          contentZh: `订单 ${order.orderNo} 的检测证书已签发，可前往用户中心查看和下载。`,
          contentEn: `Certificate for order ${order.orderNo} has been issued and is ready for download.`,
          link: '/dashboard/certificates',
        },
      });

      return doc;
    });

    return successResponse(mapCertificate(created), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }

    console.error('Certificates POST error:', error);
    return errorResponse('签发证书失败', 500);
  }
}