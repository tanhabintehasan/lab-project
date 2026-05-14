'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recommendation {
  serviceId: string;
  serviceName: string;
  categoryName: string;
  score: number;
  reason: string;
}

interface RecommendedServicesProps {
  className?: string;
  limit?: number;
}

export function RecommendedServices({ className, limit = 8 }: RecommendedServicesProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/services/recommended?limit=${limit}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        if (data.success && data.data?.recommendations) {
          setRecommendations(data.data.recommendations);
        } else {
          setError(data.error || '加载失败');
        }
        setLoading(false);
      })
      .catch(err => {
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [limit]);

  if (loading) {
    return (
      <div className={cn('py-8', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900">为您推荐</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Silently hide if no recommendations or error
  }

  return (
    <div className={cn('py-8', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900">为您推荐</h2>
          <Badge variant="info" size="sm">AI 智能推荐</Badge>
        </div>
        <Link
          href="/services"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          查看全部 <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((rec) => (
          <Link
            key={rec.serviceId}
            href={`/services/${rec.serviceId}`}
            className="group block"
          >
            <Card
              padding="md"
              className="h-full hover:shadow-md hover:border-purple-200 transition-all duration-200"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" size="sm" className="text-xs">
                    {rec.categoryName}
                  </Badge>
                  <Sparkles className="h-3.5 w-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-1">
                  {rec.serviceName}
                </h3>
                <p className="text-xs text-gray-500 mt-auto">{rec.reason}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
