# Testing Patterns

**Analysis Date:** 2026-01-20

## Test Framework

**Backend Runner:**
- PHPUnit v11.5
- Config: `/home/kamil/Code/dumpday/backend/phpunit.dist.xml`
- Symfony PHPUnit Bridge extension enabled

**Backend Configuration:**
```xml
<phpunit
    colors="true"
    failOnDeprecation="true"
    failOnNotice="true"
    failOnWarning="true"
    bootstrap="tests/bootstrap.php"
    cacheDirectory=".phpunit.cache"
>
```

**Frontend Runner:**
- Not detected (no jest.config.* or vitest.config.* found)
- No test files (*.test.* or *.spec.*) present in frontend

**Run Commands:**
```bash
# Backend tests
cd backend && ./bin/phpunit                    # Run all tests
cd backend && ./bin/phpunit --coverage-text    # Run with coverage
```

## Test File Organization

**Backend Location:**
- Pattern: Separate `tests/` directory
- Path: `/home/kamil/Code/dumpday/backend/tests/`
- Bootstrap: `/home/kamil/Code/dumpday/backend/tests/bootstrap.php`

**Current State:**
- Tests directory exists but contains only `bootstrap.php` and `.gitkeep`
- No actual test cases present

**Naming (expected pattern):**
- `{ClassName}Test.php`
- Example: `TaskControllerTest.php`, `BrainDumpAnalyzerTest.php`

**Structure (expected):**
```
backend/tests/
├── bootstrap.php
├── Controller/
│   └── TaskControllerTest.php
├── Service/
│   └── BrainDumpAnalyzerTest.php
└── Repository/
    └── TaskRepositoryTest.php
```

## Test Structure

**PHPUnit Suite Organization (expected):**
```php
<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class TaskControllerTest extends WebTestCase
{
    public function testCreateTaskRequiresAuthentication(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/task', [], [], [], json_encode([
            'title' => 'Test task',
            'date' => '2024-01-20',
        ]));

        $this->assertResponseStatusCodeSame(401);
    }

    public function testCreateTaskWithValidData(): void
    {
        // Arrange
        $client = $this->createAuthenticatedClient();

        // Act
        $client->request('POST', '/api/task', [], [], [], json_encode([
            'title' => 'Test task',
            'date' => '2024-01-20',
        ]));

        // Assert
        $this->assertResponseStatusCodeSame(201);
        $this->assertJson($client->getResponse()->getContent());
    }
}
```

**Patterns:**
- Use WebTestCase for API/integration tests
- Use KernelTestCase for service tests
- Arrange-Act-Assert pattern
- Descriptive test method names: `test{Action}{Condition}{ExpectedResult}`

## Mocking

**Framework:** PHPUnit built-in mocking

**Patterns (expected):**
```php
<?php

use PHPUnit\Framework\TestCase;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class BrainDumpAnalyzerTest extends TestCase
{
    public function testAnalyzeCallsOpenAI(): void
    {
        $httpClient = $this->createMock(HttpClientInterface::class);
        $httpClient->expects($this->once())
            ->method('request')
            ->with('POST', 'https://api.openai.com/v1/chat/completions')
            ->willReturn($this->createMockResponse());

        $analyzer = new BrainDumpAnalyzer($httpClient, $twig, 'api-key');
        $result = $analyzer->analyze('test content', new \DateTime());

        $this->assertIsArray($result);
    }
}
```

**What to Mock:**
- External API calls (OpenAI)
- HTTP client responses
- Database operations in unit tests
- Time-dependent functions

**What NOT to Mock:**
- Doctrine entities (use real instances)
- Value objects
- Simple utility functions

## Fixtures and Factories

**Test Data (Symfony approach):**
```php
<?php

use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class TaskFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $user = new User();
        $user->setEmail('test@example.com');

        $task = new Task();
        $task->setTitle('Test Task');
        $task->setDailyNote($dailyNote);

        $manager->persist($task);
        $manager->flush();
    }
}
```

**Location (expected):**
- Fixtures in `/home/kamil/Code/dumpday/backend/src/DataFixtures/`

## Coverage

**Requirements:** Not enforced (no coverage threshold configured)

**View Coverage:**
```bash
cd backend && ./bin/phpunit --coverage-html coverage/
# Open coverage/index.html in browser
```

**Source Configuration:**
```xml
<source>
    <include>
        <directory>src</directory>
    </include>
</source>
```

## Test Types

**Unit Tests (expected):**
- Scope: Single class in isolation
- Location: `tests/Unit/`
- Target: Services, utility classes, domain logic
- Examples needed:
  - `BrainDumpAnalyzerTest` - AI response parsing
  - `ScheduleBuilderTest` - Schedule calculation logic
  - `TaskExtractorTest` - Task extraction from analysis

