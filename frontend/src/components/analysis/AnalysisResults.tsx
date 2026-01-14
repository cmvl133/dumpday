import {
  CheckCircle2,
  Calendar,
  Lightbulb,
  StickyNote,
  Heart,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskList } from './TaskList';
import { NotesList } from './NotesList';
import { JournalSection } from './JournalSection';
import type { AnalysisResponse, DailyNoteData } from '@/types';

interface AnalysisResultsProps {
  data: AnalysisResponse | DailyNoteData;
  isPreview?: boolean;
  onToggleTask?: (id: number, isCompleted: boolean) => void;
  onDeleteTask?: (id: number) => void;
}

export function AnalysisResults({
  data,
  isPreview = false,
  onToggleTask,
  onDeleteTask,
}: AnalysisResultsProps) {
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
          Podgląd - kliknij Zapisz aby zachować
        </Badge>
      )}

      {/* TODO Today */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            TODO na dziś
            {todayCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {todayCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaskList
            tasks={tasks.today || []}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            isPreview={isPreview}
          />
        </CardContent>
      </Card>

      {/* TODO Scheduled */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            TODO zaplanowane
            {scheduledCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {scheduledCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaskList
            tasks={tasks.scheduled || []}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            isPreview={isPreview}
          />
        </CardContent>
      </Card>

      {/* TODO Someday */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            TODO kiedyś
            {somedayCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {somedayCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaskList
            tasks={tasks.someday || []}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            isPreview={isPreview}
          />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-orange-600" />
            Notatki
            {notes.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {notes.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NotesList notes={notes} />
        </CardContent>
      </Card>

      {/* Journal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-600" />
            Dziennik
            {journal.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {journal.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JournalSection entries={journal} />
        </CardContent>
      </Card>
    </div>
  );
}
