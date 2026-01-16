import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check } from 'lucide-react';
import { updateSettings } from '@/store/settingsSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CheckInInterval, ReminderTone } from '@/types';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INTERVAL_OPTIONS: { value: CheckInInterval; label: string }[] = [
  { value: 'off', label: 'Wylaczony' },
  { value: '2h', label: 'Co 2 godziny' },
  { value: '3h', label: 'Co 3 godziny' },
  { value: '4h', label: 'Co 4 godziny' },
];

const TONE_OPTIONS: { value: ReminderTone; label: string }[] = [
  { value: 'gentle', label: 'Delikatny' },
  { value: 'normal', label: 'Normalny' },
  { value: 'aggressive', label: 'Agresywny' },
  { value: 'vulgar', label: 'Wulgarny' },
  { value: 'bigpoppapump', label: 'Big Poppa Pump' },
];

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { checkInInterval, zenMode, soundEnabled, reminderTone } = useSelector(
    (state: RootState) => state.settings
  );
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [open]);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const handleIntervalChange = (value: CheckInInterval) => {
    dispatch(updateSettings({ checkInInterval: value }));
  };

  const handleZenModeChange = (checked: boolean) => {
    dispatch(updateSettings({ zenMode: checked }));
  };

  const handleSoundChange = (checked: boolean) => {
    dispatch(updateSettings({ soundEnabled: checked }));
  };

  const handleToneChange = (value: ReminderTone) => {
    dispatch(updateSettings({ reminderTone: value }));
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
              Jak czesto przypominac o przejrzeniu zadan
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              Ton powiadomien
            </label>
            <select
              value={reminderTone}
              onChange={(e) =>
                handleToneChange(e.target.value as ReminderTone)
              }
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Styl komunikatow przypominajacych i combo
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              Powiadomienia systemowe
            </label>
            <div className="flex items-center gap-3">
              {notificationPermission === 'granted' ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Włączone
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      new Notification('Test powiadomienia', {
                        body: 'Powiadomienia działają poprawnie!',
                        icon: '/vite.svg',
                      });
                    }}
                  >
                    Testuj
                  </Button>
                </div>
              ) : notificationPermission === 'denied' ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <BellOff className="h-4 w-4" />
                  Zablokowane (zmień w ustawieniach przeglądarki)
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestPermission}
                  className="gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Włącz powiadomienia
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Wymagane do przypomnień o zadaniach
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
