import { cn } from '@/lib/utils';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface TimelineItem {
  title: string;
  description?: string;
  time?: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  operator?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              item.status === 'completed' && 'bg-green-100 text-green-600',
              item.status === 'current' && 'bg-blue-100 text-blue-600 ring-2 ring-blue-600 ring-offset-2',
              item.status === 'pending' && 'bg-gray-100 text-gray-400',
              item.status === 'error' && 'bg-red-100 text-red-600',
            )}>
              {item.status === 'completed' && <Check className="h-4 w-4" />}
              {item.status === 'current' && <Clock className="h-4 w-4" />}
              {item.status === 'pending' && <div className="w-2 h-2 rounded-full bg-gray-400" />}
              {item.status === 'error' && <AlertCircle className="h-4 w-4" />}
            </div>
            {index < items.length - 1 && (
              <div className={cn(
                'w-0.5 flex-1 min-h-[2rem]',
                item.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
              )} />
            )}
          </div>
          <div className="pb-6 pt-1 min-w-0">
            <p className={cn(
              'text-sm font-medium',
              item.status === 'current' ? 'text-blue-600' :
              item.status === 'completed' ? 'text-gray-900' : 'text-gray-400'
            )}>
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
            )}
            {(item.time || item.operator) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {item.time}{item.operator && ` · ${item.operator}`}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
