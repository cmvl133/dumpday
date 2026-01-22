<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Event;
use App\Entity\Task;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Twig\Environment;

class PlanningScheduleGenerator
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly Environment $twig,
        private readonly string $openAiApiKey,
    ) {
    }

    /**
     * @param Task[] $tasksToSchedule Tasks that need scheduling
     * @param Event[] $events Fixed events
     * @param Task[] $existingPlannedTasks Tasks already planned (blocked time slots)
     */
    public function generate(
        array $tasksToSchedule,
        array $events,
        array $existingPlannedTasks,
        \DateTimeInterface $date,
        string $language = 'en'
    ): array {
        if (empty($tasksToSchedule)) {
            return [
                'schedule' => [],
                'warnings' => [],
            ];
        }

        $templateName = sprintf('prompts/schedule_optimization_%s.twig', $language);
        $dayOfWeek = $language === 'pl'
            ? $this->getPolishDayOfWeek($date)
            : $this->getEnglishDayOfWeek($date);

        $taskData = array_map(fn (Task $task) => [
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'estimatedMinutes' => $task->getEstimatedMinutes(),
            'fixedTime' => $task->getFixedTime()?->format('H:i'),
            'canCombineWithEvents' => $task->getCanCombineWithEvents(),
            'needsFullFocus' => $task->isNeedsFullFocus(),
        ], $tasksToSchedule);

        $eventData = array_map(fn (Event $event) => [
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'startTime' => $event->getStartTime()?->format('H:i'),
            'endTime' => $event->getEndTime()?->format('H:i'),
            'allowOverlap' => $event->isAllowOverlap(),
        ], $events);

        $existingPlannedData = array_map(fn (Task $task) => [
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'fixedTime' => $task->getFixedTime()?->format('H:i'),
            'estimatedMinutes' => $task->getEstimatedMinutes() ?? 30,
        ], $existingPlannedTasks);

        $prompt = $this->twig->render($templateName, [
            'tasks' => $taskData,
            'events' => $eventData,
            'existing_planned_tasks' => $existingPlannedData,
            'current_date' => $date->format('Y-m-d'),
            'current_time' => (new \DateTime())->format('H:i'),
            'day_of_week' => $dayOfWeek,
        ]);

        try {
            $response = $this->httpClient->request('POST', 'https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->openAiApiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.3,
                    'response_format' => [
                        'type' => 'json_object',
                    ],
                ],
            ]);

            $content = $response->toArray();
            $result = json_decode($content['choices'][0]['message']['content'], true);

            if ($result === null) {
                return [
                    'schedule' => [],
                    'warnings' => ['Failed to parse AI response'],
                ];
            }

            return $this->normalizeResponse($result);
        } catch (\Throwable $e) {
            return [
                'schedule' => [],
                'warnings' => ['Failed to generate schedule: ' . $e->getMessage()],
            ];
        }
    }

    /**
     * Generate a rebuild schedule with work end time constraint.
     *
     * @param Task[] $tasksToSchedule Tasks that need scheduling
     * @param Event[] $events Fixed events
     * @param Task[] $existingPlannedTasks Tasks already planned (blocked time slots)
     */
    public function generateRebuild(
        array $tasksToSchedule,
        array $events,
        array $existingPlannedTasks,
        \DateTimeInterface $date,
        string $workUntilTime,
        string $language = 'en'
    ): array {
        if (empty($tasksToSchedule)) {
            return [
                'schedule' => [],
                'warnings' => [],
            ];
        }

        $templateName = sprintf('prompts/schedule_rebuild_%s.twig', $language);
        $dayOfWeek = $language === 'pl'
            ? $this->getPolishDayOfWeek($date)
            : $this->getEnglishDayOfWeek($date);

        $taskData = array_map(fn (Task $task) => [
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'estimatedMinutes' => $task->getEstimatedMinutes() ?? 30,
        ], $tasksToSchedule);

        $eventData = array_map(fn (Event $event) => [
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'startTime' => $event->getStartTime()?->format('H:i'),
            'endTime' => $event->getEndTime()?->format('H:i'),
            'allowOverlap' => $event->isAllowOverlap(),
        ], $events);

        $existingPlannedData = array_map(fn (Task $task) => [
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'fixedTime' => $task->getFixedTime()?->format('H:i'),
            'estimatedMinutes' => $task->getEstimatedMinutes() ?? 30,
        ], $existingPlannedTasks);

        $prompt = $this->twig->render($templateName, [
            'tasks' => $taskData,
            'events' => $eventData,
            'existing_planned_tasks' => $existingPlannedData,
            'current_date' => $date->format('Y-m-d'),
            'current_time' => (new \DateTime())->format('H:i'),
            'work_until_time' => $workUntilTime,
            'day_of_week' => $dayOfWeek,
        ]);

        try {
            $response = $this->httpClient->request('POST', 'https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->openAiApiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.3,
                    'response_format' => [
                        'type' => 'json_object',
                    ],
                ],
            ]);

            $content = $response->toArray();
            $result = json_decode($content['choices'][0]['message']['content'], true);

            if ($result === null) {
                return [
                    'schedule' => [],
                    'warnings' => ['Failed to parse AI response'],
                ];
            }

            return $this->normalizeResponse($result);
        } catch (\Throwable $e) {
            return [
                'schedule' => [],
                'warnings' => ['Failed to generate schedule: ' . $e->getMessage()],
            ];
        }
    }

    private function getPolishDayOfWeek(\DateTimeInterface $date): string
    {
        $days = [
            'Monday' => 'poniedziałek',
            'Tuesday' => 'wtorek',
            'Wednesday' => 'środa',
            'Thursday' => 'czwartek',
            'Friday' => 'piątek',
            'Saturday' => 'sobota',
            'Sunday' => 'niedziela',
        ];

        return $days[$date->format('l')] ?? $date->format('l');
    }

    private function getEnglishDayOfWeek(\DateTimeInterface $date): string
    {
        return $date->format('l');
    }

    private function normalizeResponse(array $result): array
    {
        $schedule = [];
        $seenTaskIds = [];

        foreach (($result['schedule'] ?? []) as $item) {
            $taskId = (int) ($item['taskId'] ?? 0);

            // Skip duplicates - only keep first occurrence of each task
            if ($taskId === 0 || in_array($taskId, $seenTaskIds, true)) {
                continue;
            }
            $seenTaskIds[] = $taskId;

            $schedule[] = [
                'taskId' => $taskId,
                'suggestedTime' => $item['suggestedTime'] ?? null,
                'duration' => (int) ($item['duration'] ?? 30),
                'combinedWithEventId' => $item['combinedWithEventId'] ?? null,
                'reasoning' => $item['reasoning'] ?? '',
            ];
        }

        return [
            'schedule' => $schedule,
            'warnings' => $result['warnings'] ?? [],
        ];
    }
}
