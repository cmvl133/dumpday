import { useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { TaskCard } from '@/components/check-in/TaskCard';
import { ComboCounter } from '@/components/check-in/ComboCounter';
import { SummaryScreen } from '@/components/check-in/SummaryScreen';
import { backToSelection, closeModal } from '@/store/howAreYouSlice';
import {
  fetchCheckInTasks,
  performTaskAction,
  completeCheckIn,
  nextTask,
  incrementCombo,
  resetCombo,
  incrementStat,
} from '@/store/checkInFlowSlice';
import { fetchDailyNote } from '@/store/dailyNoteSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CheckInTask } from '@/types';

export function CheckInFlow() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, currentIndex, combo, stats, isLoading, error } = useSelector(
    (state: RootState) => state.checkInFlow
  );
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
    dispatch(fetchCheckInTasks());
  }, [dispatch]);

  const handleClose = useCallback(() => {
    if (isComplete && totalTasks > 0) {
      dispatch(completeCheckIn(stats));
      dispatch(fetchDailyNote(currentDate));
    }
    dispatch(closeModal());
  }, [dispatch, isComplete, totalTasks, stats, currentDate]);

  const handleBack = useCallback(() => {
    dispatch(backToSelection());
  }, [dispatch]);

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

            // Always show small confetti burst - punk pink
            confetti({
              particleCount: 30,
              spread: 50,
              origin: { x: 0.5, y: 0.6 },
              colors: ['#ff2d7a', '#ff69b4', '#ff1493'],
              startVelocity: 25,
              gravity: 0.8,
            });

            // Medium combo - side cannons - electric blue
            if (newCombo >= 3) {
              setTimeout(() => {
                confetti({
                  particleCount: 20,
                  angle: 60,
                  spread: 40,
                  origin: { x: 0 },
                  colors: ['#00d4ff', '#00bfff', '#1e90ff'],
                });
                confetti({
                  particleCount: 20,
                  angle: 120,
                  spread: 40,
                  origin: { x: 1 },
                  colors: ['#00d4ff', '#00bfff', '#1e90ff'],
                });
              }, 100);
            }

            // High combo - full explosion! - all punk colors
            if (newCombo >= 5) {
              setTimeout(() => {
                confetti({
                  particleCount: 80,
                  spread: 100,
                  origin: { y: 0.5 },
                  colors: ['#ff2d7a', '#00d4ff', '#00ff88', '#ffee00', '#ff3333'],
                  startVelocity: 35,
                });
              }, 200);
            }

            // Epic combo - stars! - neon yellow/green
            if (newCombo >= 7) {
              setTimeout(() => {
                confetti({
                  particleCount: 50,
                  spread: 360,
                  origin: { x: 0.5, y: 0.5 },
                  shapes: ['star'],
                  colors: ['#ffee00', '#00ff88', '#ff2d7a'],
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-destructive">{error}</div>;
  }

  if (totalTasks === 0) {
    return (
      <div className="py-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('howAreYou.back')}
        </button>
        <div className="text-center py-8">
          <p className="text-lg font-medium mb-2">{t('checkIn.noTasks')}</p>
          <p className="text-muted-foreground">{t('checkIn.allDone')}</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="py-4">
        <SummaryScreen
          stats={stats}
          totalTasks={totalTasks}
          onClose={handleClose}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('howAreYou.back')}
      </button>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {currentTask?.isOverdue ? t('checkIn.overdue') : t('checkIn.today')}
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
  );
}
