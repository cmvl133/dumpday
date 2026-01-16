import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
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
import type { CheckInInterval, Language, ReminderTone } from '@/types';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { checkInInterval, zenMode, soundEnabled, reminderTone, language } = useSelector(
    (state: RootState) => state.settings
  );
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const INTERVAL_OPTIONS: { value: CheckInInterval; label: string }[] = [
    { value: 'off', label: language === 'pl' ? 'Wyłączony' : 'Off' },
    { value: '2h', label: language === 'pl' ? 'Co 2 godziny' : 'Every 2 hours' },
    { value: '3h', label: language === 'pl' ? 'Co 3 godziny' : 'Every 3 hours' },
    { value: '4h', label: language === 'pl' ? 'Co 4 godziny' : 'Every 4 hours' },
  ];

  const TONE_OPTIONS: { value: ReminderTone; label: string }[] = [
    { value: 'gentle', label: language === 'pl' ? 'Delikatny' : 'Gentle' },
    { value: 'normal', label: language === 'pl' ? 'Normalny' : 'Normal' },
    { value: 'aggressive', label: language === 'pl' ? 'Agresywny' : 'Aggressive' },
    { value: 'vulgar', label: language === 'pl' ? 'Wulgarny' : 'Vulgar' },
    { value: 'bigpoppapump', label: 'Big Poppa Pump' },
  ];

  const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'pl', label: 'Polski' },
  ];

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

  const handleLanguageChange = (value: Language) => {
    dispatch(updateSettings({ language: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
          <DialogDescription>
            {language === 'pl'
              ? 'Dostosuj działanie aplikacji do swoich potrzeb.'
              : 'Customize the app to your needs.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('settings.language')}
            </label>
            <select
              value={language}
              onChange={(e) =>
                handleLanguageChange(e.target.value as Language)
              }
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              {language === 'pl' ? 'Automatyczny check-in' : 'Auto check-in'}
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
              {language === 'pl'
                ? 'Jak często przypominać o przejrzeniu zadań'
                : 'How often to remind you to review tasks'}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('settings.tone')}
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
              {language === 'pl'
                ? 'Styl komunikatów przypominających i combo'
                : 'Style of reminder messages and combo comments'}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('settings.notifications')}
            </label>
            <div className="flex items-center gap-3">
              {notificationPermission === 'granted' ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    {language === 'pl' ? 'Włączone' : 'Enabled'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      new Notification(
                        language === 'pl' ? 'Test powiadomienia' : 'Test notification',
                        {
                          body: language === 'pl'
                            ? 'Powiadomienia działają poprawnie!'
                            : 'Notifications are working!',
                          icon: '/vite.svg',
                        }
                      );
                    }}
                  >
                    {language === 'pl' ? 'Testuj' : 'Test'}
                  </Button>
                </div>
              ) : notificationPermission === 'denied' ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <BellOff className="h-4 w-4" />
                  {language === 'pl'
                    ? 'Zablokowane (zmień w ustawieniach przeglądarki)'
                    : 'Blocked (change in browser settings)'}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestPermission}
                  className="gap-2"
                >
                  <Bell className="h-4 w-4" />
                  {t('settings.enableNotifications')}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'pl'
                ? 'Wymagane do przypomnień o zadaniach'
                : 'Required for task reminders'}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">{t('settings.zenMode')}</label>
              <p className="text-xs text-muted-foreground">
                {t('settings.zenModeDesc')}
              </p>
            </div>
            <Checkbox
              checked={zenMode}
              onCheckedChange={handleZenModeChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">
                {language === 'pl' ? 'Dźwięki' : 'Sounds'}
              </label>
              <p className="text-xs text-muted-foreground">
                {language === 'pl'
                  ? 'Efekty dźwiękowe przy akcjach'
                  : 'Sound effects for actions'}
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
