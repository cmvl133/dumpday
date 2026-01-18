import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { Task } from '@/types';

export function useTagFilter() {
  const activeFilters = useSelector((state: RootState) => state.tags.activeFilters);
  const filterMode = useSelector((state: RootState) => state.tags.filterMode);

  const filterTasks = useMemo(() => {
    return (tasks: Task[]): Task[] => {
      // No filters active - return all tasks
      if (activeFilters.length === 0) {
        return tasks;
      }

      return tasks.filter((task) => {
        const taskTagIds = task.tags?.map((t) => t.id) || [];

        if (filterMode === 'and') {
          // AND mode: task must have ALL selected tags
          return activeFilters.every((tagId) => taskTagIds.includes(tagId));
        } else {
          // OR mode: task must have AT LEAST ONE selected tag
          return activeFilters.some((tagId) => taskTagIds.includes(tagId));
        }
      });
    };
  }, [activeFilters, filterMode]);

  return {
    filterTasks,
    hasActiveFilters: activeFilters.length > 0,
  };
}
