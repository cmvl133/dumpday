# Phase 11: Backend Tests - Research

**Researched:** 2026-01-22
**Domain:** PHPUnit testing for Symfony 7 services, DTOs, and APIs
**Confidence:** HIGH

## Summary

This research covers how to implement comprehensive backend testing for the Dopaminder application. The project already has PHPUnit 11.5 configured with Symfony PHPUnit Bridge, and the test infrastructure (bootstrap, phpunit.dist.xml) is in place but no actual tests exist yet.

The testing strategy divides into three tiers:
1. **Pure unit tests** for services with no dependencies (RecurrenceService, DuplicateDetectionService) - no mocking needed
2. **Unit tests with mocks** for services with dependencies (TaskService, PlanningService) - mock repositories
3. **Integration/functional tests** for API endpoints (TaskController) - use WebTestCase with test database

**Primary recommendation:** Start with pure logic services (RecurrenceService, DuplicateDetectionService) using plain PHPUnit TestCase, then progress to mocked service tests, and finally API integration tests.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| phpunit/phpunit | ^11.5 | Test framework | Already installed, latest stable version |
| symfony/phpunit-bridge | ^7.4 | Symfony integration, ClockMock, DnsMock | Already installed in composer.json |
| symfony/browser-kit | ^7.4 | HTTP client simulation | Already installed for WebTestCase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dama/doctrine-test-bundle | ^8.0 | Database transaction rollback | Recommended for integration tests with database |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual DB reset | dama/doctrine-test-bundle | Bundle auto-rolls back transactions; manual requires fixtures per test |
| Fixtures bundle | Inline test data | For small test suites, inline data is simpler |

**Installation (if dama bundle needed):**
```bash
docker compose exec php composer require --dev dama/doctrine-test-bundle
```

## Architecture Patterns

### Recommended Test Directory Structure
```
tests/
├── bootstrap.php              # Already exists
├── Unit/
│   ├── Service/
│   │   ├── RecurrenceServiceTest.php      # Pure logic, no deps
│   │   ├── DuplicateDetectionServiceTest.php  # Pure logic, no deps
│   │   ├── TaskServiceTest.php            # Mocked repositories
│   │   └── PlanningServiceTest.php        # Mocked repositories
│   └── DTO/
│       └── Request/
│           ├── TaskCreateRequestTest.php  # Validator tests
│           └── TaskUpdateRequestTest.php  # Validator tests
└── Integration/
    └── Controller/
        └── TaskControllerTest.php         # WebTestCase with real DB
```

### Pattern 1: Pure Unit Tests (No Mocking)

**What:** Test services that have no dependencies beyond their own logic
**When to use:** RecurrenceService, DuplicateDetectionService - services marked as `readonly` with no constructor dependencies

**Example:**
```php
// tests/Unit/Service/RecurrenceServiceTest.php
namespace App\Tests\Unit\Service;

use App\Entity\RecurringTask;
use App\Enum\RecurrenceType;
use App\Service\RecurrenceService;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;

class RecurrenceServiceTest extends TestCase
{
    private RecurrenceService $service;

    protected function setUp(): void
    {
        $this->service = new RecurrenceService();
    }

    #[Test]
    #[DataProvider('dailyPatternProvider')]
    public function matchesPatternForDailyType(\DateTimeInterface $date, bool $expected): void
    {
        $task = $this->createRecurringTask(RecurrenceType::DAILY, new \DateTime('2026-01-01'));

        $this->assertSame($expected, $this->service->matchesPattern($task, $date));
    }

    public static function dailyPatternProvider(): iterable
    {
        yield 'any day matches' => [new \DateTime('2026-01-15'), true];
        yield 'weekend matches' => [new \DateTime('2026-01-18'), true]; // Saturday
    }

    private function createRecurringTask(RecurrenceType $type, \DateTime $startDate): RecurringTask
    {
        $task = new RecurringTask();
        $task->setRecurrenceType($type);
        $task->setStartDate($startDate);
        return $task;
    }
}
```

### Pattern 2: Unit Tests with Mocked Dependencies

**What:** Test services that depend on repositories and EntityManager
**When to use:** TaskService, PlanningService

