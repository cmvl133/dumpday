<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\DTO\Request\TaskCreateRequest;
use App\Entity\DailyNote;
use App\Entity\RecurringTask;
use App\Entity\Tag;
use App\Entity\Task;
use App\Entity\User;
use App\Enum\RecurrenceType;
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

    // ================================================================
    // update() tests - PATCH semantics
    // ================================================================

    #[Test]
    public function updateOnlyChangesProvidedFields(): void
    {
        $task = new Task();
        $task->setTitle('Original Title');
        $task->setEstimatedMinutes(30);

        // Only provide title, not estimatedMinutes
        $data = ['title' => 'New Title'];
        $result = $this->service->update($task, $data);

        $this->assertSame('New Title', $result->task->getTitle());
        $this->assertSame(30, $result->task->getEstimatedMinutes()); // Unchanged
    }

    #[Test]
    public function updateSetsFieldToNullWhenExplicitlyProvided(): void
    {
        $task = new Task();
        $task->setEstimatedMinutes(30);

        $data = ['estimatedMinutes' => null]; // Explicit null
        $result = $this->service->update($task, $data);

        $this->assertNull($result->task->getEstimatedMinutes());
    }

    #[Test]
    public function updateDoesNotChangeFieldWhenNotInData(): void
    {
        $task = new Task();
        $task->setTitle('Original');
        $task->setEstimatedMinutes(45);
        $task->setNeedsFullFocus(true);

        // Empty update - nothing should change
        $result = $this->service->update($task, []);

        $this->assertSame('Original', $result->task->getTitle());
        $this->assertSame(45, $result->task->getEstimatedMinutes());
        $this->assertTrue($result->task->isNeedsFullFocus());
    }

    #[Test]
    public function updateSetsDueDateFromString(): void
    {
        $task = new Task();

        $result = $this->service->update($task, ['dueDate' => '2026-02-15']);

        $this->assertNotNull($result->task->getDueDate());
        $this->assertSame('2026-02-15', $result->task->getDueDate()->format('Y-m-d'));
    }

    #[Test]
    public function updateClearsDueDateWhenNull(): void
    {
        $task = new Task();
        $task->setDueDate(new \DateTime('2026-02-15'));

        $result = $this->service->update($task, ['dueDate' => null]);

        $this->assertNull($result->task->getDueDate());
    }

    #[Test]
    public function updateClearsDueDateWhenEmptyString(): void
    {
        $task = new Task();
        $task->setDueDate(new \DateTime('2026-02-15'));

        $result = $this->service->update($task, ['dueDate' => '']);

        $this->assertNull($result->task->getDueDate());
    }

    #[Test]
    public function updateSetsReminderTime(): void
    {
        $task = new Task();

        $result = $this->service->update($task, ['reminderTime' => '09:30']);

        $this->assertNotNull($result->task->getReminderTime());
        $this->assertSame('09:30', $result->task->getReminderTime()->format('H:i'));
    }

    #[Test]
    public function updateSetsFixedTime(): void
    {
        $task = new Task();

        $result = $this->service->update($task, ['fixedTime' => '14:00']);

        $this->assertNotNull($result->task->getFixedTime());
        $this->assertSame('14:00', $result->task->getFixedTime()->format('H:i'));
    }

    #[Test]
    public function updateSetsCanCombineWithEvents(): void
    {
        $task = new Task();

        $result = $this->service->update($task, ['canCombineWithEvents' => ['meeting', 'lunch']]);

        $this->assertSame(['meeting', 'lunch'], $result->task->getCanCombineWithEvents());
    }

    #[Test]
    public function updateSetsNeedsFullFocus(): void
    {
        $task = new Task();
        $this->assertFalse($task->isNeedsFullFocus()); // Default false

        $result = $this->service->update($task, ['needsFullFocus' => true]);

        $this->assertTrue($result->task->isNeedsFullFocus());
    }

    #[Test]
    public function updateCallsFlush(): void
    {
        $task = new Task();

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        $this->service->update($task, ['title' => 'Updated']);
    }

    // ================================================================
    // update() tests - Completion handling
    // ================================================================

    #[Test]
    public function completingTaskSetsIsCompletedTrue(): void
    {
        $task = new Task();
        $this->assertFalse($task->isCompleted());

        $result = $this->service->update($task, ['isCompleted' => true]);

        $this->assertTrue($result->task->isCompleted());
    }

    #[Test]
    public function completingTaskSetsCompletedAtTimestamp(): void
    {
        $task = new Task();
        $this->assertNull($task->getCompletedAt());

        $result = $this->service->update($task, ['isCompleted' => true]);

        $this->assertNotNull($result->task->getCompletedAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $result->task->getCompletedAt());
    }

    #[Test]
    public function uncompletingTaskClearsCompletedAt(): void
    {
        $task = new Task();
        $task->setIsCompleted(true);
        $task->setCompletedAt(new \DateTimeImmutable());

        $result = $this->service->update($task, ['isCompleted' => false]);

        $this->assertFalse($result->task->isCompleted());
        $this->assertNull($result->task->getCompletedAt());
    }

    #[Test]
    public function completingAlreadyCompletedTaskDoesNotChangeCompletedAt(): void
    {
        $originalCompletedAt = new \DateTimeImmutable('2026-01-20 10:00:00');
        $task = new Task();
        $task->setIsCompleted(true);
        $task->setCompletedAt($originalCompletedAt);

        $result = $this->service->update($task, ['isCompleted' => true]);

        $this->assertTrue($result->task->isCompleted());
        $this->assertSame($originalCompletedAt, $result->task->getCompletedAt());
    }

    #[Test]
    public function completingRecurringTaskGeneratesNextOccurrence(): void
    {
        // Set up recurring task
        $recurringTask = new RecurringTask();
        $recurringTask->setTitle('Daily Task');
        $recurringTask->setRecurrenceType(RecurrenceType::DAILY);
        $recurringTask->setStartDate(new \DateTime('2026-01-01'));

        // Create task linked to recurring task
        $task = new Task();
        $task->setTitle('Daily Task');
        $task->setRecurringTask($recurringTask);

        // Set up next generated task
        $generatedTask = new Task();
        $generatedTask->setTitle('Daily Task (next)');

        $this->recurringSyncService
            ->expects($this->once())
            ->method('generateTask')
            ->willReturn($generatedTask);

        $result = $this->service->update($task, ['isCompleted' => true]);

        $this->assertTrue($result->task->isCompleted());
        $this->assertSame($generatedTask, $result->generatedNextTask);
    }

    #[Test]
    public function completingNonRecurringTaskDoesNotGenerateNextTask(): void
    {
        $task = new Task();
        $task->setTitle('One-time Task');
        // No recurring task linked

        $this->recurringSyncService
            ->expects($this->never())
            ->method('generateTask');

        $result = $this->service->update($task, ['isCompleted' => true]);

        $this->assertTrue($result->task->isCompleted());
        $this->assertNull($result->generatedNextTask);
    }

    #[Test]
    public function uncompletingRecurringTaskDoesNotGenerateNextTask(): void
    {
        $recurringTask = new RecurringTask();
        $recurringTask->setTitle('Daily Task');
        $recurringTask->setRecurrenceType(RecurrenceType::DAILY);
        $recurringTask->setStartDate(new \DateTime('2026-01-01'));

        $task = new Task();
        $task->setIsCompleted(true);
        $task->setCompletedAt(new \DateTimeImmutable());
        $task->setRecurringTask($recurringTask);

        $this->recurringSyncService
            ->expects($this->never())
            ->method('generateTask');

        $result = $this->service->update($task, ['isCompleted' => false]);

        $this->assertFalse($result->task->isCompleted());
        $this->assertNull($result->generatedNextTask);
    }

    #[Test]
    public function completingRecurringTaskWithNoNextDateReturnsNullGeneratedTask(): void
    {
        // Recurring task with end date in the past
        $recurringTask = new RecurringTask();
        $recurringTask->setTitle('Ended Recurring Task');
        $recurringTask->setRecurrenceType(RecurrenceType::DAILY);
        $recurringTask->setStartDate(new \DateTime('2026-01-01'));
        $recurringTask->setEndDate(new \DateTime('2026-01-15')); // Already ended

        $task = new Task();
        $task->setRecurringTask($recurringTask);

        // RecurrenceService.findNextOccurrenceDate will return null due to endDate
        // RecurringSyncService.generateTask should not be called

        $result = $this->service->update($task, ['isCompleted' => true]);

        $this->assertTrue($result->task->isCompleted());
        $this->assertNull($result->generatedNextTask);
    }

    // ================================================================
    // delete() tests
    // ================================================================

    #[Test]
    public function deleteRemovesTask(): void
    {
        $task = new Task();

        $this->entityManager
            ->expects($this->once())
            ->method('remove')
            ->with($task);

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        $this->service->delete($task);
    }

    // ================================================================
    // assignTags() tests
    // ================================================================

    #[Test]
    public function assignTagsReplacesExistingTags(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getId')->willReturn(1);

        // Create tags
        $oldTag = $this->createTagWithUserId(1, 1);
        $newTag = $this->createTagWithUserId(2, 1);

        // Task starts with old tag
        $task = new Task();
        $task->addTag($oldTag);
        $this->assertCount(1, $task->getTags());

        $this->tagRepository
            ->method('find')
            ->willReturnCallback(fn ($id) => $id === 2 ? $newTag : null);

        $this->entityManager->method('flush');

        $result = $this->service->assignTags($task, $user, [2]);

        // Should have new tag, not old tag
        $this->assertCount(1, $result->getTags());
        $this->assertTrue($result->getTags()->contains($newTag));
        $this->assertFalse($result->getTags()->contains($oldTag));
    }

    #[Test]
    public function assignTagsOnlyAddTagsBelongingToUser(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getId')->willReturn(1);

        // Tag belongs to a different user
        $otherUserTag = $this->createTagWithUserId(1, 2); // user ID 2

        $task = new Task();

        $this->tagRepository
            ->method('find')
            ->willReturn($otherUserTag);

        $this->entityManager->method('flush');

        $result = $this->service->assignTags($task, $user, [1]);

        // Tag should not be added since it belongs to different user
        $this->assertCount(0, $result->getTags());
    }

    #[Test]
    public function assignTagsClearsAllTagsWhenEmptyArray(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getId')->willReturn(1);

        $tag1 = $this->createTagWithUserId(1, 1);
        $tag2 = $this->createTagWithUserId(2, 1);

        $task = new Task();
        $task->addTag($tag1);
        $task->addTag($tag2);
        $this->assertCount(2, $task->getTags());

        $this->entityManager->method('flush');

        $result = $this->service->assignTags($task, $user, []);

        $this->assertCount(0, $result->getTags());
    }

    #[Test]
    public function assignTagsSkipsNonExistentTags(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getId')->willReturn(1);

        $existingTag = $this->createTagWithUserId(1, 1);

        $task = new Task();

        $this->tagRepository
            ->method('find')
            ->willReturnCallback(fn ($id) => $id === 1 ? $existingTag : null);

        $this->entityManager->method('flush');

        // Try to assign tags 1 (exists) and 999 (doesn't exist)
        $result = $this->service->assignTags($task, $user, [1, 999]);

        // Only existing tag should be added
        $this->assertCount(1, $result->getTags());
        $this->assertTrue($result->getTags()->contains($existingTag));
    }

    // ================================================================
    // removeTag() tests
    // ================================================================

    #[Test]
    public function removeTagRemovesSpecificTag(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getId')->willReturn(1);

        $tag1 = $this->createTagWithUserId(1, 1);
        $tag2 = $this->createTagWithUserId(2, 1);

        $task = new Task();
        $task->addTag($tag1);
        $task->addTag($tag2);

        $this->tagRepository
            ->method('find')
            ->with(1)
            ->willReturn($tag1);

        $this->entityManager
            ->expects($this->once())
            ->method('flush');

        $this->service->removeTag($task, $user, 1);

        $this->assertCount(1, $task->getTags());
        $this->assertFalse($task->getTags()->contains($tag1));
        $this->assertTrue($task->getTags()->contains($tag2));
    }

    #[Test]
    public function removeTagDoesNothingWhenTagNotFound(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getId')->willReturn(1);

        $task = new Task();

        $this->tagRepository
            ->method('find')
            ->willReturn(null);

        // Flush should not be called when tag not found
        $this->entityManager
            ->expects($this->never())
            ->method('flush');

        $this->service->removeTag($task, $user, 999);
    }

    #[Test]
    public function removeTagDoesNothingWhenTagBelongsToOtherUser(): void
    {
        $user = $this->createMock(User::class);
        $user->method('getId')->willReturn(1);

        $otherUserTag = $this->createTagWithUserId(1, 2); // user ID 2

        $task = new Task();

        $this->tagRepository
            ->method('find')
            ->willReturn($otherUserTag);

        // Flush should not be called when tag belongs to different user
        $this->entityManager
            ->expects($this->never())
            ->method('flush');

        $this->service->removeTag($task, $user, 1);
    }

    // ================================================================
    // Helper methods
    // ================================================================

    private function createTagWithUserId(int $tagId, int $userId): Tag&MockObject
    {
        $tagUser = $this->createMock(User::class);
        $tagUser->method('getId')->willReturn($userId);

        $tag = $this->createMock(Tag::class);
        $tag->method('getId')->willReturn($tagId);
        $tag->method('getUser')->willReturn($tagUser);

        return $tag;
    }
}
