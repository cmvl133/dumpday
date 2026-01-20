import { useMemo } from 'react';
import { TimeBlockStrip } from './TimeBlockStrip';
import { calculateTopPercent, calculateHeightPercent } from '@/lib/utils';
import type { TimeBlock } from '@/types';

interface TimeBlockBackgroundProps {
  timeBlocks: TimeBlock[];
  date: string;
  onEditBlock?: (block: TimeBlock) => void;
  onSkipBlock?: (blockId: number, date: string) => void;
  onModifyBlock?: (blockId: number, date: string, data: { startTime: string; endTime: string }) => void;
  onRestoreBlock?: (blockId: number, date: string) => void;
}

export function TimeBlockBackground({
  timeBlocks,
  date,
  onEditBlock,
  onSkipBlock,
  onModifyBlock,
  onRestoreBlock,
}: TimeBlockBackgroundProps) {
  const blocksWithLayout = useMemo(() => {
    return timeBlocks.map((block) => ({
      block,
      topPercent: calculateTopPercent(block.startTime),
      heightPercent: calculateHeightPercent(block.startTime, block.endTime),
    }));
  }, [timeBlocks]);

  return (
    <>
      {blocksWithLayout.map((item) => (
        <TimeBlockStrip
          key={item.block.id}
          block={item.block}
          topPercent={item.topPercent}
          heightPercent={item.heightPercent}
          date={date}
          onEdit={onEditBlock}
          onSkip={onSkipBlock}
          onModify={onModifyBlock}
          onRestore={onRestoreBlock}
        />
      ))}
    </>
  );
}