**Example:**
```php
// tests/Unit/Service/TaskServiceTest.php
namespace App\Tests\Unit\Service;

use App\Entity\Task;
use App\Entity\User;
use App\Entity\DailyNote;
use App\Repository\TaskRepository;
use App\Repository\DailyNoteRepository;
use App\Repository\TagRepository;
use App\Service\RecurrenceService;
use App\Service\RecurringSyncService;
use App\Service\TaskService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

class TaskServiceTest extends TestCase
{
    private TaskService $service;
    private EntityManagerInterface $entityManager;
    private TaskRepository $taskRepository;
    private DailyNoteRepository $dailyNoteRepository;
    private TagRepository $tagRepository;

    protected function setUp(): void
    {
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->taskRepository = $this->createMock(TaskRepository::class);
        $this->dailyNoteRepository = $this->createMock(DailyNoteRepository::class);
        $this->tagRepository = $this->createMock(TagRepository::class);
        $recurrenceService = $this->createMock(RecurrenceService::class);
        $recurringSyncService = $this->createMock(RecurringSyncService::class);

        $this->service = new TaskService(
            $this->entityManager,
            $this->taskRepository,
            $this->dailyNoteRepository,
            $this->tagRepository,
            $recurrenceService,
            $recurringSyncService
        );
    }

    #[Test]
    public function findByIdAndUserReturnsNullForNonExistentTask(): void
    {
        $user = $this->createMock(User::class);

        $this->taskRepository
            ->expects($this->once())
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

        $this->taskRepository->method('find')->willReturn($task);

        $result = $this->service->findByIdAndUser(1, $requestingUser);

        $this->assertNull($result);
    }
}
```

### Pattern 3: DTO Validation Tests

**What:** Test Symfony Validator constraints on DTO classes
**When to use:** TaskCreateRequest, TaskUpdateRequest

**Example:**
```php
// tests/Unit/DTO/Request/TaskCreateRequestTest.php
namespace App\Tests\Unit\DTO\Request;

use App\DTO\Request\TaskCreateRequest;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class TaskCreateRequestTest extends TestCase
{
    private ValidatorInterface $validator;

    protected function setUp(): void
    {
        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    #[Test]
    public function validRequestPassesValidation(): void
    {
        $request = new TaskCreateRequest(
            title: 'Test Task',
            date: '2026-01-22'
        );

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function emptyTitleFailsValidation(): void
    {
        $request = new TaskCreateRequest(
            title: '',
            date: '2026-01-22'
        );

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('title', $violations[0]->getPropertyPath());
    }

    #[Test]
    #[DataProvider('invalidDateProvider')]
    public function invalidDateFailsValidation(string $date): void
    {
        $request = new TaskCreateRequest(
            title: 'Test',
            date: $date
        );

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
    }

    public static function invalidDateProvider(): iterable
    {
        yield 'wrong format' => ['22-01-2026'];
        yield 'invalid date' => ['not-a-date'];
        yield 'empty' => [''];
    }

    #[Test]
    public function invalidCategoryFailsValidation(): void
    {
        $request = new TaskCreateRequest(
            title: 'Test',
            date: '2026-01-22',
            category: 'invalid_category'
        );

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertStringContainsString('category', $violations[0]->getPropertyPath());
    }
}
```

### Pattern 4: Integration Tests with WebTestCase

**What:** Test full HTTP request/response cycle
**When to use:** TaskController API endpoints

**Example:**
```php
// tests/Integration/Controller/TaskControllerTest.php
namespace App\Tests\Integration\Controller;

use App\Entity\User;
use App\Entity\DailyNote;
use App\Entity\Task;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;
use PHPUnit\Framework\Attributes\Test;

class TaskControllerTest extends WebTestCase
{
    private EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        parent::setUp();
        self::bootKernel();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
    }

    #[Test]
    public function createTaskReturns201WithValidData(): void
    {
        $client = static::createClient();

        // Create and login test user
        $user = $this->createTestUser();
        $client->loginUser($user);

        $client->request('POST', '/api/task', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => 'New Task',
            'date' => '2026-01-22',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $response);
        $this->assertSame('New Task', $response['title']);
    }

    #[Test]
    public function createTaskReturns400ForInvalidData(): void
    {
        $client = static::createClient();
        $user = $this->createTestUser();
        $client->loginUser($user);

        $client->request('POST', '/api/task', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'title' => '',  // Invalid: empty
            'date' => 'invalid',  // Invalid: not a date
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    private function createTestUser(): User
    {
        $user = new User();
        $user->setEmail('test@example.com');
        $user->setGoogleId('test-google-id');

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->entityManager->close();
    }
}
```

### Anti-Patterns to Avoid

