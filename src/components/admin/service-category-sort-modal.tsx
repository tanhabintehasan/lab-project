'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { ServiceCategory } from '@/services/api/admin/service-categories';

// ─── Sortable Item ───────────────────────────────────────────

interface SortableItemProps {
  category: ServiceCategory;
}

function SortableItem({ category }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-lg',
        'hover:border-gray-300 transition-colors',
        isDragging && 'shadow-lg border-blue-300'
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-lg">{category.icon || '📁'}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">
          {category.name.zh}
        </div>
        {category.name.en && (
          <div className="text-xs text-gray-500 truncate">{category.name.en}</div>
        )}
      </div>
      {category.parent && (
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
          {category.parent.name.zh}
        </span>
      )}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────

interface ServiceCategorySortModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  onSave: (items: { id: string; sortOrder: number }[]) => void;
  isSaving?: boolean;
}

export function ServiceCategorySortModal({
  isOpen,
  onClose,
  categories,
  onSave,
  isSaving,
}: ServiceCategorySortModalProps) {
  const [items, setItems] = useState<ServiceCategory[]>([]);

  // Initialize items when modal opens
  useMemo(() => {
    if (isOpen) {
      const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
      setItems(sorted);
    }
  }, [isOpen, categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSave = () => {
    const updates = items.map((cat, index) => ({
      id: cat.id,
      sortOrder: (index + 1) * 10, // leave gaps for future inserts
    }));
    onSave(updates);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Sort Order"
      size="lg"
      loading={isSaving}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Drag and drop to reorder categories. Changes are saved when you click &quot;Save Order&quot;.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {items.map((category) => (
                <SortableItem key={category.id} category={category} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            Save Order
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Helper ──────────────────────────────────────────────────

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
