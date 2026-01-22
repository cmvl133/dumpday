<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\DTO\Request\TaskCreateRequest;
use App\Entity\DailyNote;
use App\Entity\Task;
use App\Entity\User;
use App\Repository\DailyNoteRepository;
use App\Repository\TagRepository;
use App\Repository\TaskRepository;
use App\Service\RecurrenceService;
use App\Service\RecurringSyncService;
use App\Service\TaskService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class TaskServiceTest extends TestCase
{
    private TaskService $service;
    private EntityManagerInterface&MockObject $entityManager;
    private TaskRepository&MockObject $taskRepository;
    private DailyNoteRepository&MockObject $dailyNoteRepository;
    private TagRepository&MockObject $tagRepository;
    private RecurrenceService $recurrenceService;
    private RecurringSyncService&MockObject $recurringSyncService;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->taskRepository = $this->createMock(TaskRepository::class);
        $this->dailyNoteRepository = $this->createMock(DailyNoteRepository::class);
        $this->tagRepository = $this->createMock(TagRepository::class);
        // RecurrenceService is a final readonly class with no dependencies - use real instance
        $this->recurrenceService = new RecurrenceService();
        $this->recurringSyncService = $this->createMock(RecurringSyncService::class);

        $this->service = new TaskService(
            $this->entityManager,
            $this->taskRepository,
            $this->dailyNoteRepository,
            $this->tagRepository,
            $this->recurrenceService,
            $this->recurringSyncService
        );
    }

    // ================================================================
    // findByIdAndUser() tests
    // ================================================================

    #[Test]
    public function findByIdAndUserReturnsNullWhenTaskNotFound(): void
    {
        $user = $this->createMock(User::class);

        $this->taskRepository
            ->method('find')
            ->with(999)
            ->willReturn(null);

        $result = $this->service->findByIdAndUser(999, $user);

        $this->assertNull($result);
    }

    #[Test]
    public function findByIdAndUserReturnsNullForOtherUsersTask(): void
    {
        $requestingUser = $this->createMock(User::class);
        $requestingUser->method('getId')->willReturn(1);

        $taskOwner = $this->createMock(User::class);
        $taskOwner->method('getId')->willReturn(2);

        $dailyNote = $this->createMock(DailyNote::class);
        $dailyNote->method('getUser')->willReturn($taskOwner);

        $task = $this->createMock(Task::class);
        $task->method('getDailyNote')->willReturn($dailyNote);

        $this->taskRepository
            ->method('find')
            ->with(1)
            ->willReturn($task);

        $result = $this->service->findByIdAndUser(1, $requestingUser);

        $this->assertNull($result);
    }

    #[Test]
    public function findByIdAndUserReturnsTaskWhenUserMatches(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getId')->willReturn(1);

        $dailyNote = $this->createMock(DailyNote::class);
        $dailyNote->method('getUser')->willReturn($user);

        $task = $this->createMock(Task::class);
        $task->method('getDailyNote')->willReturn($dailyNote);

        $this->taskRepository
            ->method('find')
            ->with(1)
            ->willReturn($task);

        $result = $this->service->findByIdAndUser(1, $user);

        $this->assertSame($task, $result);
    }

    #[Test]
    public function findByIdAndUserReturnsNullWhenDailyNoteIsNull(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getId')->willReturn(1);

        $task = $this->createMock(Task::class);
        $task->method('getDailyNote')->willReturn(null);

        $this->taskRepository
            ->method('find')
            ->with(1)
            ->willReturn($task);

        $result = $this->service->findByIdAndUser(1, $user);

        $this->assertNull($result);
    }

    #[Test]
    public function findByIdAndUserReturnsNullWhenDailyNoteUserIsNull(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getId')->willReturn(1);

        $dailyNote = $this->createMock(DailyNote::class);
        $dailyNote->method('getUser')->willReturn(null);

        $task = $this->createMock(Task::class);
        $task->method('getDailyNote')->willReturn($dailyNote);

        $this->taskRepository
            ->method('find')
            ->with(1)
            ->willReturn($task);

        $result = $this->service->findByIdAndUser(1, $user);

        $this->assertNull($result);
    }

    // ================================================================
    // create() tests
    // ================================================================

    #[Test]
    public function createPersistsAndFlushesTask(): void
    {
        $user = $this->createMock(User::class);
        $dailyNote = new DailyNote();

        $this->dailyNoteRepository
            ->method('findByUserAndDate')
            ->willReturn($dailyNote);

        $this->entityManager
            ->expects($this->once())
            ->method('persist')
            ->with($this->isInstanceOf(Task::class));

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        $request = new TaskCreateRequest(title: 'New Task', date: '2026-01-22');
        $task = $this->service->create($user, $request);

        $this->assertSame('New Task', $task->getTitle());
        $this->assertSame($dailyNote, $task->getDailyNote());
    }

    #[Test]
    public function createCreatesNewDailyNoteWhenNotExists(): void
    {
        $user = $this->createMock(User::class);

        $this->dailyNoteRepository
            ->method('findByUserAndDate')
            ->willReturn(null);

        $persistedObjects = [];
        $this->entityManager
            ->expects($this->exactly(2))
            ->method('persist')
            ->willReturnCallback(function ($object) use (&$persistedObjects) {
                $persistedObjects[] = $object;
            });

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        $request = new TaskCreateRequest(title: 'Task with new DailyNote', date: '2026-01-22');
        $task = $this->service->create($user, $request);

        $this->assertSame('Task with new DailyNote', $task->getTitle());
        $this->assertNotNull($task->getDailyNote());
        // First persisted should be DailyNote, second should be Task
        $this->assertCount(2, $persistedObjects);
        $this->assertInstanceOf(DailyNote::class, $persistedObjects[0]);
        $this->assertInstanceOf(Task::class, $persistedObjects[1]);
    }

    #[Test]
    public function createSetsCategoryWhenProvided(): void
    {
        $user = $this->createMock(User::class);
        $dailyNote = new DailyNote();

        $this->dailyNoteRepository
            ->method('findByUserAndDate')
            ->willReturn($dailyNote);

        $this->entityManager->method('persist');
        $this->entityManager->method('flush');

        $request = new TaskCreateRequest(
            title: 'Scheduled Task',
            date: '2026-01-22',
            category: 'scheduled'
        );
        $task = $this->service->create($user, $request);

        $this->assertSame('scheduled', $task->getCategory()->value);
    }

    #[Test]
    public function createIgnoresInvalidCategory(): void
    {
        $user = $this->createMock(User::class);
        $dailyNote = new DailyNote();

        $this->dailyNoteRepository
            ->method('findByUserAndDate')
            ->willReturn($dailyNote);

        $this->entityManager->method('persist');
        $this->entityManager->method('flush');

        $request = new TaskCreateRequest(
            title: 'Task with invalid category',
            date: '2026-01-22',
            category: 'invalid_category'
        );
        $task = $this->service->create($user, $request);

        // Should keep default category (today)
        $this->assertSame('today', $task->getCategory()->value);
    }

    #[Test]
    public function createSetsDueDateWhenProvided(): void
    {
        $user = $this->createMock(User::class);
        $dailyNote = new DailyNote();

        $this->dailyNoteRepository
            ->method('findByUserAndDate')
            ->willReturn($dailyNote);

        $this->entityManager->method('persist');
        $this->entityManager->method('flush');

        $request = new TaskCreateRequest(
            title: 'Task with due date',
            date: '2026-01-22',
            dueDate: '2026-01-30'
        );
        $task = $this->service->create($user, $request);

        $this->assertNotNull($task->getDueDate());
        $this->assertSame('2026-01-30', $task->getDueDate()->format('Y-m-d'));
    }

    #[Test]
    public function createKeepsDueDateNullWhenNotProvided(): void
    {
        $user = $this->createMock(User::class);
        $dailyNote = new DailyNote();

        $this->dailyNoteRepository
            ->method('findByUserAndDate')
            ->willReturn($dailyNote);

        $this->entityManager->method('persist');
        $this->entityManager->method('flush');

        $request = new TaskCreateRequest(title: 'Task without due date', date: '2026-01-22');
        $task = $this->service->create($user, $request);

        $this->assertNull($task->getDueDate());
    }
}
