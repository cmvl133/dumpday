import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { updateSettings } from '@/store/settingsSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CheckInInterval } from '@/types';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INTERVAL_OPTIONS: { value: CheckInInterval; label: string }[] = [
  { value: 'off', label: 'Wyłączony' },
  { value: '2h', label: 'Co 2 godziny' },
  { value: '3h', label: 'Co 3 godziny' },
  { value: '4h', label: 'Co 4 godziny' },
];

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { checkInInterval, zenMode, soundEnabled } = useSelector(
    (state: RootState) => state.settings
  );

  const handleIntervalChange = (value: CheckInInterval) => {
    dispatch(updateSettings({ checkInInterval: value }));
  };

  const handleZenModeChange = (checked: boolean) => {
    dispatch(updateSettings({ zenMode: checked }));
  };

  const handleSoundChange = (checked: boolean) => {
    dispatch(updateSettings({ soundEnabled: checked }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ustawienia</DialogTitle>
          <DialogDescription>
            Dostosuj działanie aplikacji do swoich potrzeb.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Automatyczny check-in
            </label>
            <select
              value={checkInInterval}
              onChange={(e) =>
                handleIntervalChange(e.target.value as CheckInInterval)
              }
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {INTERVAL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Jak często przypominać o przejrzeniu zadań
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Tryb zen</label>
              <p className="text-xs text-muted-foreground">
                Wyłącz animacje i komentarze combo
              </p>
            </div>
            <Checkbox
              checked={zenMode}
              onCheckedChange={handleZenModeChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Dźwięki</label>
              <p className="text-xs text-muted-foreground">
                Efekty dźwiękowe przy akcjach
              </p>
            </div>
            <Checkbox
              checked={soundEnabled}
              onCheckedChange={handleSoundChange}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