- **Testing private methods directly:** Test through public API; private methods are implementation details
- **Mocking the entity being tested:** Mock dependencies, not the system under test
- **Over-mocking pure logic:** RecurrenceService needs no mocks - just instantiate and test
- **Testing framework code:** Don't test Symfony Validator itself, test your constraints
- **Stateful tests:** Each test should be independent; don't rely on test execution order

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Creating mock objects | Manual stub classes | PHPUnit createMock() / createStub() | PHPUnit auto-generates from interface, type-safe |
| Database state reset | Manual DELETE queries | dama/doctrine-test-bundle | Automatic transaction rollback, faster |
| Validation testing | Manual constraint checking | Symfony Validator with enableAttributeMapping() | Validates all constraints as in production |
| Test user authentication | Manual token creation | $client->loginUser($user) | Symfony handles all security context |

**Key insight:** PHPUnit 11 distinguishes between `createStub()` (isolate from dependency, no expectations) and `createMock()` (verify interactions). Use the right one for clearer tests.

## Common Pitfalls

### Pitfall 1: Forgetting to Close EntityManager

**What goes wrong:** Memory leaks accumulate across tests, eventually causing out-of-memory errors
**Why it happens:** EntityManager holds references to all loaded entities
**How to avoid:** Always close in tearDown():
```php
protected function tearDown(): void
{
    parent::tearDown();
    $this->entityManager->close();
    $this->entityManager = null;
}
```
**Warning signs:** Tests get slower over time, random failures in CI

### Pitfall 2: Using Stubs for Expectation Verification

**What goes wrong:** PHPUnit 11 deprecates expectations on stubs; PHPUnit 12 will fail
**Why it happens:** Confusion between createStub() and createMock()
**How to avoid:**
- Need to verify a method was called? Use `createMock()`
- Just need return values? Use `createStub()`
**Warning signs:** Deprecation warnings about "configuring expectations on a stub"

### Pitfall 3: Data Providers Accessing setUp State

**What goes wrong:** Data providers execute before setUp(), causing null reference errors
**Why it happens:** PHPUnit calculates total tests before running setUp
**How to avoid:** Data providers must be `static` and self-contained
**Warning signs:** "Cannot access property on null" errors in data providers

### Pitfall 4: Testing DateTime Without Freezing Time

**What goes wrong:** Tests with "today" or "now" fail at midnight or in different timezones
**Why it happens:** RecurrenceService uses `new \DateTime('today')` internally
**How to avoid:**
1. Use Symfony ClockMock (already configured in phpunit.dist.xml)
2. Or inject ClockInterface for testability
**Warning signs:** Tests pass locally but fail in CI, or fail at specific times

### Pitfall 5: Not Testing Both Validation Success and Failure

**What goes wrong:** Missing edge cases where validation should fail but passes
**Why it happens:** Only testing the happy path
**How to avoid:** For each constraint, test:
1. Valid input passes
2. Invalid input fails
3. Edge cases (empty, null, boundary values)
**Warning signs:** Invalid API requests don't return proper 400/422 errors

## Code Examples

### Complete RecurrenceService Test Coverage

