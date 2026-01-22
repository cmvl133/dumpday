<?php

declare(strict_types=1);

namespace App\Tests\Integration\Controller;

use App\Entity\DailyNote;
use App\Entity\Task;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class TaskControllerTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $this->cleanDatabase();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
    }

    private function cleanDatabase(): void
    {
        // Clean up test data in correct order (foreign keys)
        $this->entityManager->createQuery('DELETE FROM App\Entity\Task')->execute();
        $this->entityManager->createQuery('DELETE FROM App\Entity\DailyNote')->execute();
        $this->entityManager->createQuery('DELETE FROM App\Entity\User')->execute();
    }

    private function createTestUser(string $email = 'test@example.com'): User
    {
        $user = new User();
        $user->setEmail($email);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    private function createDailyNote(User $user, \DateTime $date): DailyNote
    {
        $dailyNote = new DailyNote();
        $dailyNote->setUser($user);
        $dailyNote->setDate($date);

        $this->entityManager->persist($dailyNote);
        $this->entityManager->flush();

        return $dailyNote;
    }

    private function createTask(DailyNote $dailyNote, string $title): Task
    {
        $task = new Task();
        $task->setTitle($title);
        $task->setDailyNote($dailyNote);

        $this->entityManager->persist($task);
        $this->entityManager->flush();

        return $task;
    }

    // ==============================================
    // POST /api/task - Create Task
    // ==============================================

    #[Test]
    public function createTaskReturns201WithValidData(): void
    {
        $user = $this->createTestUser();
        $this->client->loginUser($user);

        $this->client->request('POST', '/api/task', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'New Integration Test Task',
            'date' => '2026-01-22',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $response);
        $this->assertSame('New Integration Test Task', $response['title']);
    }

    #[Test]
    public function createTaskReturns422ForEmptyTitle(): void
    {
        $user = $this->createTestUser();
        $this->client->loginUser($user);

        $this->client->request('POST', '/api/task', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => '',
            'date' => '2026-01-22',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    #[Test]
    public function createTaskReturns422ForInvalidDate(): void
    {
        $user = $this->createTestUser();
        $this->client->loginUser($user);

        $this->client->request('POST', '/api/task', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'Valid Title',
            'date' => 'invalid-date',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    #[Test]
    public function createTaskReturns422ForMissingDate(): void
    {
        $user = $this->createTestUser();
        $this->client->loginUser($user);

        $this->client->request('POST', '/api/task', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'Valid Title',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    #[Test]
    public function createTaskWithCategoryReturns201(): void
    {
        $user = $this->createTestUser();
        $this->client->loginUser($user);

        $this->client->request('POST', '/api/task', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'Scheduled Task',
            'date' => '2026-01-22',
            'category' => 'scheduled',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('scheduled', $response['category']);
    }

    #[Test]
    public function createTaskWithDueDateReturns201(): void
    {
        $user = $this->createTestUser();
        $this->client->loginUser($user);

        $this->client->request('POST', '/api/task', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'Task with Due Date',
            'date' => '2026-01-22',
            'dueDate' => '2026-01-25',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('2026-01-25', $response['dueDate']);
    }

    // ==============================================
    // PATCH /api/task/{id} - Update Task
    // ==============================================

    #[Test]
    public function updateTaskReturns200WithValidData(): void
    {
        $user = $this->createTestUser();
        $dailyNote = $this->createDailyNote($user, new \DateTime('2026-01-22'));
        $task = $this->createTask($dailyNote, 'Original Title');

        $this->client->loginUser($user);
        $this->client->request('PATCH', '/api/task/' . $task->getId(), [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'Updated Title',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Updated Title', $response['title']);
    }

    #[Test]
    public function updateTaskCompletionSetsCompletedAt(): void
    {
        $user = $this->createTestUser();
        $dailyNote = $this->createDailyNote($user, new \DateTime('2026-01-22'));
        $task = $this->createTask($dailyNote, 'Complete Me');

        $this->client->loginUser($user);
        $this->client->request('PATCH', '/api/task/' . $task->getId(), [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'isCompleted' => true,
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($response['isCompleted']);
        $this->assertNotNull($response['completedAt']);
    }

    #[Test]
    public function updateTaskUncompletionClearsCompletedAt(): void
    {
        $user = $this->createTestUser();
        $dailyNote = $this->createDailyNote($user, new \DateTime('2026-01-22'));
        $task = $this->createTask($dailyNote, 'Uncomplete Me');

        // First complete the task
        $task->setIsCompleted(true);
        $task->setCompletedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        $this->client->loginUser($user);
        $this->client->request('PATCH', '/api/task/' . $task->getId(), [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'isCompleted' => false,
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertFalse($response['isCompleted']);
        $this->assertNull($response['completedAt']);
    }

    #[Test]
    public function updateTaskReturns404ForNonExistentTask(): void
    {
        $user = $this->createTestUser();
        $this->client->loginUser($user);

        $this->client->request('PATCH', '/api/task/99999', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'New Title',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    #[Test]
    public function updateTaskReturns404ForOtherUsersTask(): void
    {
        // Create task owned by user1
        $user1 = $this->createTestUser('user1@example.com');
        $dailyNote = $this->createDailyNote($user1, new \DateTime('2026-01-22'));
        $task = $this->createTask($dailyNote, 'User1 Task');

        // Login as user2
        $user2 = $this->createTestUser('user2@example.com');
        $this->client->loginUser($user2);

        $this->client->request('PATCH', '/api/task/' . $task->getId(), [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'Hacked Title',
        ]));

        // Should return 404 (not 403) to avoid revealing task existence
        $this->assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    #[Test]
    public function updateTaskEstimatedMinutesWorks(): void
    {
        $user = $this->createTestUser();
        $dailyNote = $this->createDailyNote($user, new \DateTime('2026-01-22'));
        $task = $this->createTask($dailyNote, 'Estimated Task');

        $this->client->loginUser($user);
        $this->client->request('PATCH', '/api/task/' . $task->getId(), [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'estimatedMinutes' => 30,
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame(30, $response['estimatedMinutes']);
    }

    #[Test]
    public function updateTaskDueDateWorks(): void
    {
        $user = $this->createTestUser();
        $dailyNote = $this->createDailyNote($user, new \DateTime('2026-01-22'));
        $task = $this->createTask($dailyNote, 'Due Date Task');

        $this->client->loginUser($user);
        $this->client->request('PATCH', '/api/task/' . $task->getId(), [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'dueDate' => '2026-01-30',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('2026-01-30', $response['dueDate']);
    }

    #[Test]
    public function updateTaskNeedsFullFocusWorks(): void
    {
        $user = $this->createTestUser();
        $dailyNote = $this->createDailyNote($user, new \DateTime('2026-01-22'));
        $task = $this->createTask($dailyNote, 'Focus Task');

        $this->client->loginUser($user);
        $this->client->request('PATCH', '/api/task/' . $task->getId(), [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'needsFullFocus' => true,
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($response['needsFullFocus']);
    }

    // ==============================================
    // DELETE /api/task/{id} - Delete Task
    // ==============================================

    #[Test]
    public function deleteTaskReturns204(): void
    {
        $user = $this->createTestUser();
        $dailyNote = $this->createDailyNote($user, new \DateTime('2026-01-22'));
        $task = $this->createTask($dailyNote, 'Delete Me');
        $taskId = $task->getId();

        $this->client->loginUser($user);
        $this->client->request('DELETE', '/api/task/' . $taskId);

        $this->assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        // Verify task is actually deleted
        $this->entityManager->clear();
        $deletedTask = $this->entityManager->find(Task::class, $taskId);
        $this->assertNull($deletedTask);
    }

    #[Test]
    public function deleteTaskReturns404ForNonExistentTask(): void
    {
        $user = $this->createTestUser();
        $this->client->loginUser($user);

        $this->client->request('DELETE', '/api/task/99999');

        $this->assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    #[Test]
    public function deleteTaskReturns404ForOtherUsersTask(): void
    {
        $user1 = $this->createTestUser('user1@example.com');
        $dailyNote = $this->createDailyNote($user1, new \DateTime('2026-01-22'));
        $task = $this->createTask($dailyNote, 'User1 Protected Task');

        $user2 = $this->createTestUser('user2@example.com');
        $this->client->loginUser($user2);

        $this->client->request('DELETE', '/api/task/' . $task->getId());

        $this->assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    // ==============================================
    // Authorization - Unauthenticated requests
    // ==============================================

    #[Test]
    public function createTaskRequiresAuthentication(): void
    {
        $this->client->request('POST', '/api/task', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'Test Task',
            'date' => '2026-01-22',
        ]));

        // Symfony returns 401 for unauthenticated requests to secured routes
        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    #[Test]
    public function updateTaskRequiresAuthentication(): void
    {
        $user = $this->createTestUser();
        $dailyNote = $this->createDailyNote($user, new \DateTime('2026-01-22'));
        $task = $this->createTask($dailyNote, 'Test Task');

        $this->client->request('PATCH', '/api/task/' . $task->getId(), [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'New Title',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    #[Test]
    public function deleteTaskRequiresAuthentication(): void
    {
        $user = $this->createTestUser();
        $dailyNote = $this->createDailyNote($user, new \DateTime('2026-01-22'));
        $task = $this->createTask($dailyNote, 'Test Task');

        $this->client->request('DELETE', '/api/task/' . $task->getId());

        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }
}
