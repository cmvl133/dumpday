import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Calendar,
  Lightbulb,
  StickyNote,
  Heart,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskList } from './TaskList';
import { NotesList } from './NotesList';
import { JournalSection } from './JournalSection';
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
  onUpdateTaskReminder?: (id: number, reminderTime: string | null) => void;
  onUpdateNote?: (id: number, content: string) => void;
  onDeleteNote?: (id: number) => void;
  onUpdateJournal?: (id: number, content: string) => void;
  onDeleteJournal?: (id: number) => void;
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
  onUpdateTaskReminder,
  onUpdateNote,
  onDeleteNote,
  onUpdateJournal,
  onDeleteJournal,
}: AnalysisResultsProps) {
  const { t } = useTranslation();
  const [collapsedBoxes, setCollapsedBoxes] = useState<BoxId[]>([]);

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

  const todayCount = tasks.today?.length || 0;
  const scheduledCount = tasks.scheduled?.length || 0;
  const somedayCount = tasks.someday?.length || 0;

  return (
    <div className="space-y-4">
      {isPreview && (
        <Badge variant="secondary" className="mb-2">
          {t('brainDump.analysisPreview')}
        </Badge>
      )}

      {/* TODO Today - always visible, cannot collapse */}
      <CollapsibleCard
        icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        title={t('tasks.today')}
        count={todayCount}
        isCollapsed={false}
        canCollapse={false}
      >
        <TaskList
          tasks={tasks.today || []}
          currentDate={currentDate}
          isTodaySection={true}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onUpdate={onUpdateTask}
          onUpdateDueDate={onUpdateTaskDueDate}
          onUpdateReminder={onUpdateTaskReminder}
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
          tasks={tasks.scheduled || []}
          currentDate={currentDate}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onUpdate={onUpdateTask}
          onUpdateDueDate={onUpdateTaskDueDate}
          onUpdateReminder={onUpdateTaskReminder}
          isPreview={isPreview}
        />
      </CollapsibleCard>

      {/* TODO Someday */}
      <CollapsibleCard
        id="someday"
        icon={<Lightbulb className="h-4 w-4 text-yellow-600" />}
        title={t('tasks.later')}
        count={somedayCount}
        isCollapsed={isCollapsed('someday')}
        onToggle={() => toggleBox('someday')}
      >
        <TaskList
          tasks={tasks.someday || []}
          currentDate={currentDate}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
          onUpdate={onUpdateTask}
          onUpdateDueDate={onUpdateTaskDueDate}
          onUpdateReminder={onUpdateTaskReminder}
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
          isPreview={isPreview}
          onUpdate={onUpdateNote}
          onDelete={onDeleteNote}
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
        />
      </CollapsibleCard>
    </div>
  );
}
