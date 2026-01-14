<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\DailyNote;
use App\Entity\Task;
use App\Enum\TaskCategory;

class TaskExtractor
{
    /**
     * @return Task[]
     */
    public function extract(array $aiResponse, DailyNote $dailyNote): array
    {
        $tasks = [];

        foreach ($aiResponse['tasks']['today'] ?? [] as $item) {
            if (! isset($item['title']) || empty(trim($item['title']))) {
                continue;
            }

            $task = new Task();
            $task->setTitle(trim($item['title']));
            $task->setCategory(TaskCategory::TODAY);
            $task->setDailyNote($dailyNote);
            $tasks[] = $task;
        }

        foreach ($aiResponse['tasks']['scheduled'] ?? [] as $item) {
            if (! isset($item['title']) || empty(trim($item['title']))) {
                continue;
            }

            $task = new Task();
            $task->setTitle(trim($item['title']));
            $task->setCategory(TaskCategory::SCHEDULED);
            $task->setDailyNote($dailyNote);

            if (isset($item['dueDate'])) {
                try {
                    $dueDate = new \DateTime($item['dueDate']);
                    $task->setDueDate($dueDate);
                } catch (\Exception) {
                    // Invalid date, skip setting it
                }
            }

            $tasks[] = $task;
        }

        foreach ($aiResponse['tasks']['someday'] ?? [] as $item) {
            if (! isset($item['title']) || empty(trim($item['title']))) {
                continue;
            }

            $task = new Task();
            $task->setTitle(trim($item['title']));
            $task->setCategory(TaskCategory::SOMEDAY);
            $task->setDailyNote($dailyNote);
            $tasks[] = $task;
        }

        return $tasks;
    }
}
