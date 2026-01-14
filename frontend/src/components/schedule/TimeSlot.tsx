interface TimeSlotProps {
  hour: number;
}

export function TimeSlot({ hour }: TimeSlotProps) {
  const formattedHour = hour.toString().padStart(2, '0') + ':00';

  return (
    <div className="flex h-[60px] border-t border-border/30">
      <div className="w-14 pr-2 text-right text-xs text-muted-foreground pt-1 shrink-0">
        {formattedHour}
      </div>
      <div className="flex-1 border-l border-border/30" />
    </div>
  );
}
