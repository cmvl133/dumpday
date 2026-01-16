import { useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { TaskCard } from './TaskCard';
import { ComboCounter } from './ComboCounter';
import { SummaryScreen } from './SummaryScreen';
import {
  closeCheckIn,
  fetchCheckInTasks,
  performTaskAction,
  completeCheckIn,
  nextTask,
  incrementCombo,
  resetCombo,
  incrementStat,
} from '@/store/checkInSlice';
import { fetchDailyNote } from '@/store/dailyNoteSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CheckInTask } from '@/types';

export function CheckInModal() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    isOpen,
    tasks,
    currentIndex,
    combo,
    stats,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.checkIn);
  const { zenMode } = useSelector((state: RootState) => state.settings);
  const { currentDate } = useSelector((state: RootState) => state.dailyNote);

  const allTasks = useMemo<{ task: CheckInTask; isOverdue: boolean }[]>(() => {
    const overdue = tasks.overdue.map((t) => ({ task: t, isOverdue: true }));
    const today = tasks.today.map((t) => ({ task: t, isOverdue: false }));
    return [...overdue, ...today];
  }, [tasks]);

  const totalTasks = allTasks.length;
  const currentTask = allTasks[currentIndex];
  const isComplete = currentIndex >= totalTasks;

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCheckInTasks());
    }
  }, [isOpen, dispatch]);

  const handleClose = useCallback(() => {
    if (isComplete && totalTasks > 0) {
      dispatch(completeCheckIn(stats));
      dispatch(fetchDailyNote(currentDate));
    }
    dispatch(closeCheckIn());
  }, [dispatch, isComplete, totalTasks, stats, currentDate]);

  const handleTaskAction = useCallback(
    async (action: 'done' | 'tomorrow' | 'today') => {
      if (!currentTask) return;

      try {
        await dispatch(
          performTaskAction({ taskId: currentTask.task.id, action })
        ).unwrap();

        if (action === 'done') {
          dispatch(incrementCombo());
          dispatch(incrementStat('done'));

          if (currentTask.isOverdue) {
            dispatch(incrementStat('overdueCleared'));
          }

          // Celebration effects!
          if (!zenMode) {
            const newCombo = combo + 1;

            // Always show small confetti burst
            confetti({
              particleCount: 30,
              spread: 50,
              origin: { x: 0.5, y: 0.6 },
              colors: ['#14b8a6', '#22c55e', '#a3e635'],
              startVelocity: 25,
              gravity: 0.8,
            });

            // Medium combo - side cannons
            if (newCombo >= 3) {
              setTimeout(() => {
                confetti({
                  particleCount: 20,
                  angle: 60,
                  spread: 40,
                  origin: { x: 0 },
                  colors: ['#f59e0b', '#eab308', '#fbbf24'],
                });
                confetti({
                  particleCount: 20,
                  angle: 120,
                  spread: 40,
                  origin: { x: 1 },
                  colors: ['#f59e0b', '#eab308', '#fbbf24'],
                });
              }, 100);
            }

            // High combo - full explosion!
            if (newCombo >= 5) {
              setTimeout(() => {
                confetti({
                  particleCount: 80,
                  spread: 100,
                  origin: { y: 0.5 },
                  colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6'],
                  startVelocity: 35,
                });
              }, 200);
            }

            // Epic combo - stars!
            if (newCombo >= 7) {
              setTimeout(() => {
                confetti({
                  particleCount: 50,
                  spread: 360,
                  origin: { x: 0.5, y: 0.5 },
                  shapes: ['star'],
                  colors: ['#fbbf24', '#fcd34d', '#fef08a'],
                  scalar: 1.2,
                  startVelocity: 40,
                });
              }, 300);
            }
          }
        } else {
          dispatch(resetCombo());

          if (action === 'tomorrow') {
            dispatch(incrementStat('tomorrow'));
          } else if (action === 'today') {
            dispatch(incrementStat('today'));
          }
        }

        dispatch(nextTask());
      } catch {
        // Error handled by Redux
      }
    },
    [currentTask, dispatch, combo, zenMode]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Check-in</DialogTitle>
        <DialogDescription className="sr-only">
          Przejrzyj swoje zadania
        </DialogDescription>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">{error}</div>
        ) : totalTasks === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-medium mb-2">Brak zadan do przejrzenia</p>
            <p className="text-muted-foreground">Wszystko ogarnięte! 🎉</p>
          </div>
        ) : isComplete ? (
          <SummaryScreen
            stats={stats}
            totalTasks={totalTasks}
            onClose={handleClose}
          />
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {currentTask?.isOverdue ? 'Zalegla' : 'Dzisiaj'}
                </span>
                <span>
                  {currentIndex + 1} / {totalTasks}
                </span>
              </div>
              <Progress value={currentIndex} max={totalTasks} />
            </div>

            {!zenMode && <ComboCounter combo={combo} />}

            {currentTask && (
              <TaskCard
                key={currentTask.task.id}
                task={currentTask.task}
                isOverdue={currentTask.isOverdue}
                onAction={handleTaskAction}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
