import { TableSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="animate-pulse h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="animate-pulse h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}
