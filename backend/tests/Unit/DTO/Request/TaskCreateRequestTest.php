<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO\Request;

use App\DTO\Request\TaskCreateRequest;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class TaskCreateRequestTest extends TestCase
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
            title: 'Valid task title',
            date: '2026-01-22'
        );

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function validRequestWithCategoryPassesValidation(): void
    {
        $request = new TaskCreateRequest(
            title: 'Valid task title',
            date: '2026-01-22',
            category: 'today'
        );

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function validRequestWithDueDatePassesValidation(): void
    {
        $request = new TaskCreateRequest(
            title: 'Valid task title',
            date: '2026-01-22',
            dueDate: '2026-01-25'
        );

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function validRequestWithAllOptionalFieldsPassesValidation(): void
    {
        $request = new TaskCreateRequest(
            title: 'Valid task title',
            date: '2026-01-22',
            category: 'scheduled',
            dueDate: '2026-01-25'
        );

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function rejectsEmptyTitle(): void
    {
        $request = new TaskCreateRequest(
            title: '',
            date: '2026-01-22'
        );

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('title', $violations[0]->getPropertyPath());
        $this->assertSame('Title is required', $violations[0]->getMessage());
    }

    #[Test]
    public function rejectsTitleOver500Characters(): void
    {
        $request = new TaskCreateRequest(
            title: str_repeat('a', 501),
            date: '2026-01-22'
        );

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('title', $violations[0]->getPropertyPath());
        $this->assertSame('Title cannot exceed 500 characters', $violations[0]->getMessage());
    }

    #[Test]
    public function acceptsTitleAt500Characters(): void
    {
        $request = new TaskCreateRequest(
            title: str_repeat('a', 500),
            date: '2026-01-22'
        );

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function rejectsEmptyDate(): void
    {
        $request = new TaskCreateRequest(
            title: 'Valid title',
            date: ''
        );

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('date', $violations[0]->getPropertyPath());
    }

    #[Test]
    #[DataProvider('invalidDateProvider')]
    public function rejectsInvalidDateFormats(string $date): void
    {
        $request = new TaskCreateRequest(
            title: 'Valid title',
            date: $date
        );

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));

        $dateViolations = array_filter(
            iterator_to_array($violations),
            fn ($v) => $v->getPropertyPath() === 'date'
        );
        $this->assertNotEmpty($dateViolations);
    }

    public static function invalidDateProvider(): iterable
    {
        yield 'wrong format DD-MM-YYYY' => ['22-01-2026'];
        yield 'wrong format MM/DD/YYYY' => ['01/22/2026'];
        yield 'not a date' => ['not-a-date'];
        yield 'invalid month' => ['2026-13-01'];
        yield 'invalid day' => ['2026-01-32'];
    }

    #[Test]
    #[DataProvider('validCategoryProvider')]
    public function acceptsValidCategory(string $category): void
    {
        $request = new TaskCreateRequest(
            title: 'Valid title',
            date: '2026-01-22',
            category: $category
        );

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    public static function validCategoryProvider(): iterable
    {
        yield 'today' => ['today'];
        yield 'scheduled' => ['scheduled'];
        yield 'someday' => ['someday'];
    }

    #[Test]
    public function rejectsInvalidCategory(): void
    {
        $request = new TaskCreateRequest(
            title: 'Valid title',
            date: '2026-01-22',
            category: 'invalid'
        );

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('category', $violations[0]->getPropertyPath());
        $this->assertSame('Invalid category. Must be one of: today, scheduled, someday', $violations[0]->getMessage());
    }

    #[Test]
    public function acceptsNullCategory(): void
    {
        $request = new TaskCreateRequest(
            title: 'Valid title',
            date: '2026-01-22',
            category: null
        );

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsNullDueDate(): void
    {
        $request = new TaskCreateRequest(
            title: 'Valid title',
            date: '2026-01-22',
            dueDate: null
        );

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsValidDueDate(): void
    {
        $request = new TaskCreateRequest(
            title: 'Valid title',
            date: '2026-01-22',
            dueDate: '2026-01-25'
        );

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    #[DataProvider('invalidDueDateProvider')]
    public function rejectsInvalidDueDateFormats(string $dueDate): void
    {
        $request = new TaskCreateRequest(
            title: 'Valid title',
            date: '2026-01-22',
            dueDate: $dueDate
        );

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));

        $dueDateViolations = array_filter(
            iterator_to_array($violations),
            fn ($v) => $v->getPropertyPath() === 'dueDate'
        );
        $this->assertNotEmpty($dueDateViolations);
    }

    public static function invalidDueDateProvider(): iterable
    {
        yield 'wrong format DD-MM-YYYY' => ['22-01-2026'];
        yield 'not a date' => ['not-a-date'];
        yield 'invalid month' => ['2026-13-01'];
    }
}
