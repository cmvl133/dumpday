import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchHealth } from './store/healthSlice';
import { Button } from './components/ui/button';

function App() {
  const dispatch = useAppDispatch();
  const { status, loading, error } = useAppSelector((state) => state.health);

  useEffect(() => {
    dispatch(fetchHealth());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchHealth());
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">React + Symfony Boilerplate</h1>

        <div className="space-y-2">
          <p className="text-muted-foreground">API Health Status:</p>
          {loading && <p className="text-yellow-500">Loading...</p>}
          {error && <p className="text-destructive">Error: {error}</p>}
          {status && (
            <p className="text-green-500 font-semibold">
              Status: {status.status}
            </p>
          )}
        </div>

        <Button onClick={handleRefresh} disabled={loading}>
          {loading ? 'Checking...' : 'Check API Health'}
        </Button>
      </div>
    </div>
  );
}

export default App;
