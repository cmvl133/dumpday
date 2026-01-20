import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, X, Check, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TimeBlock } from '@/types';

interface TimeBlockStripProps {
  block: TimeBlock;
  topPercent: number;
  heightPercent: number;
  date: string;
  onEdit?: (block: TimeBlock) => void;
  onSkip?: (blockId: number, date: string) => void;
  onModify?: (blockId: number, date: string, data: { startTime: string; endTime: string }) => void;
  onRestore?: (blockId: number, date: string) => void;
}

export function TimeBlockStrip({
  block,
  topPercent,
  heightPercent,
  date,
  onEdit,
  onSkip,
  onModify,
  onRestore,
}: TimeBlockStripProps) {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editStartTime, setEditStartTime] = useState(block.startTime);
  const [editEndTime, setEditEndTime] = useState(block.endTime);

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
      onMouseLeave={() => {
        if (!isEditingTime) {
          setShowTooltip(false);
        }
      }}
      title={block.name}
    >
      {/* Diagonal stripe pattern */}
      <div
        className={cn(
          'absolute inset-0 rounded-sm transition-all hover:brightness-125',
          block.isException && 'border-2 border-dashed'
        )}
        style={{
          background: `repeating-linear-gradient(
            45deg,
            ${block.color}15,
            ${block.color}15 6px,
            ${block.color}${block.isException ? '25' : '35'} 6px,
            ${block.color}${block.isException ? '25' : '35'} 12px
          )`,
          borderLeft: `3px solid ${block.color}`,
          borderColor: block.isException ? block.color : undefined,
        }}
      />

      {/* Tooltip - positioned to the right */}
      {showTooltip && (
        <div
          className={cn(
            'absolute left-full ml-2 top-0 bg-popover border rounded-lg shadow-lg px-3 py-2 z-[100]',
            isEditingTime ? 'w-[260px]' : 'w-[220px]'
          )}
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
              {/* Show original times when modified */}
              {block.isException && block.originalStartTime && block.originalEndTime && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t('timeBlocks.wasOriginal', { start: block.originalStartTime, end: block.originalEndTime })}
                </div>
              )}
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

          {/* Time edit mode */}
          {isEditingTime ? (
            <div className="space-y-2 mt-2">
              <div className="flex gap-2 items-center">
                <Input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="h-7 text-xs w-20"
                />
                <span className="text-xs text-muted-foreground">-</span>
                <Input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="h-7 text-xs w-20"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onModify?.(block.id, date, { startTime: editStartTime, endTime: editEndTime });
                    setIsEditingTime(false);
                    setShowTooltip(false);
                  }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {t('common.save')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTime(false);
                    setEditStartTime(block.startTime);
                    setEditEndTime(block.endTime);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1 mt-2">
              {!block.isException && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSkip?.(block.id, date);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t('timeBlocks.skipToday')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTime(true);
                    }}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {t('timeBlocks.editTimes')}
                  </Button>
                </>
              )}
              {block.isException && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTime(true);
                    }}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {t('timeBlocks.editTimes')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore?.(block.id, date);
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {t('timeBlocks.restore')}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
