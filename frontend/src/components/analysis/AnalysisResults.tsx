import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Calendar,
  Lightbulb,
  StickyNote,
  Heart,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskList } from './TaskList';
import { NotesList } from './NotesList';
import { JournalSection } from './JournalSection';
import { TagFilterBar } from '@/components/tags/TagFilterBar';
import { useTagFilter } from '@/hooks/useTagFilter';
import { cn } from '@/lib/utils';
import type { AnalysisResponse, DailyNoteData } from '@/types';

const COLLAPSED_BOXES_KEY = 'dopaminder_collapsed_boxes';

type BoxId = 'scheduled' | 'someday' | 'notes' | 'journal';

function getCollapsedBoxes(): BoxId[] {
  try {
    const stored = localStorage.getItem(COLLAPSED_BOXES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCollapsedBoxes(boxes: BoxId[]): void {
  try {
    localStorage.setItem(COLLAPSED_BOXES_KEY, JSON.stringify(boxes));
  } catch {
    // Ignore storage errors
  }
}

interface AnalysisResultsProps {
  data: AnalysisResponse | DailyNoteData;
  currentDate?: string;
  isPreview?: boolean;
  onToggleTask?: (id: number, isCompleted: boolean) => void;
  onDeleteTask?: (id: number) => void;
  onUpdateTask?: (id: number, title: string) => void;
  onUpdateTaskDueDate?: (id: number, dueDate: string | null) => void;
  onUpdateTaskFixedTime?: (id: number, fixedTime: string | null) => void;
  onTaskTagsChange?: (id: number, tagIds: number[]) => void;
  onAddTask?: (title: string, dueDate: string | null, category: 'today' | 'scheduled' | 'someday') => void;
  onUpdateNote?: (id: number, content: string) => void;
  onDeleteNote?: (id: number) => void;
  onAddNote?: (content: string) => void;
  onUpdateJournal?: (id: number, content: string) => void;
  onDeleteJournal?: (id: number) => void;
  onAddJournal?: (content: string) => void;
}

interface CollapsibleCardProps {
  id?: BoxId;
  icon: React.ReactNode;
  title: string;
  count: number;
  isCollapsed: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  canCollapse?: boolean;
}

function CollapsibleCard({
  icon,
  title,
  count,
  isCollapsed,
  onToggle,
  children,
  canCollapse = true,
}: CollapsibleCardProps) {
  return (
    <Card>
      <CardHeader
        className={cn(
          'pb-3',
          canCollapse && 'cursor-pointer select-none hover:bg-muted/30 transition-colors'
        )}
        onClick={canCollapse ? onToggle : undefined}
      >
        <CardTitle className="text-base flex items-center gap-2">
          {canCollapse && (
            isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )
          )}
          {icon}
          {title}
          {count > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {count}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isCollapsed ? 'max-h-0' : 'max-h-[2000px]'
        )}
      >
        <CardContent>{children}</CardContent>
      </div>
    </Card>
  );
}

export function AnalysisResults({
  data,
  currentDate,
  isPreview = false,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onUpdateTaskDueDate,
  onUpdateTaskFixedTime,
  onTaskTagsChange,
  onAddTask,
  onUpdateNote,
  onDeleteNote,
  onAddNote,
  onUpdateJournal,
  onDeleteJournal,
  onAddJournal,
}: AnalysisResultsProps) {
  const { t } = useTranslation();
  const [collapsedBoxes, setCollapsedBoxes] = useState<BoxId[]>([]);
  const { filterTasks } = useTagFilter();

  useEffect(() => {
    setCollapsedBoxes(getCollapsedBoxes());
  }, []);

  const toggleBox = (boxId: BoxId) => {
    setCollapsedBoxes((prev) => {
      const newBoxes = prev.includes(boxId)
        ? prev.filter((id) => id !== boxId)
        : [...prev, boxId];
      saveCollapsedBoxes(newBoxes);
      return newBoxes;
    });
  };

  const isCollapsed = (boxId: BoxId) => collapsedBoxes.includes(boxId);

  const tasks = data.tasks;
  const notes = data.notes;
  const journal = data.journal;

  // Apply tag filtering to tasks (only for saved tasks with IDs)
  const filteredTasks = useMemo(() => {
    // Type guard to check if tasks have ids (are saved tasks)
    const hasTags = (taskArray: typeof tasks.today) => {
      return taskArray.every((t) => 'id' in t);
    };

    const todayTasks = tasks.today || [];
    const scheduledTasks = tasks.scheduled || [];
    const somedayTasks = tasks.someday || [];
    const overdueTasks = 'overdue' in tasks ? (tasks as DailyNoteData['tasks']).overdue || [] : [];

    return {
      today: hasTags(todayTasks) ? filterTasks(todayTasks as DailyNoteData['tasks']['today']) : todayTasks,
      scheduled: hasTags(scheduledTasks) ? filterTasks(scheduledTasks as DailyNoteData['tasks']['scheduled']) : scheduledTasks,
      someday: hasTags(somedayTasks) ? filterTasks(somedayTasks as DailyNoteData['tasks']['someday']) : somedayTasks,
      overdue: filterTasks(overdueTasks),
    };
  }, [tasks, filterTasks]);

  // Use filtered counts when filtering is active
  const todayCount = filteredTasks.today.length;
  const scheduledCount = filteredTasks.scheduled.length;
  const somedayCount = filteredTasks.someday.length;
  const overdueCount = filteredTasks.overdue.length;
  const laterCount = somedayCount + overdueCount;

  // Later section should auto-expand if there are overdue tasks
  const hasOverdue = overdueCount > 0;
  const laterSectionCollapsed = useMemo(() => {
    if (hasOverdue) return false; // Always expanded if overdue
    return isCollapsed('someday');
  }, [hasOverdue, collapsedBoxes]);

  // Get later section title with overdue count
  const laterTitle = useMemo(() => {
    if (overdueCount > 0) {
      return `${t('tasks.later')} (${overdueCount} ${t('tasks.overdue').toLowerCase()})`;
    }
    return t('tasks.later');
  }, [overdueCount, t]);

  return (
    <div className="space-y-4">
      {isPreview && (
        <Badge variant="secondary" className="mb-2">
          {t('brainDump.analysisPreview')}
        </Badge>
      )}

      {/* Tag Filter Bar */}
      {!isPreview && <TagFilterBar />}

      {/* TODO Today - always visible, cannot collapse */}
      <CollapsibleCard
        icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        title={t('tasks.today')}
        count={todayCount}
        isCollapsed={false}
        canCollapse={false}
      >
        <TaskList
          tasks={filteredTasks.today}
          currentDate={currentDate}
          isTodaySection={true}
          sectionType="today"
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onUpdate={onUpdateTask}
          onUpdateDueDate={onUpdateTaskDueDate}
          onUpdateFixedTime={onUpdateTaskFixedTime}
          onTagsChange={onTaskTagsChange}
          onAdd={onAddTask}
          isPreview={isPreview}
        />
      </CollapsibleCard>

      {/* TODO Scheduled */}
      <CollapsibleCard
        id="scheduled"
        icon={<Calendar className="h-4 w-4 text-blue-600" />}
        title={t('tasks.thisWeek')}
        count={scheduledCount}
        isCollapsed={isCollapsed('scheduled')}
        onToggle={() => toggleBox('scheduled')}
      >
        <TaskList
          tasks={filteredTasks.scheduled}
          currentDate={currentDate}
          sectionType="scheduled"
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onUpdate={onUpdateTask}
          onUpdateDueDate={onUpdateTaskDueDate}
          onUpdateFixedTime={onUpdateTaskFixedTime}
          onTagsChange={onTaskTagsChange}
          onAdd={onAddTask}
          isPreview={isPreview}
        />
      </CollapsibleCard>

      {/* TODO Later (Someday + Overdue) */}
      <CollapsibleCard
        id="someday"
        icon={hasOverdue ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <Lightbulb className="h-4 w-4 text-yellow-600" />}
        title={laterTitle}
        count={laterCount}
        isCollapsed={laterSectionCollapsed}
        onToggle={() => toggleBox('someday')}
      >
        {/* Overdue tasks first */}
        {overdueCount > 0 && (
          <div className="mb-4">
            <TaskList
              tasks={filteredTasks.overdue}
              currentDate={currentDate}
              sectionType="someday"
              isOverdue={true}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              onUpdate={onUpdateTask}
              onUpdateDueDate={onUpdateTaskDueDate}
              onUpdateFixedTime={onUpdateTaskFixedTime}
              onTagsChange={onTaskTagsChange}
              isPreview={isPreview}
            />
          </div>
        )}
        {/* Regular someday tasks */}
        <TaskList
          tasks={filteredTasks.someday}
          currentDate={currentDate}
          sectionType="someday"
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onUpdate={onUpdateTask}
          onUpdateDueDate={onUpdateTaskDueDate}
          onUpdateFixedTime={onUpdateTaskFixedTime}
          onTagsChange={onTaskTagsChange}
          onAdd={onAddTask}
          isPreview={isPreview}
        />
      </CollapsibleCard>

      {/* Notes */}
      <CollapsibleCard
        id="notes"
        icon={<StickyNote className="h-4 w-4 text-orange-600" />}
        title={t('tasks.notes')}
        count={notes.length}
        isCollapsed={isCollapsed('notes')}
        onToggle={() => toggleBox('notes')}
      >
        <NotesList
          notes={notes}
          currentDate={currentDate}
          isPreview={isPreview}
          onUpdate={onUpdateNote}
          onDelete={onDeleteNote}
          onAdd={onAddNote}
        />
      </CollapsibleCard>

      {/* Journal */}
      <CollapsibleCard
        id="journal"
        icon={<Heart className="h-4 w-4 text-pink-600" />}
        title={t('tasks.journal')}
        count={journal.length}
        isCollapsed={isCollapsed('journal')}
        onToggle={() => toggleBox('journal')}
      >
        <JournalSection
          entries={journal}
          isPreview={isPreview}
          onUpdate={onUpdateJournal}
          onDelete={onDeleteJournal}
          onAdd={onAddJournal}
        />
      </CollapsibleCard>
    </div>
  );
}
