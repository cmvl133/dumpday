import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TagBadge } from './TagBadge';
import { toggleFilter, setFilterMode, clearFilters } from '@/store/tagSlice';
import { cn } from '@/lib/utils';
import type { RootState, AppDispatch } from '@/store';
import type { TagFilterMode } from '@/types';

export function TagFilterBar() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const tags = useSelector((state: RootState) => state.tags.tags);
  const activeFilters = useSelector((state: RootState) => state.tags.activeFilters);
  const filterMode = useSelector((state: RootState) => state.tags.filterMode);
  const [isOpen, setIsOpen] = useState(false);

  const selectedTags = tags.filter((tag) => activeFilters.includes(tag.id));
  const hasFilters = activeFilters.length > 0;

  const handleToggleMode = () => {
    const newMode: TagFilterMode = filterMode === 'or' ? 'and' : 'or';
    dispatch(setFilterMode(newMode));
  };

  const handleToggleFilter = (tagId: number) => {
    dispatch(toggleFilter(tagId));
  };

  const handleClearAll = () => {
    dispatch(clearFilters());
  };

  // Don't render if there are no tags
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-3">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-2 text-xs gap-1.5",
              hasFilters && "border-primary/50 bg-primary/5"
            )}
          >
            <Filter className="h-3 w-3" />
            {t('tags.filter.title')}
            {hasFilters && (
              <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[10px]">
                {activeFilters.length}
              </span>
            )}
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-sm font-medium">{t('tags.filter.title')}</span>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-6 px-2 text-xs"
                >
                  {t('tags.filter.clear')}
                </Button>
              )}
            </div>

            {activeFilters.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{t('tags.filter.mode')}:</span>
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className={cn(
                    "px-2 py-0.5 rounded-full transition-colors",
                    filterMode === 'or'
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t('tags.filter.or')}
                </button>
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className={cn(
                    "px-2 py-0.5 rounded-full transition-colors",
                    filterMode === 'and'
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t('tags.filter.and')}
                </button>
              </div>
            )}

            <div className="space-y-1">
              {tags.map((tag) => {
                const isActive = activeFilters.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleFilter(tag.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-left",
                      isActive ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors",
                        isActive ? "border-primary bg-primary" : "border-muted-foreground"
                      )}
                    >
                      {isActive && (
                        <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      )}
                    </div>
                    <TagBadge tag={tag} size="md" />
                  </button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Show selected filters inline */}
      {hasFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedTags.map((tag, index) => (
            <div key={tag.id} className="flex items-center gap-1">
              {index > 0 && activeFilters.length > 1 && (
                <span className="text-[10px] text-muted-foreground">
                  {filterMode === 'and' ? '&' : '/'}
                </span>
              )}
              <TagBadge
                tag={tag}
                size="sm"
                onRemove={() => handleToggleFilter(tag.id)}
              />
            </div>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearAll}
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
