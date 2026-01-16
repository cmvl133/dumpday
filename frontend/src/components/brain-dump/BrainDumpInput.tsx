import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  analyzeBrainDump,
  setRawContent,
  saveDailyNote,
} from '@/store/dailyNoteSlice';

export function BrainDumpInput() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { currentDate, rawContent, isAnalyzing, isSaving, analysisPreview } =
    useAppSelector((state) => state.dailyNote);

  const debouncedContent = useDebounce(rawContent, 2500);

  useEffect(() => {
    if (debouncedContent.trim().length > 20) {
      dispatch(
        analyzeBrainDump({ rawContent: debouncedContent, date: currentDate })
      );
    }
  }, [debouncedContent, currentDate, dispatch]);

  const handleAnalyze = () => {
    if (rawContent.trim().length > 0) {
      dispatch(analyzeBrainDump({ rawContent, date: currentDate }));
    }
  };

  const handleSave = () => {
    if (analysisPreview && rawContent.trim().length > 0) {
      dispatch(
        saveDailyNote({
          rawContent,
          date: currentDate,
          analysis: analysisPreview,
        })
      );
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('brainDump.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        <Textarea
          value={rawContent}
          onChange={(e) => dispatch(setRawContent(e.target.value))}
          placeholder={t('brainDump.placeholder')}
          className="flex-1 resize-none text-base leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isAnalyzing && (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('brainDump.analyzing')}
              </span>
            )}
            {!isAnalyzing && rawContent.length > 0 && (
              <span>{rawContent.length}</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing || rawContent.trim().length === 0}
            >
              {t('brainDump.analyze')}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !analysisPreview}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
