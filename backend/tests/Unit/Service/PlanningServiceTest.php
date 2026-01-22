<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Entity\DailyNote;
use App\Entity\Event;
use App\Entity\Task;
use App\Entity\User;
use App\Repository\EventRepository;
use App\Repository\TaskRepository;
use App\Service\PlanningService;
use App\Service\TaskBlockMatchingService;
use App\Service\TaskEventConflictResolver;
use App\Service\TimeBlockService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PlanningServiceTest extends TestCase
{
    private PlanningService $service;
    private EntityManagerInterface $entityManager;
    private TaskRepository $taskRepository;
    private EventRepository $eventRepository;
    private TimeBlockService $timeBlockService;
    private TaskBlockMatchingService $taskBlockMatchingService;
    private TaskEventConflictResolver $conflictResolver;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->taskRepository = $this->createMock(TaskRepository::class);
        $this->eventRepository = $this->createMock(EventRepository::class);
        $this->timeBlockService = $this->createMock(TimeBlockService::class);
        $this->taskBlockMatchingService = $this->createMock(TaskBlockMatchingService::class);
        $this->conflictResolver = $this->createMock(TaskEventConflictResolver::class);

        $this->service = new PlanningService(
            $this->entityManager,
            $this->taskRepository,
            $this->eventRepository,
            $this->timeBlockService,
            $this->taskBlockMatchingService,
            $this->conflictResolver
        );
    }

    // ================================================================
    // getTasksForPlanning() tests
    // ================================================================

    #[Test]
    public function getTasksForPlanningReturnsAllPlanningData(): void
    {
        $user = $this->createMock(User::class);
        $date = new \DateTime('2026-01-22');

        $unplannedTasks = [new Task(), new Task()];
        $plannedTasks = [new Task()];
        $events = [new Event()];
        $activeBlocks = [['id' => 1, 'name' => 'Morning']];
        $conflicts = [];

        $this->taskRepository
            ->expects($this->once())
            ->method('findUnplannedTasksForToday')
            ->with($user, $date)
            ->willReturn($unplannedTasks);

        $this->taskRepository
            ->expects($this->once())
            ->method('findPlannedTasksForToday')
            ->with($user, $date)
            ->willReturn($plannedTasks);

        $this->eventRepository
            ->expects($this->once())
            ->method('findByUserAndDate')
            ->with($user, $date)
            ->willReturn($events);

        $this->timeBlockService
            ->expects($this->once())
            ->method('getActiveBlocksForDate')
            ->with($user, $date)
            ->willReturn($activeBlocks);

        $this->conflictResolver
            ->expects($this->once())
            ->method('findConflictingTasks')
            ->with($plannedTasks, $events)
            ->willReturn($conflicts);

        $result = $this->service->getTasksForPlanning($user, $date);

        $this->assertArrayHasKey('unplannedTasks', $result);
        $this->assertArrayHasKey('plannedTasks', $result);
        $this->assertArrayHasKey('events', $result);
        $this->assertArrayHasKey('activeBlocks', $result);
        $this->assertArrayHasKey('conflicts', $result);
        $this->assertSame($unplannedTasks, $result['unplannedTasks']);
        $this->assertSame($plannedTasks, $result['plannedTasks']);
        $this->assertSame($events, $result['events']);
        $this->assertSame($activeBlocks, $result['activeBlocks']);
        $this->assertSame($conflicts, $result['conflicts']);
    }

    #[Test]
    public function getTasksForPlanningReturnsEmptyArraysWhenNoData(): void
    {
        $user = $this->createMock(User::class);
        $date = new \DateTime('2026-01-22');

        $this->taskRepository
            ->method('findUnplannedTasksForToday')
            ->willReturn([]);

        $this->taskRepository
            ->method('findPlannedTasksForToday')
            ->willReturn([]);

        $this->eventRepository
            ->method('findByUserAndDate')
            ->willReturn([]);

        $this->timeBlockService
            ->method('getActiveBlocksForDate')
            ->willReturn([]);

        $this->conflictResolver
            ->method('findConflictingTasks')
            ->willReturn([]);

        $result = $this->service->getTasksForPlanning($user, $date);

        $this->assertSame([], $result['unplannedTasks']);
        $this->assertSame([], $result['plannedTasks']);
        $this->assertSame([], $result['events']);
        $this->assertSame([], $result['activeBlocks']);
        $this->assertSame([], $result['conflicts']);
    }

    #[Test]
    public function getTasksForPlanningPassesPlannedTasksToConflictResolver(): void
    {
        $user = $this->createMock(User::class);
        $date = new \DateTime('2026-01-22');

        $plannedTask = new Task();
        $plannedTask->setFixedTime(new \DateTimeImmutable('09:00'));
        $plannedTasks = [$plannedTask];

        $event = new Event();
        $events = [$event];

        $expectedConflicts = [['task' => $plannedTask, 'conflictingEvent' => $event]];

        $this->taskRepository
            ->method('findUnplannedTasksForToday')
            ->willReturn([]);

        $this->taskRepository
            ->method('findPlannedTasksForToday')
            ->willReturn($plannedTasks);

        $this->eventRepository
            ->method('findByUserAndDate')
            ->willReturn($events);

        $this->timeBlockService
            ->method('getActiveBlocksForDate')
            ->willReturn([]);

        $this->conflictResolver
            ->expects($this->once())
            ->method('findConflictingTasks')
            ->with($plannedTasks, $events)
            ->willReturn($expectedConflicts);

        $result = $this->service->getTasksForPlanning($user, $date);

        $this->assertSame($expectedConflicts, $result['conflicts']);
    }

    // ================================================================
    // updatePlanningFields() tests
    // ================================================================

    #[Test]
    public function updatePlanningFieldsOnlyChangesProvidedFields(): void
    {
        $task = new Task();
        $task->setEstimatedMinutes(30);
        $task->setNeedsFullFocus(true);

        // Only provide estimatedMinutes, not needsFullFocus
        $data = ['estimatedMinutes' => 60];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertSame(60, $result->getEstimatedMinutes());
        $this->assertTrue($result->isNeedsFullFocus()); // Unchanged
    }

    #[Test]
    public function updatePlanningFieldsSetsFixedTimeFromString(): void
    {
        $task = new Task();

        $data = ['fixedTime' => '09:30'];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertNotNull($result->getFixedTime());
        $this->assertSame('09:30', $result->getFixedTime()->format('H:i'));
    }

    #[Test]
    public function updatePlanningFieldsClearsFixedTimeWhenNull(): void
    {
        $task = new Task();
        $task->setFixedTime(new \DateTimeImmutable('09:30'));

        $data = ['fixedTime' => null];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertNull($result->getFixedTime());
    }

    #[Test]
    public function updatePlanningFieldsClearsFixedTimeWhenEmptyString(): void
    {
        $task = new Task();
        $task->setFixedTime(new \DateTimeImmutable('14:00'));

        $data = ['fixedTime' => ''];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertNull($result->getFixedTime());
    }

    #[Test]
    public function updatePlanningFieldsDoesNotChangeFixedTimeWhenNotProvided(): void
    {
        $task = new Task();
        $task->setFixedTime(new \DateTimeImmutable('10:00'));

        // Empty data - no fields provided
        $data = [];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertNotNull($result->getFixedTime());
        $this->assertSame('10:00', $result->getFixedTime()->format('H:i'));
    }

    #[Test]
    public function updatePlanningFieldsSetsEstimatedMinutes(): void
    {
        $task = new Task();

        $data = ['estimatedMinutes' => 45];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertSame(45, $result->getEstimatedMinutes());
    }

    #[Test]
    public function updatePlanningFieldsClearsEstimatedMinutesWhenNull(): void
    {
        $task = new Task();
        $task->setEstimatedMinutes(30);

        $data = ['estimatedMinutes' => null];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertNull($result->getEstimatedMinutes());
    }

    #[Test]
    public function updatePlanningFieldsSetsCanCombineWithEvents(): void
    {
        $task = new Task();

        $data = ['canCombineWithEvents' => [1, 2, 3]];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertSame([1, 2, 3], $result->getCanCombineWithEvents());
    }

    #[Test]
    public function updatePlanningFieldsClearsCanCombineWithEventsWhenNull(): void
    {
        $task = new Task();
        $task->setCanCombineWithEvents([5, 10]);

        $data = ['canCombineWithEvents' => null];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertNull($result->getCanCombineWithEvents());
    }

    #[Test]
    public function updatePlanningFieldsSetsNeedsFullFocus(): void
    {
        $task = new Task();

        $data = ['needsFullFocus' => true];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertTrue($result->isNeedsFullFocus());
    }

    #[Test]
    public function updatePlanningFieldsClearsNeedsFullFocusWhenFalse(): void
    {
        $task = new Task();
        $task->setNeedsFullFocus(true);

        $data = ['needsFullFocus' => false];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertFalse($result->isNeedsFullFocus());
    }

    #[Test]
    public function updatePlanningFieldsUpdatesMultipleFieldsAtOnce(): void
    {
        $task = new Task();

        $data = [
            'estimatedMinutes' => 90,
            'fixedTime' => '14:30',
            'needsFullFocus' => true,
            'canCombineWithEvents' => [7, 8],
        ];
        $result = $this->service->updatePlanningFields($task, $data);

        $this->assertSame(90, $result->getEstimatedMinutes());
        $this->assertSame('14:30', $result->getFixedTime()->format('H:i'));
        $this->assertTrue($result->isNeedsFullFocus());
        $this->assertSame([7, 8], $result->getCanCombineWithEvents());
    }

    #[Test]
    public function updatePlanningFieldsCallsFlush(): void
    {
        $task = new Task();

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        $this->service->updatePlanningFields($task, ['estimatedMinutes' => 30]);
    }

    #[Test]
    public function updatePlanningFieldsReturnsTheSameTaskInstance(): void
    {
        $task = new Task();

        $result = $this->service->updatePlanningFields($task, ['estimatedMinutes' => 30]);

        $this->assertSame($task, $result);
    }
}
