import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { errorResponse, successResponse, getAuthUser } from '@/lib/api-helpers';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

interface TimeRange {
  start: string; // HH:mm
  end: string;   // HH:mm
}

interface OperatingHours {
  [key: string]: TimeRange | null;
}

const activeConflictStatuses = ['PENDING', 'APPROVED', 'CONFIRMED', 'IN_PROGRESS'];

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getUtcDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Subtract blocked ranges from available ranges to produce free slots.
 */
function subtractRanges(available: TimeRange[], blocked: TimeRange[]): TimeRange[] {
  const result: TimeRange[] = [];

  for (const avail of available) {
    let cursor = parseTime(avail.start);
    const availEnd = parseTime(avail.end);

    const overlappingBlocked = blocked
      .filter((b) => parseTime(b.end) > cursor && parseTime(b.start) < availEnd)
      .sort((a, b) => parseTime(a.start) - parseTime(b.start));

    for (const block of overlappingBlocked) {
      const blockStart = parseTime(block.start);
      const blockEnd = parseTime(block.end);

      if (blockStart > cursor) {
        result.push({ start: formatTime(cursor), end: formatTime(blockStart) });
      }
      cursor = Math.max(cursor, blockEnd);
      if (cursor >= availEnd) break;
    }

    if (cursor < availEnd) {
      result.push({ start: formatTime(cursor), end: formatTime(availEnd) });
    }
  }

  return result.filter((r) => parseTime(r.end) - parseTime(r.start) >= 30);
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const url = new URL(request.url);
    const equipmentId = url.searchParams.get('equipmentId');
    const dateStr = url.searchParams.get('date');

    if (!equipmentId || !dateStr) {
      return errorResponse('equipmentId and date are required', 400);
    }

    const date = getUtcDate(dateStr);
    if (Number.isNaN(date.getTime())) {
      return errorResponse('Invalid date format', 400);
    }

    // 1. Fetch equipment with lab
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        lab: {
          select: {
            id: true,
            nameZh: true,
            operatingHours: true,
          },
        },
      },
    });

    if (!equipment || !equipment.isActive) {
      return errorResponse('Equipment not found', 404);
    }

    if (!equipment.bookable) {
      return successResponse({ availableSlots: [], reason: 'Equipment is not bookable' });
    }

    // 2. Get lab operating hours for the day
    const dayName = DAY_NAMES[date.getUTCDay()];
    const operatingHours = (equipment.lab?.operatingHours as OperatingHours | null) || {};
    const dayHours = operatingHours[dayName] as { open: string; close: string } | null | undefined;

    if (!dayHours || !dayHours.open || !dayHours.close) {
      return successResponse({ availableSlots: [], reason: 'Lab is closed on this day' });
    }

    const baseRange: TimeRange = { start: dayHours.open, end: dayHours.close };

    // 3. Get equipment maintenance/downtime schedules for this date
    const schedules = await prisma.equipmentSchedule.findMany({
      where: {
        equipmentId,
        startTime: { lte: new Date(`${dateStr}T23:59:59`) },
        endTime: { gte: new Date(`${dateStr}T00:00:00`) },
      },
    });

    const scheduleRanges: TimeRange[] = schedules.map((s) => ({
      start: s.startTime.toISOString().slice(11, 16),
      end: s.endTime.toISOString().slice(11, 16),
    }));

    // 4. Get existing bookings for this date
    const bookingModel = (prisma as unknown as Record<string, any>).equipmentBooking;
    if (!bookingModel) {
      return errorResponse('Booking model not available', 500);
    }

    const existingBookings = await bookingModel.findMany({
      where: {
        equipmentId,
        bookingDate: date,
        status: { in: activeConflictStatuses },
      },
      select: { startTime: true, endTime: true },
    });

    const bookingRanges: TimeRange[] = existingBookings.map((b: { startTime: Date; endTime: Date }) => ({
      start: b.startTime.toISOString().slice(11, 16),
      end: b.endTime.toISOString().slice(11, 16),
    }));

    // 5. Compute available slots
    const allBlocked = [...scheduleRanges, ...bookingRanges];
    const availableSlots = subtractRanges([baseRange], allBlocked);

    return successResponse({
      equipmentId,
      date: dateStr,
      dayOfWeek: dayName,
      labHours: dayHours,
      blockedRanges: allBlocked,
      availableSlots,
      totalSlots: availableSlots.length,
    });
  } catch (error) {
    console.error('Availability check error:', error);
    return errorResponse('Failed to check availability', 500);
  }
}
