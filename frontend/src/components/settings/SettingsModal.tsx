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
import { TagManager } from '@/components/tags/TagManager';
import { updateSettings } from '@/store/settingsSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CheckInInterval, ConfettiStyle, Language, ReminderTone } from '@/types';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TONE_VALUES: ReminderTone[] = ['gentle', 'normal', 'aggressive', 'vulgar', 'bigpoppapump'];
const INTERVAL_VALUES: CheckInInterval[] = ['off', '1h', '2h', '3h', '4h'];
const CONFETTI_VALUES: ConfettiStyle[] = ['classic', 'stars', 'explosion', 'neon', 'fire'];

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { checkInInterval, zenMode, reminderTone, language, confettiStyle } = useSelector(
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

  const handleToneChange = (value: ReminderTone) => {
    dispatch(updateSettings({ reminderTone: value }));
  };

  const handleLanguageChange = (value: Language) => {
    dispatch(updateSettings({ language: value }));
  };

  const handleConfettiStyleChange = (value: ConfettiStyle) => {
    dispatch(updateSettings({ confettiStyle: value }));
  };

  const getIntervalLabel = (interval: CheckInInterval): string => {
    const labels: Record<CheckInInterval, string> = {
      off: t('settings.intervalOff'),
      '1h': t('settings.interval1h'),
      '2h': t('settings.interval2h'),
      '3h': t('settings.interval3h'),
      '4h': t('settings.interval4h'),
    };
    return labels[interval];
  };

  const getConfettiLabel = (style: ConfettiStyle): string => {
    const labels: Record<ConfettiStyle, string> = {
      classic: t('settings.confettiClassic'),
      stars: t('settings.confettiStars'),
      explosion: t('settings.confettiExplosion'),
      neon: t('settings.confettiNeon'),
      fire: t('settings.confettiFire'),
    };
    return labels[style];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
          <DialogDescription>
            {t('settings.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('settings.language')}
            </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="en">English</option>
              <option value="pl">Polski</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('settings.autoCheckIn')}
            </label>
            <select
              value={checkInInterval}
              onChange={(e) => handleIntervalChange(e.target.value as CheckInInterval)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {INTERVAL_VALUES.map((interval) => (
                <option key={interval} value={interval}>
                  {getIntervalLabel(interval)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {t('settings.autoCheckInDesc')}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('settings.tone')}
            </label>
            <select
              value={reminderTone}
              onChange={(e) => handleToneChange(e.target.value as ReminderTone)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TONE_VALUES.map((tone) => (
                <option key={tone} value={tone}>
                  {t(`tones.${tone}.name`)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {t('settings.toneDesc')}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('settings.confettiStyle')}
            </label>
            <select
              value={confettiStyle}
              onChange={(e) => handleConfettiStyleChange(e.target.value as ConfettiStyle)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CONFETTI_VALUES.map((style) => (
                <option key={style} value={style}>
                  {getConfettiLabel(style)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {t('settings.confettiStyleDesc')}
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
                    {t('settings.notificationsEnabled')}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      new Notification(t('settings.testNotificationTitle'), {
                        body: t('settings.testNotificationBody'),
                        icon: '/vite.svg',
                      });
                    }}
                  >
                    {t('settings.testNotification')}
                  </Button>
                </div>
              ) : notificationPermission === 'denied' ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <BellOff className="h-4 w-4" />
                  {t('settings.notificationsBlocked')}
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
              {t('settings.notificationsDesc')}
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

          <div className="space-y-3 pt-3 border-t">
            <label className="text-sm font-medium">
              {t('tags.title')}
            </label>
            <TagManager />
            <p className="text-xs text-muted-foreground">
              {t('tags.manageTagsDesc')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
