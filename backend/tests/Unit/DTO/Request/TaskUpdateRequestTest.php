<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO\Request;

use App\DTO\Request\TaskUpdateRequest;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class TaskUpdateRequestTest extends TestCase
{
    private ValidatorInterface $validator;

    protected function setUp(): void
    {
        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    // ====== PATCH semantics: all-null request is valid ======

    #[Test]
    public function allNullRequestIsValid(): void
    {
        $request = new TaskUpdateRequest();

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations, 'PATCH semantics: empty update request should be valid');
    }

    // ====== Title validation ======

    #[Test]
    public function acceptsNullTitle(): void
    {
        $request = new TaskUpdateRequest(title: null);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsValidTitle(): void
    {
        $request = new TaskUpdateRequest(title: 'Updated task title');

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsTitleAt500Characters(): void
    {
        $request = new TaskUpdateRequest(title: str_repeat('a', 500));

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function rejectsTitleOver500Characters(): void
    {
        $request = new TaskUpdateRequest(title: str_repeat('a', 501));

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('title', $violations[0]->getPropertyPath());
        $this->assertSame('Title cannot exceed 500 characters', $violations[0]->getMessage());
    }

    // ====== DueDate validation ======

    #[Test]
    public function acceptsNullDueDate(): void
    {
        $request = new TaskUpdateRequest(dueDate: null);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsValidDueDate(): void
    {
        $request = new TaskUpdateRequest(dueDate: '2026-01-25');

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    #[DataProvider('invalidDueDateProvider')]
    public function rejectsInvalidDueDateFormats(string $dueDate): void
    {
        $request = new TaskUpdateRequest(dueDate: $dueDate);

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('dueDate', $violations[0]->getPropertyPath());
    }

    public static function invalidDueDateProvider(): iterable
    {
        yield 'wrong format DD-MM-YYYY' => ['22-01-2026'];
        yield 'not a date' => ['not-a-date'];
        yield 'invalid month' => ['2026-13-01'];
        yield 'invalid day' => ['2026-01-32'];
    }

    // ====== ReminderTime validation (Regex: HH:MM) ======

    #[Test]
    public function acceptsNullReminderTime(): void
    {
        $request = new TaskUpdateRequest(reminderTime: null);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    #[DataProvider('validTimeProvider')]
    public function acceptsValidReminderTimeFormats(string $time): void
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
        yield 'early morning' => ['05:15'];
        yield 'max valid hour' => ['23:00'];
        yield 'max valid minute' => ['12:59'];
    }

    #[Test]
    #[DataProvider('invalidTimeProvider')]
    public function rejectsInvalidReminderTimeFormats(string $time): void
    {
        $request = new TaskUpdateRequest(reminderTime: $time);

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('reminderTime', $violations[0]->getPropertyPath());
        $this->assertSame('Invalid time format. Use HH:MM', $violations[0]->getMessage());
    }

    public static function invalidTimeProvider(): iterable
    {
        yield 'no colon' => ['0900'];
        yield 'am/pm format' => ['9:00 AM'];
        yield 'single digit hour' => ['9:00'];
        yield 'invalid hour 24' => ['24:00'];
        yield 'invalid hour 25' => ['25:00'];
        yield 'invalid minute 60' => ['09:60'];
        yield 'invalid minute 99' => ['09:99'];
        yield 'letters' => ['ab:cd'];
        yield 'extra digits' => ['123:45'];
        yield 'seconds included' => ['09:00:00'];
    }

    // ====== EstimatedMinutes validation (PositiveOrZero) ======

    #[Test]
    public function acceptsNullEstimatedMinutes(): void
    {
        $request = new TaskUpdateRequest(estimatedMinutes: null);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsZeroEstimatedMinutes(): void
    {
        $request = new TaskUpdateRequest(estimatedMinutes: 0);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsPositiveEstimatedMinutes(): void
    {
        $request = new TaskUpdateRequest(estimatedMinutes: 30);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsLargePositiveEstimatedMinutes(): void
    {
        $request = new TaskUpdateRequest(estimatedMinutes: 480);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function rejectsNegativeEstimatedMinutes(): void
    {
        $request = new TaskUpdateRequest(estimatedMinutes: -1);

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('estimatedMinutes', $violations[0]->getPropertyPath());
        $this->assertSame('Estimated minutes must be zero or positive', $violations[0]->getMessage());
    }

    #[Test]
    public function rejectsLargeNegativeEstimatedMinutes(): void
    {
        $request = new TaskUpdateRequest(estimatedMinutes: -100);

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('estimatedMinutes', $violations[0]->getPropertyPath());
    }

    // ====== FixedTime validation (same Regex as reminderTime) ======

    #[Test]
    public function acceptsNullFixedTime(): void
    {
        $request = new TaskUpdateRequest(fixedTime: null);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    #[DataProvider('validTimeProvider')]
    public function acceptsValidFixedTimeFormats(string $time): void
    {
        $request = new TaskUpdateRequest(fixedTime: $time);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    #[DataProvider('invalidFixedTimeProvider')]
    public function rejectsInvalidFixedTimeFormats(string $time): void
    {
        $request = new TaskUpdateRequest(fixedTime: $time);

        $violations = $this->validator->validate($request);

        $this->assertGreaterThan(0, count($violations));
        $this->assertSame('fixedTime', $violations[0]->getPropertyPath());
        $this->assertSame('Invalid time format. Use HH:MM', $violations[0]->getMessage());
    }

    public static function invalidFixedTimeProvider(): iterable
    {
        yield 'no colon' => ['0900'];
        yield 'am/pm format' => ['9:00 AM'];
        yield 'single digit hour' => ['9:00'];
        yield 'invalid hour' => ['25:00'];
        yield 'invalid minute' => ['09:60'];
    }

    // ====== Boolean fields (no validation constraints) ======

    #[Test]
    public function acceptsNullIsCompleted(): void
    {
        $request = new TaskUpdateRequest(isCompleted: null);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsTrueIsCompleted(): void
    {
        $request = new TaskUpdateRequest(isCompleted: true);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsFalseIsCompleted(): void
    {
        $request = new TaskUpdateRequest(isCompleted: false);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsNullNeedsFullFocus(): void
    {
        $request = new TaskUpdateRequest(needsFullFocus: null);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsTrueNeedsFullFocus(): void
    {
        $request = new TaskUpdateRequest(needsFullFocus: true);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function acceptsFalseNeedsFullFocus(): void
    {
        $request = new TaskUpdateRequest(needsFullFocus: false);

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    // ====== Combined fields validation ======

    #[Test]
    public function acceptsMultipleValidFields(): void
    {
        $request = new TaskUpdateRequest(
            title: 'Updated title',
            isCompleted: true,
            dueDate: '2026-01-25',
            reminderTime: '09:00',
            estimatedMinutes: 30,
            fixedTime: '10:00',
            needsFullFocus: true
        );

        $violations = $this->validator->validate($request);

        $this->assertCount(0, $violations);
    }

    #[Test]
    public function reportsMultipleViolations(): void
    {
        $request = new TaskUpdateRequest(
            title: str_repeat('a', 501),
            dueDate: 'invalid-date',
            reminderTime: '25:00',
            estimatedMinutes: -10,
            fixedTime: '9:00'
        );

        $violations = $this->validator->validate($request);

        $this->assertGreaterThanOrEqual(5, count($violations), 'Should report violation for each invalid field');

        $violatedProperties = array_map(
            fn ($v) => $v->getPropertyPath(),
            iterator_to_array($violations)
        );

        $this->assertContains('title', $violatedProperties);
        $this->assertContains('dueDate', $violatedProperties);
        $this->assertContains('reminderTime', $violatedProperties);
        $this->assertContains('estimatedMinutes', $violatedProperties);
        $this->assertContains('fixedTime', $violatedProperties);
    }
}
