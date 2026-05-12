import type { LucideIcon } from 'lucide-react';
import {
  Search,
  ArrowRight,
  FlaskConical,
  ShieldCheck,
  Building2,
  GraduationCap,
  Landmark,
  Wallet,
  ChevronRight,
  Award,
  Users,
  Star,
  MapPin,
  CheckCircle2,
  BarChart,
  Lightbulb,
} from 'lucide-react';

export function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  const p = payload as {
    data?: unknown[] | { items?: unknown[]; data?: unknown[] };
    items?: unknown[];
    results?: unknown[];
  };

  if (Array.isArray(p?.data)) return p.data as T[];
  if (Array.isArray(p?.items)) return p.items as T[];
  if (Array.isArray(p?.results)) return p.results as T[];

  if (
    p?.data &&
    typeof p.data === 'object' &&
    Array.isArray((p.data as { items?: unknown[] }).items)
  ) {
    return ((p.data as { items?: unknown[] }).items ?? []) as T[];
  }

  if (
    p?.data &&
    typeof p.data === 'object' &&
    Array.isArray((p.data as { data?: unknown[] }).data)
  ) {
    return ((p.data as { data?: unknown[] }).data ?? []) as T[];
  }

  return [];
}

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Award,
  Users,
  FlaskConical,
  Star,
  Building2,
  GraduationCap,
  Landmark,
  MapPin,
  Wallet,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Search,
  CheckCircle2,
  BarChart,
  Lightbulb,
};

export function getIcon(name?: string | null): LucideIcon | null {
  if (!name) return null;
  return (iconMap[name] as LucideIcon) || null;
}
