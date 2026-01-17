import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { TimeEstimationStep } from '@/components/planning/TimeEstimationStep';
import { FixedTimeStep } from '@/components/planning/FixedTimeStep';
import { CombineEventsStep } from '@/components/planning/CombineEventsStep';
import { ConflictStep } from '@/components/planning/ConflictStep';
import { PlanSummary } from '@/components/planning/PlanSummary';
import {
  backToSelection,
  closeModal,
  fetchPlanningTasks,
  nextPlanningStep,
  previousPlanningStep,
  nextPlanningTask,
  skipPlanningTask,
  setEstimation,
  setFixedTime,
  setCombineEvents,
  setNeedsFullFocus,
  markTaskPlanned,
  generateSchedule,
  acceptSchedule,
  savePlanningTask,
  resolveConflict,
  nextConflict,
  finishConflictPhase,
} from '@/store/howAreYouSlice';
import { fetchDailyNote } from '@/store/dailyNoteSlice';
import type { RootState, AppDispatch } from '@/store';
import type { ScheduleSuggestion } from '@/types';

export function PlanningFlow() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const {
    tasks,
    conflictingTasks,
    events,
    currentPhase,
    currentIndex,
    currentStep,
    taskPlanData,
    generatedSchedule,
    stats,
    isLoading,
    isGenerating,
  } = useSelector((state: RootState) => state.howAreYou.planning);
  const error = useSelector((state: RootState) => state.howAreYou.error);
  const { currentDate } = useSelector((state: RootState) => state.dailyNote);

  const totalTasks = tasks.length;
  const totalConflicts = conflictingTasks.length;
  const currentTask = currentPhase === 'conflicts' ? conflictingTasks[currentIndex] : tasks[currentIndex];
  const isComplete = currentPhase === 'planning' && currentIndex >= totalTasks;

  useEffect(() => {
    dispatch(fetchPlanningTasks());
  }, [dispatch]);

  const handleClose = useCallback(() => {
    if (generatedSchedule) {
      dispatch(fetchDailyNote(currentDate));
    }
    dispatch(closeModal());
  }, [dispatch, generatedSchedule, currentDate]);

  const handleBack = useCallback(() => {
    dispatch(backToSelection());
  }, [dispatch]);

  const handleEstimation = useCallback(
    (minutes: number) => {
      if (!currentTask) return;
      dispatch(setEstimation({ taskId: currentTask.id, minutes }));
      dispatch(nextPlanningStep());
    },
    [currentTask, dispatch]
  );

  const handleFixedTime = useCallback(
    (time: string | null) => {
      if (!currentTask) return;
      dispatch(setFixedTime({ taskId: currentTask.id, time }));
      dispatch(nextPlanningStep());
    },
    [currentTask, dispatch]
  );

  const handleCombineEvents = useCallback(
    async (eventIds: number[]) => {
      if (!currentTask) return;
      dispatch(setCombineEvents({ taskId: currentTask.id, eventIds }));

      // Save complete task planning data to backend
      const currentTaskData = taskPlanData[currentTask.id] || {};
      const dataToSave = {
        ...currentTaskData,
        canCombineWithEvents: eventIds.length > 0 ? eventIds : null,
        needsFullFocus: false,
      };
      await dispatch(savePlanningTask({ taskId: currentTask.id, data: dataToSave }));

      dispatch(markTaskPlanned());
      dispatch(nextPlanningTask());
    },
    [currentTask, dispatch, taskPlanData]
  );

  const handleNeedsFullFocus = useCallback(async () => {
    if (!currentTask) return;
    dispatch(setNeedsFullFocus({ taskId: currentTask.id, needsFocus: true }));

    // Save complete task planning data to backend
    const currentTaskData = taskPlanData[currentTask.id] || {};
    const dataToSave = {
      ...currentTaskData,
      canCombineWithEvents: null,
      needsFullFocus: true,
    };
    await dispatch(savePlanningTask({ taskId: currentTask.id, data: dataToSave }));

    dispatch(markTaskPlanned());
    dispatch(nextPlanningTask());
  }, [currentTask, dispatch, taskPlanData]);

  const handleSkip = useCallback(() => {
    dispatch(skipPlanningTask());
  }, [dispatch]);

  const handleStepBack = useCallback(() => {
    dispatch(previousPlanningStep());
  }, [dispatch]);

  const handleKeepConflict = useCallback(() => {
    if (!currentTask) return;
    dispatch(resolveConflict({ taskId: currentTask.id, resolution: 'keep' }));
    if (currentIndex + 1 >= totalConflicts) {
      dispatch(finishConflictPhase());
    } else {
      dispatch(nextConflict());
    }
  }, [currentTask, currentIndex, totalConflicts, dispatch]);

  const handleRescheduleConflict = useCallback(() => {
    if (!currentTask) return;
    dispatch(resolveConflict({ taskId: currentTask.id, resolution: 'reschedule' }));
    if (currentIndex + 1 >= totalConflicts) {
      dispatch(finishConflictPhase());
    } else {
      dispatch(nextConflict());
    }
  }, [currentTask, currentIndex, totalConflicts, dispatch]);

  const handleGenerateSchedule = useCallback(() => {
    const plannedTaskIds = Object.keys(taskPlanData).map(Number);
    if (plannedTaskIds.length > 0) {
      dispatch(generateSchedule(plannedTaskIds));
    }
  }, [dispatch, taskPlanData]);

  const handleAcceptSchedule = useCallback(
    async (modifiedSchedule?: ScheduleSuggestion[]) => {
      await dispatch(acceptSchedule(modifiedSchedule));
      dispatch(fetchDailyNote(currentDate));
      dispatch(closeModal());
    },
    [dispatch, currentDate]
  );

  const renderStepIndicator = () => {
    const steps = ['estimation', 'fixed_time', 'combine'] as const;
    const stepIndex = steps.indexOf(currentStep);

    return (
      <div className="flex justify-center gap-2 mb-4">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-colors ${
              index <= stepIndex ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    );
  };

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

  if (totalTasks === 0 && totalConflicts === 0) {
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
          <p className="text-lg font-medium mb-2">{t('planning.noTasks')}</p>
          <p className="text-muted-foreground">{t('planning.noTasksDesc')}</p>
        </div>
      </div>
    );
  }

  if (currentPhase === 'conflicts' && totalConflicts > 0) {
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
            <span>{t('planning.conflict.header')}</span>
            <span>
              {currentIndex + 1} / {totalConflicts}
            </span>
          </div>
          <Progress value={currentIndex} max={totalConflicts} />
        </div>

        {currentTask && (
          <ConflictStep
            key={`conflict-${currentTask.id}`}
            task={currentTask}
            onKeep={handleKeepConflict}
            onReschedule={handleRescheduleConflict}
          />
        )}
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-muted-foreground">{t('planning.generating')}</p>
      </div>
    );
  }

  if (generatedSchedule) {
    return (
      <PlanSummary
        schedule={generatedSchedule}
        tasks={tasks}
        stats={stats}
        onAccept={handleAcceptSchedule}
      />
    );
  }

  if (isComplete) {
    return (
      <div className="space-y-6 py-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('howAreYou.back')}
        </button>

        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">{t('planning.planningComplete')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('planning.tasksPlanned', { count: stats.planned })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.planned}</div>
            <div className="text-muted-foreground">{t('planning.planned')}</div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.skipped}</div>
            <div className="text-muted-foreground">{t('planning.skipped')}</div>
          </div>
          <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-secondary">
              {Math.round((stats.totalMinutes / 60) * 10) / 10}h
            </div>
            <div className="text-muted-foreground">{t('planning.totalTime')}</div>
          </div>
        </div>

        {stats.planned > 0 ? (
          <button
            onClick={handleGenerateSchedule}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            {t('planning.generateSchedule')}
          </button>
        ) : (
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-lg bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
          >
            {t('common.close')}
          </button>
        )}
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
          <span>{t('planning.task')}</span>
          <span>
            {currentIndex + 1} / {totalTasks}
          </span>
        </div>
        <Progress value={currentIndex} max={totalTasks} />
      </div>

      {renderStepIndicator()}

      {currentTask && (
        <div className="text-center mb-4">
          <h2 className="text-lg font-medium">{currentTask.title}</h2>
        </div>
      )}

      {currentTask && currentStep === 'estimation' && (
        <TimeEstimationStep
          key={`${currentTask.id}-estimation`}
          onSelect={handleEstimation}
          onSkip={handleSkip}
        />
      )}

      {currentTask && currentStep === 'fixed_time' && (
        <FixedTimeStep
          key={`${currentTask.id}-fixed`}
          onSelect={handleFixedTime}
          onBack={handleStepBack}
        />
      )}

      {currentTask && currentStep === 'combine' && (
        <CombineEventsStep
          key={`${currentTask.id}-combine`}
          events={events}
          onSelect={handleCombineEvents}
          onNeedsFullFocus={handleNeedsFullFocus}
          onBack={handleStepBack}
        />
      )}
    </div>
  );
}
