import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';

/**
 * GET /api/admin/cms/homepage
 *
 * Returns the homepage CMS page with all sections, items, and points.
 * Auto-creates a homepage page if one doesn't exist.
 */
const handler = async (_request: NextRequest) => {
  try {
    let page = await prisma.cMSPage.findUnique({
      where: { slug: 'homepage' },
      include: {
        sections: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            items: {
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              include: {
                points: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
              },
            },
          },
        },
      },
    });

    if (!page) {
      // Auto-create homepage CMS page with default sections
      page = await prisma.cMSPage.create({
        data: {
          slug: 'homepage',
          type: 'homepage',
          titleZh: '首页',
          titleEn: 'Home',
          isPublished: true,
          sortOrder: 0,
          sections: {
            create: [
              {
                sectionKey: 'hero',
                name: 'Hero / 主横幅',
                titleZh: '度量衡科研平台',
                subtitleZh: '立足科学前沿，服务中国创新',
                badgeZh: '国家科研与检测协同服务入口',
                styleVariant: 'blue',
                isEnabled: true,
                isPublished: true,
                sortOrder: 0,
              },
              {
                sectionKey: 'service_categories',
                name: '服务分类',
                titleZh: '服务分类',
                subtitleZh: '按研究与检测方向快速进入',
                isEnabled: true,
                isPublished: true,
                sortOrder: 10,
              },
              {
                sectionKey: 'advantages',
                name: '平台优势',
                titleZh: '平台核心优势',
                subtitleZh: '专业、权威、可信赖的科研检测服务',
                isEnabled: true,
                isPublished: true,
                sortOrder: 20,
              },
              {
                sectionKey: 'stats_banner',
                name: '数据统计',
                titleZh: '平台数据',
                subtitleZh: '用数据见证实力',
                styleVariant: 'blue',
                isEnabled: true,
                isPublished: true,
                sortOrder: 30,
              },
              {
                sectionKey: 'why_choose_us',
                name: '为什么选择我们',
                titleZh: '为什么选择我们',
                subtitleZh: '用数据说话，让科研检测更高效',
                isEnabled: true,
                isPublished: true,
                sortOrder: 40,
              },
              {
                sectionKey: 'labs',
                name: '合作实验室',
                titleZh: '前沿实验室',
                subtitleZh: '领先的科研检测实验室网络',
                styleVariant: 'emerald',
                isEnabled: true,
                isPublished: true,
                sortOrder: 50,
              },
              {
                sectionKey: 'partners',
                name: '合作伙伴',
                titleZh: '合作伙伴生态',
                subtitleZh: '优先服务高校、科研院所、企业研发部门',
                isEnabled: true,
                isPublished: true,
                sortOrder: 60,
              },
              {
                sectionKey: 'banners',
                name: '轮播横幅',
                titleZh: '精选 banner',
                styleVariant: 'blue',
                isEnabled: true,
                isPublished: true,
                sortOrder: 70,
              },
            ],
          },
        },
        include: {
          sections: {
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            include: {
              items: {
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                include: {
                  points: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
                },
              },
            },
          },
        },
      });
    }

    return successResponse(page);
  } catch (err) {
    console.error('GET /api/admin/cms/homepage error:', err);
    return errorResponse('获取首页内容失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN']);
