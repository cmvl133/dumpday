import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TimeBlock } from '@/types';

interface TimeBlockStripProps {
  block: TimeBlock;
  topPercent: number;
  heightPercent: number;
  onEdit?: (block: TimeBlock) => void;
}

export function TimeBlockStrip({
  block,
  topPercent,
  heightPercent,
  onEdit,
}: TimeBlockStripProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        top: `${topPercent}%`,
        left: '56px',
        width: '20px',
        height: `${Math.max(heightPercent, 2)}%`,
        minHeight: '16px',
        zIndex: showTooltip ? 100 : 5,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title={block.name}
    >
      {/* Diagonal stripe pattern */}
      <div
        className={cn(
          'absolute inset-0 rounded-sm transition-all hover:brightness-125'
        )}
        style={{
          background: `repeating-linear-gradient(
            45deg,
            ${block.color}15,
            ${block.color}15 6px,
            ${block.color}35 6px,
            ${block.color}35 12px
          )`,
          borderLeft: `3px solid ${block.color}`,
        }}
      />

      {/* Tooltip - positioned to the right */}
      {showTooltip && (
        <div
          className="absolute left-full ml-2 top-0 bg-popover border rounded-lg shadow-lg px-3 py-2 z-[100] w-[220px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium break-words">{block.name}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="text-primary">
                  {block.startTime} - {block.endTime}
                </span>
              </div>
              {block.tags && block.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {block.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor: `${tag.color}30`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(block);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
