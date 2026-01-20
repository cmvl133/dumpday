import { useMemo } from 'react';
import { TimeBlockStrip } from './TimeBlockStrip';
import { calculateTopPercent, calculateHeightPercent } from '@/lib/utils';
import type { TimeBlock } from '@/types';

interface TimeBlockBackgroundProps {
  timeBlocks: TimeBlock[];
  onEditBlock?: (block: TimeBlock) => void;
}

export function TimeBlockBackground({
  timeBlocks,
  onEditBlock,
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
          onEdit={onEditBlock}
        />
      ))}
    </>
  );
}
