import { useTranslation } from 'react-i18next';
import { RefreshCw, Calendar, Zap } from 'lucide-react';
import type { ModalMode } from '@/store/howAreYouSlice';

interface ModeOption {
  mode: ModalMode;
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
  color: string;
  glowColor: string;
}

const modeOptions: ModeOption[] = [
  {
    mode: 'checkin',
    icon: <RefreshCw className="w-8 h-8" />,
    titleKey: 'howAreYou.quickCheckIn.title',
    descriptionKey: 'howAreYou.quickCheckIn.description',
    color: 'text-primary',
    glowColor: 'hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:border-primary',
  },
  {
    mode: 'planning',
    icon: <Calendar className="w-8 h-8" />,
    titleKey: 'howAreYou.planDay.title',
    descriptionKey: 'howAreYou.planDay.description',
    color: 'text-secondary',
    glowColor: 'hover:shadow-[0_0_30px_hsl(var(--secondary)/0.4)] hover:border-secondary',
  },
  {
    mode: 'rebuild',
    icon: <Zap className="w-8 h-8" />,
    titleKey: 'howAreYou.dayFellApart.title',
    descriptionKey: 'howAreYou.dayFellApart.description',
    color: 'text-orange-500',
    glowColor: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:border-orange-500',
  },
];

interface ModeSelectionProps {
  onSelectMode: (mode: ModalMode) => void;
}

export function ModeSelection({ onSelectMode }: ModeSelectionProps) {
  const { t } = useTranslation();

  return (
    <div className="py-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t('howAreYou.title')}</h2>
      </div>

      <div className="space-y-3">
        {modeOptions.map((option) => (
          <button
            key={option.mode}
            onClick={() => onSelectMode(option.mode)}
            className={`
              w-full p-4 rounded-lg border border-border/50 bg-card
              flex items-center gap-4 text-left
              transition-all duration-200
              ${option.glowColor}
            `}
          >
            <div className={`flex-shrink-0 ${option.color}`}>
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">{t(option.titleKey)}</h3>
              <p className="text-sm text-muted-foreground">
                {t(option.descriptionKey)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
