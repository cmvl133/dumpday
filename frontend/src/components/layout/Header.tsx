import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, ClipboardCheck, Settings, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { openCheckIn, fetchCheckInTasks } from '@/store/checkInSlice';
import { openPlanning, fetchPlanningTasks } from '@/store/planningSlice';

export function Header() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const tagline = useMemo(() => {
    const taglines = t('header.taglines', { returnObjects: true }) as string[];
    return taglines[Math.floor(Math.random() * taglines.length)];
  }, [t]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleCheckIn = () => {
    dispatch(openCheckIn());
    dispatch(fetchCheckInTasks());
  };

  const handlePlanning = () => {
    dispatch(openPlanning());
    dispatch(fetchPlanningTasks());
  };

  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Dopaminder
              </h1>
              <p className="text-sm text-muted-foreground">
                {tagline}
              </p>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlanning}
                  className="text-muted-foreground hover:text-foreground"
                  title={t('planning.title')}
                >
                  <CalendarClock className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCheckIn}
                  className="text-muted-foreground hover:text-foreground"
                  title={t('checkIn.title')}
                >
                  <ClipboardCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                  title={t('settings.title')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground hidden sm:inline ml-2">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">{t('auth.logout')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
