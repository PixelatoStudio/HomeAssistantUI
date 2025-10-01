import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';

interface SortableDeviceCardProps {
  id: string;
  children: ReactNode;
  className?: string;
}

/**
 * SortableDeviceCard - Wrapper component for drag-and-drop functionality
 *
 * CRITICAL IMPLEMENTATION NOTES:
 *
 * 1. GRID LAYOUT COMPATIBILITY:
 *    - Parent grid uses CSS Grid with implicit row height distribution
 *    - Without proper display property, wrapper breaks grid's align-items: stretch behavior
 *    - SOLUTION: Set display: 'grid' on wrapper to maintain grid context
 *    - This allows children to inherit proper grid cell height stretching
 *
 * 2. DRAG VISUAL FEEDBACK:
 *    - isDragging: opacity-50, scale-95, ring-4 ring-accent (orange ring)
 *    - isOver: ring-2 ring-accent/50 (lighter ring for drop zones)
 *    - These classes provide clear visual feedback during drag operations
 *    - DO NOT use display: contents as it breaks visual feedback styling
 *
 * 3. TOUCH OPTIMIZATION:
 *    - Parent should configure sensors with activation constraints:
 *      - TouchSensor: 250ms delay, 5px tolerance for long press
 *      - PointerSensor: 8px distance before drag starts
 *    - Prevents accidental drags while allowing smooth interactions
 *
 * 4. GRID STRATEGY:
 *    - Use rectSortingStrategy in SortableContext for grid layouts
 *    - Ensures proper collision detection in 2D grid arrangements
 */
export function SortableDeviceCard({ id, children, className }: SortableDeviceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 1000 : 'auto',
    // CRITICAL: display: 'grid' maintains grid context for proper height stretching
    // Without this, wrapper breaks parent grid's align-items: stretch behavior
    display: 'grid',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className || ''} ${
        isDragging
          ? 'opacity-50 scale-95 ring-4 ring-accent ring-offset-2'
          : isOver
          ? 'ring-2 ring-accent/50'
          : ''
      }`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