```php
// All recurrence types test coverage
namespace App\Tests\Unit\Service;

use App\Entity\RecurringTask;
use App\Enum\RecurrenceType;
use App\Service\RecurrenceService;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;

class RecurrenceServiceTest extends TestCase
{
    private RecurrenceService $service;

    protected function setUp(): void
    {
        $this->service = new RecurrenceService();
    }

    // DAILY - matches every day
    #[Test]
    public function dailyPatternMatchesAnyDay(): void
    {
        $task = $this->createTask(RecurrenceType::DAILY, '2026-01-01');

        $this->assertTrue($this->service->matchesPattern($task, new \DateTime('2026-01-15')));
        $this->assertTrue($this->service->matchesPattern($task, new \DateTime('2026-02-28')));
        $this->assertTrue($this->service->matchesPattern($task, new \DateTime('2026-06-15')));
    }

    // WEEKLY - matches same day of week as start
    #[Test]
    #[DataProvider('weeklyPatternProvider')]
    public function weeklyPatternMatchesSameDayOfWeek(string $startDate, string $testDate, bool $expected): void
    {
        $task = $this->createTask(RecurrenceType::WEEKLY, $startDate);

        $this->assertSame($expected, $this->service->matchesPattern($task, new \DateTime($testDate)));
    }

    public static function weeklyPatternProvider(): iterable
    {
        // Start on Monday 2026-01-05
        yield 'same day next week' => ['2026-01-05', '2026-01-12', true];
        yield 'same day two weeks' => ['2026-01-05', '2026-01-19', true];
        yield 'different day' => ['2026-01-05', '2026-01-06', false]; // Tuesday
        yield 'weekend' => ['2026-01-05', '2026-01-10', false]; // Saturday
    }

    // WEEKDAYS - Mon-Fri only
    #[Test]
    #[DataProvider('weekdaysPatternProvider')]
    public function weekdaysPatternMatchesMondayToFriday(string $testDate, bool $expected): void
    {
        $task = $this->createTask(RecurrenceType::WEEKDAYS, '2026-01-01');

        $this->assertSame($expected, $this->service->matchesPattern($task, new \DateTime($testDate)));
    }

    public static function weekdaysPatternProvider(): iterable
    {
        yield 'monday' => ['2026-01-05', true];
        yield 'tuesday' => ['2026-01-06', true];
        yield 'wednesday' => ['2026-01-07', true];
        yield 'thursday' => ['2026-01-08', true];
        yield 'friday' => ['2026-01-09', true];
        yield 'saturday' => ['2026-01-10', false];
        yield 'sunday' => ['2026-01-11', false];
    }

    // MONTHLY - same day of month
    #[Test]
    #[DataProvider('monthlyPatternProvider')]
    public function monthlyPatternMatchesSameDayOfMonth(string $startDate, string $testDate, bool $expected): void
    {
        $task = $this->createTask(RecurrenceType::MONTHLY, $startDate);

        $this->assertSame($expected, $this->service->matchesPattern($task, new \DateTime($testDate)));
    }

    public static function monthlyPatternProvider(): iterable
    {
        // Start on 15th
        yield 'same day next month' => ['2026-01-15', '2026-02-15', true];
        yield 'same day 6 months later' => ['2026-01-15', '2026-07-15', true];
        yield 'different day' => ['2026-01-15', '2026-02-16', false];
        yield 'day before' => ['2026-01-15', '2026-02-14', false];
    }

    // CUSTOM - specific days array
    #[Test]
    public function customPatternMatchesSpecifiedDays(): void
    {
        $task = $this->createTask(RecurrenceType::CUSTOM, '2026-01-01');
        $task->setRecurrenceDays([1, 3, 5]); // Mon, Wed, Fri

        $this->assertTrue($this->service->matchesPattern($task, new \DateTime('2026-01-05'))); // Monday
        $this->assertTrue($this->service->matchesPattern($task, new \DateTime('2026-01-07'))); // Wednesday
        $this->assertTrue($this->service->matchesPattern($task, new \DateTime('2026-01-09'))); // Friday
        $this->assertFalse($this->service->matchesPattern($task, new \DateTime('2026-01-06'))); // Tuesday
        $this->assertFalse($this->service->matchesPattern($task, new \DateTime('2026-01-10'))); // Saturday
    }

    #[Test]
    public function customPatternWithEmptyDaysMatchesNothing(): void
    {
        $task = $this->createTask(RecurrenceType::CUSTOM, '2026-01-01');
        $task->setRecurrenceDays([]);

        $this->assertFalse($this->service->matchesPattern($task, new \DateTime('2026-01-05')));
    }

    #[Test]
    public function customPatternWithNullDaysMatchesNothing(): void
    {
        $task = $this->createTask(RecurrenceType::CUSTOM, '2026-01-01');
        $task->setRecurrenceDays(null);

        $this->assertFalse($this->service->matchesPattern($task, new \DateTime('2026-01-05')));
    }

    // findNextOccurrenceDate tests
    #[Test]
    public function findNextOccurrenceDateReturnsNextMatchingDay(): void
    {
        $task = $this->createTask(RecurrenceType::DAILY, '2026-01-01');

        $next = $this->service->findNextOccurrenceDate($task);

        $this->assertNotNull($next);
        // Should be tomorrow (searches from tomorrow onwards)
        $tomorrow = (new \DateTime('today'))->modify('+1 day');
        $this->assertSame($tomorrow->format('Y-m-d'), $next->format('Y-m-d'));
    }

    #[Test]
    public function findNextOccurrenceDateRespectsEndDate(): void
    {
        $task = $this->createTask(RecurrenceType::DAILY, '2026-01-01');
        $task->setEndDate(new \DateTime('yesterday')); // Already ended

        $next = $this->service->findNextOccurrenceDate($task);

        $this->assertNull($next);
    }

    private function createTask(RecurrenceType $type, string $startDate): RecurringTask
    {
        $task = new RecurringTask();
        $task->setRecurrenceType($type);
        $task->setStartDate(new \DateTime($startDate));
        return $task;
    }
}
```

### Complete TaskUpdateRequest Validation Test

