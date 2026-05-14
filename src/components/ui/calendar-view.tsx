'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './button';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  status: string;
  color?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}

const statusColorMap: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
  CANCELLED: 'bg-gray-50 text-gray-400 border-gray-200',
};

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ events, onEventClick, className }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const weekStart = useMemo(() => getStartOfWeek(currentDate), [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const evt of events) {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
    }
    return map;
  }, [events]);

  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = getStartOfWeek(firstDay);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [currentDate]);

  const isToday = (d: Date) => {
    const t = new Date();
    return d.toDateString() === t.toDateString();
  };

  const isSameMonth = (d: Date) => {
    return d.getMonth() === currentDate.getMonth();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate((d) => addDays(d, viewMode === 'week' ? -7 : -30))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold text-gray-900 min-w-[140px] text-center">
            {formatMonthYear(currentDate)}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate((d) => addDays(d, viewMode === 'week' ? 7 : 30))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {weekDays.map((d, i) => (
              <div
                key={i}
                className={cn(
                  'px-3 py-2 text-sm font-medium text-center',
                  isToday(d) ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                )}
              >
                <div className="text-xs uppercase">{WEEK_DAYS[i]}</div>
                <div className={cn('text-lg', isToday(d) && 'font-bold')}>{d.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Events */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDays.map((d, i) => {
              const key = formatDateKey(d);
              const dayEvents = eventsByDay[key] || [];
              return (
                <div
                  key={i}
                  className={cn(
                    'border-r border-gray-100 p-2 space-y-1.5 min-h-[400px]',
                    i === 6 && 'border-r-0',
                    isToday(d) && 'bg-blue-50/30'
                  )}
                >
                  {dayEvents.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => onEventClick?.(evt)}
                      className={cn(
                        'w-full text-left px-2 py-1.5 rounded-md text-xs border transition-colors hover:opacity-80',
                        statusColorMap[evt.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                      )}
                    >
                      <div className="font-medium truncate">{evt.title}</div>
                      <div className="text-[10px] opacity-80">
                        {evt.startTime} - {evt.endTime}
                      </div>
                    </button>
                  ))}
                  {dayEvents.length === 0 && (
                    <div className="text-xs text-gray-300 text-center py-4">No bookings</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-xs font-medium text-center text-gray-500 uppercase">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid.map((d, i) => {
              const key = formatDateKey(d);
              const dayEvents = eventsByDay[key] || [];
              return (
                <div
                  key={i}
                  className={cn(
                    'border-r border-b border-gray-100 p-1.5 min-h-[100px]',
                    !isSameMonth(d) && 'bg-gray-50/50',
                    isToday(d) && 'bg-blue-50/40'
                  )}
                >
                  <div
                    className={cn(
                      'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                      isToday(d) ? 'bg-blue-600 text-white' : 'text-gray-700'
                    )}
                  >
                    {d.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => onEventClick?.(evt)}
                        className={cn(
                          'w-full text-left px-1.5 py-0.5 rounded text-[10px] border truncate transition-colors hover:opacity-80',
                          statusColorMap[evt.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                        )}
                      >
                        {evt.startTime} {evt.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-gray-400 pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
