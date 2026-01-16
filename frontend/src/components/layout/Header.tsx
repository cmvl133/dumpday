import { useState } from 'react';
import { LogOut, ClipboardCheck, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { openCheckIn, fetchCheckInTasks } from '@/store/checkInSlice';

export function Header() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleCheckIn = () => {
    dispatch(openCheckIn());
    dispatch(fetchCheckInTasks());
  };

  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                DumpDay
              </h1>
              <p className="text-sm text-muted-foreground">
                Dump your thoughts. Own your day.
              </p>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCheckIn}
                  className="text-muted-foreground hover:text-foreground"
                  title="Check-in"
                >
                  <ClipboardCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Ustawienia"
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
                  <span className="ml-2 hidden sm:inline">Wyloguj</span>
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