```php
// tests/Unit/DTO/Request/TaskUpdateRequestTest.php
namespace App\Tests\Unit\DTO\Request;

use App\DTO\Request\TaskUpdateRequest;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class TaskUpdateRequestTest extends TestCase
{
    private ValidatorInterface $validator;

    protected function setUp(): void
    {
        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    #[Test]
    public function allFieldsNullIsValid(): void
    {
        $request = new TaskUpdateRequest();
        $violations = $this->validator->validate($request);
        $this->assertCount(0, $violations);
    }

    #[Test]
    public function titleExceeding500CharsFails(): void
    {
        $request = new TaskUpdateRequest(title: str_repeat('a', 501));
        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('title', $violations[0]->getPropertyPath());
    }

    #[Test]
    #[DataProvider('validTimeProvider')]
    public function validReminderTimeFormatsPass(string $time): void
    {
        $request = new TaskUpdateRequest(reminderTime: $time);
        $violations = $this->validator->validate($request);
        $this->assertCount(0, $violations);
    }

    public static function validTimeProvider(): iterable
    {
        yield 'morning' => ['09:00'];
        yield 'noon' => ['12:00'];
        yield 'evening' => ['18:30'];
        yield 'midnight' => ['00:00'];
        yield 'late night' => ['23:59'];
    }

    #[Test]
    #[DataProvider('invalidTimeProvider')]
    public function invalidReminderTimeFormatsFail(string $time): void
    {
        $request = new TaskUpdateRequest(reminderTime: $time);
        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
    }

    public static function invalidTimeProvider(): iterable
    {
        yield 'no colon' => ['0900'];
        yield 'am/pm format' => ['9:00 AM'];
        yield 'single digit hour' => ['9:00'];
        yield 'invalid hour' => ['25:00'];
        yield 'invalid minute' => ['09:60'];
    }

    #[Test]
    public function negativeEstimatedMinutesFails(): void
    {
        $request = new TaskUpdateRequest(estimatedMinutes: -5);
        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
    }

    #[Test]
    public function zeroEstimatedMinutesIsValid(): void
    {
        $request = new TaskUpdateRequest(estimatedMinutes: 0);
        $violations = $this->validator->validate($request);
        $this->assertCount(0, $violations);
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @dataProvider annotations | #[DataProvider] attribute | PHPUnit 10+ | Annotations deprecated in PHPUnit 11, removed in PHPUnit 12 |
| @test annotations | #[Test] attribute | PHPUnit 10+ | Cleaner, IDE-supported |
| createMock() for stubs | createStub() for stubs, createMock() for mocks | PHPUnit 10+ | Clearer intent, deprecation warnings if misused |
| $this->getMockBuilder() | createMock()/createStub() | PHPUnit 10+ | Simpler API |

**Deprecated/outdated:**
- **Annotation-based metadata:** Use PHP 8 attributes instead (@test -> #[Test])
- **getMockBuilder() chains:** Use createMock() for simple cases
- **Prophecy:** PHPUnit no longer bundles it; use native PHPUnit mocks

## Open Questions

Things that could not be fully resolved:

1. **ClockMock for RecurrenceService::findNextOccurrenceDate**
   - What we know: phpunit.dist.xml already configures clock-mock-namespaces for App
   - What's unclear: Need to verify ClockMock works with native DateTime in findNextOccurrenceDate
   - Recommendation: Test if freezing time works; if not, consider injecting ClockInterface

2. **Test database credentials**
   - What we know: `.env.test` has KERNEL_CLASS but no DATABASE_URL override
   - What's unclear: Whether tests should use main database with _test suffix or separate credentials
   - Recommendation: Add DATABASE_URL to .env.test pointing to test database

## Sources

### Primary (HIGH confidence)
- [PHPUnit 11.5 Manual](https://docs.phpunit.de/en/11.5/index.html) - Attributes, data providers, mocking
- [Symfony Testing Documentation](https://symfony.com/doc/current/testing.html) - KernelTestCase, WebTestCase, service testing
- [Symfony Database Testing](https://symfony.com/doc/current/testing/database.html) - Repository testing patterns

### Secondary (MEDIUM confidence)
- [PHPUnit 11 Release Announcement](https://phpunit.de/announcements/phpunit-11.html) - Deprecations and changes
- [Symfony Validator Testing](https://symfony.com/doc/current/validation/custom_constraint.html) - ConstraintValidatorTestCase

### Tertiary (LOW confidence)
- Web searches for current best practices - verified against official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified against composer.json and Symfony docs
- Architecture patterns: HIGH - based on official Symfony testing guide
- Pitfalls: HIGH - documented in PHPUnit 11 deprecation notices and Symfony docs
- Code examples: MEDIUM - written based on actual project services, not run yet

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (PHPUnit ecosystem is stable; Symfony 7.4 LTS)
