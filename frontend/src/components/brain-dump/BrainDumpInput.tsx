import { useEffect } from 'react';
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Brain Dump
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Napisz wszystko co masz na myśli...
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <Textarea
          value={rawContent}
          onChange={(e) => dispatch(setRawContent(e.target.value))}
          placeholder="Dzisiaj mam spotkanie o 10:00 z Janem. Muszę dokończyć raport do piątku. Czuję się trochę zmęczony. Pamiętać o kupnie mleka. Adres klienta: ul. Przykładowa 15..."
          className="flex-1 min-h-[300px] resize-none text-base leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isAnalyzing && (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizuję...
              </span>
            )}
            {!isAnalyzing && rawContent.length > 0 && (
              <span>{rawContent.length} znaków</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing || rawContent.trim().length === 0}
            >
              Analizuj
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !analysisPreview}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Zapisuję...
                </>
              ) : (
                'Zapisz'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