**Integration Tests (expected):**
- Scope: Multiple classes working together
- Location: `tests/Integration/`
- Target: Facades, repositories with database
- Examples needed:
  - `BrainDumpFacadeTest` - Full analysis + save flow
  - `TaskRepositoryTest` - Complex queries

**Functional/API Tests (expected):**
- Scope: Full HTTP request/response cycle
- Location: `tests/Controller/`
- Target: API endpoints
- Examples needed:
  - `TaskControllerTest` - CRUD operations
  - `AuthControllerTest` - Login flow
  - `PlanningControllerTest` - Planning mode workflows

**E2E Tests (Frontend):**
- Framework: Not set up
- Recommended: Playwright or Cypress
- Would test full user flows through React UI

## Common Patterns

**Async Testing (Backend):**
```php
// For testing async operations or event-driven code
public function testEventDispatch(): void
{
    $client = static::createClient();

    // Capture dispatched events
    $eventCollector = $client->getContainer()->get('event_collector');

    $client->request('POST', '/api/task', ...);

    $this->assertCount(1, $eventCollector->getDispatchedEvents());
}
```

**Error Testing:**
```php
public function testCreateTaskWithMissingTitle(): void
{
    $client = $this->createAuthenticatedClient();
    $client->request('POST', '/api/task', [], [], [], json_encode([
        'date' => '2024-01-20',
        // Missing 'title'
    ]));

    $this->assertResponseStatusCodeSame(400);
    $response = json_decode($client->getResponse()->getContent(), true);
    $this->assertArrayHasKey('error', $response);
}
```

**Database Testing:**
```php
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class TaskRepositoryTest extends KernelTestCase
{
    private EntityManagerInterface $entityManager;
    private TaskRepository $repository;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();
        $this->entityManager = $kernel->getContainer()
            ->get('doctrine')
            ->getManager();
        $this->repository = $this->entityManager->getRepository(Task::class);
    }

    public function testFindOverdueTasksReturnsCorrectTasks(): void
    {
        // Create test data
        $user = $this->createTestUser();
        $overdueTask = $this->createTask($user, new \DateTime('-1 day'));

        // Test
        $result = $this->repository->findOverdueTasks($user, new \DateTime());

        $this->assertCount(1, $result);
        $this->assertSame($overdueTask->getId(), $result[0]->getId());
    }
}
```

## PHPUnit Configuration Details

**Environment:**
```xml
<php>
    <ini name="display_errors" value="1" />
    <ini name="error_reporting" value="-1" />
    <server name="APP_ENV" value="test" force="true" />
    <server name="SHELL_VERBOSITY" value="-1" />
</php>
```

**Symfony Extension:**
```xml
<extensions>
    <bootstrap class="Symfony\Bridge\PhpUnit\SymfonyExtension">
        <parameter name="clock-mock-namespaces" value="App" />
        <parameter name="dns-mock-namespaces" value="App" />
    </bootstrap>
</extensions>
```

**Features:**
- Clock mocking available for time-dependent tests
- DNS mocking for external service tests
- Strict mode: fails on deprecation, notice, warning

## Bootstrap Configuration

**File:** `/home/kamil/Code/dumpday/backend/tests/bootstrap.php`

```php
<?php

declare(strict_types=1);

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__) . '/vendor/autoload.php';

if (method_exists(Dotenv::class, 'bootEnv')) {
    (new Dotenv())->bootEnv(dirname(__DIR__) . '/.env');
}

if ($_SERVER['APP_DEBUG']) {
    umask(0000);
}
```

## Test Database

**Recommended Setup:**
- Use SQLite in-memory for unit/integration tests
- Configure in `config/packages/test/doctrine.yaml`:

```yaml
doctrine:
    dbal:
        driver: pdo_sqlite
        url: 'sqlite:///:memory:'
```

## Coverage Gaps Identified

**Critical - No Tests Exist:**
- Controllers: TaskController, AuthController, PlanningController, etc.
- Services: BrainDumpAnalyzer, PlanningScheduleGenerator, RecurringSyncService
- Facades: BrainDumpFacade, AuthFacade
- Repositories: All custom query methods

**Priority Testing Needs:**

1. **High Priority:**
   - `BrainDumpAnalyzer` - Core AI integration
   - `AuthController` - Security critical
   - `TaskController` - Most used CRUD operations
   - `RecurringSyncService` - Complex date logic

2. **Medium Priority:**
   - `PlanningScheduleGenerator` - AI schedule generation
   - `BrainDumpFacade` - Orchestration logic
   - `TaskRepository` - Complex query methods

3. **Lower Priority:**
   - Entity relationship tests
   - Settings management
   - Tag management

**Frontend Testing:**
- No test infrastructure present
- Recommended: Add Vitest for unit tests
- Recommended: Add React Testing Library for component tests

---

*Testing analysis: 2026-01-20*
