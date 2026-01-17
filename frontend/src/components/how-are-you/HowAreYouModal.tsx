import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ModeSelection } from './ModeSelection';
import { CheckInFlow } from './CheckInFlow';
import { PlanningFlow } from './PlanningFlow';
import { RebuildFlow } from './RebuildFlow';
import {
  closeModal,
  selectMode,
  type ModalMode,
} from '@/store/howAreYouSlice';
import type { RootState, AppDispatch } from '@/store';

export function HowAreYouModal() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { isOpen, mode, error } = useSelector((state: RootState) => state.howAreYou);

  const handleClose = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const handleSelectMode = useCallback(
    (selectedMode: ModalMode) => {
      dispatch(selectMode(selectedMode));
    },
    [dispatch]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogTitle className="sr-only">{t('howAreYou.title')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('howAreYou.title')}
        </DialogDescription>

        {error && (
          <div className="text-center py-4 text-destructive">{error}</div>
        )}

        {mode === 'selection' && (
          <ModeSelection onSelectMode={handleSelectMode} />
        )}

        {mode === 'checkin' && <CheckInFlow />}

        {mode === 'planning' && <PlanningFlow />}

        {mode === 'rebuild' && <RebuildFlow />}
      </DialogContent>
    </Dialog>
  );
}
