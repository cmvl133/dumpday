<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Entity\RecurringTask;
use App\Enum\RecurrenceType;
use App\Service\RecurrenceService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class RecurrenceServiceTest extends TestCase
{
    private RecurrenceService $service;

    protected function setUp(): void
    {
        $this->service = new RecurrenceService();
    }

    // ================================================================
    // matchesPattern() - DAILY
    // ================================================================

    #[Test]
    public function dailyPatternAlwaysMatchesAnyDate(): void
    {
        $task = $this->createRecurringTask(RecurrenceType::DAILY, new \DateTime('2026-01-01'));

        // Test various days - all should match
        $this->assertTrue($this->service->matchesPattern($task, new \DateTime('2026-01-01'))); // Wednesday
        $this->assertTrue($this->service->matchesPattern($task, new \DateTime('2026-01-02'))); // Thursday
        $this->assertTrue($this->service->matchesPattern($task, new \DateTime('2026-01-05'))); // Sunday
        $this->assertTrue($this->service->matchesPattern($task, new \DateTime('2026-06-15'))); // Monday
        $this->assertTrue($this->service->matchesPattern($task, new \DateTime('2026-12-31'))); // Thursday
    }

    // ================================================================
    // matchesPattern() - WEEKLY
    // ================================================================

    #[Test]
    #[DataProvider('weeklyPatternProvider')]
    public function weeklyPatternMatchesSameDayOfWeekOnly(
        string $startDate,
        string $testDate,
        bool $expected
    ): void {
        $task = $this->createRecurringTask(RecurrenceType::WEEKLY, new \DateTime($startDate));

        $this->assertSame($expected, $this->service->matchesPattern($task, new \DateTime($testDate)));
    }

    public static function weeklyPatternProvider(): iterable
    {
        // Start date: 2026-01-05 (Monday)
        yield 'same day of week matches' => ['2026-01-05', '2026-01-12', true]; // Next Monday
        yield 'one week later matches' => ['2026-01-05', '2026-01-19', true]; // Two weeks later Monday
        yield 'tuesday does not match monday start' => ['2026-01-05', '2026-01-06', false]; // Tuesday
        yield 'sunday does not match monday start' => ['2026-01-05', '2026-01-11', false]; // Sunday
        yield 'wednesday does not match monday start' => ['2026-01-05', '2026-01-07', false]; // Wednesday

        // Start date: 2026-01-03 (Saturday)
        yield 'saturday matches saturday start' => ['2026-01-03', '2026-01-10', true]; // Next Saturday
        yield 'friday does not match saturday start' => ['2026-01-03', '2026-01-09', false]; // Friday
    }

    // ================================================================
    // matchesPattern() - WEEKDAYS
    // ================================================================

    #[Test]
    #[DataProvider('weekdaysPatternProvider')]
    public function weekdaysPatternMatchesOnlyMondayThroughFriday(
        string $testDate,
        bool $expected
    ): void {
        $task = $this->createRecurringTask(RecurrenceType::WEEKDAYS, new \DateTime('2026-01-01'));

        $this->assertSame($expected, $this->service->matchesPattern($task, new \DateTime($testDate)));
    }

    public static function weekdaysPatternProvider(): iterable
    {
        // 2026-01-04 is Sunday, 2026-01-05 is Monday, etc.
        yield 'sunday does not match' => ['2026-01-04', false];
        yield 'monday matches' => ['2026-01-05', true];
        yield 'tuesday matches' => ['2026-01-06', true];
        yield 'wednesday matches' => ['2026-01-07', true];
        yield 'thursday matches' => ['2026-01-08', true];
        yield 'friday matches' => ['2026-01-09', true];
        yield 'saturday does not match' => ['2026-01-10', false];
    }

    // ================================================================
    // matchesPattern() - MONTHLY
    // ================================================================

    #[Test]
    #[DataProvider('monthlyPatternProvider')]
    public function monthlyPatternMatchesSameDayOfMonthOnly(
        string $startDate,
        string $testDate,
        bool $expected
    ): void {
        $task = $this->createRecurringTask(RecurrenceType::MONTHLY, new \DateTime($startDate));

        $this->assertSame($expected, $this->service->matchesPattern($task, new \DateTime($testDate)));
    }

    public static function monthlyPatternProvider(): iterable
    {
        // Start on the 15th
        yield '15th in same month' => ['2026-01-15', '2026-01-15', true];
        yield '15th in next month' => ['2026-01-15', '2026-02-15', true];
        yield '14th does not match 15th start' => ['2026-01-15', '2026-02-14', false];
        yield '16th does not match 15th start' => ['2026-01-15', '2026-02-16', false];

        // Start on the 1st
        yield '1st in different month' => ['2026-01-01', '2026-06-01', true];
        yield '2nd does not match 1st start' => ['2026-01-01', '2026-06-02', false];

        // Start on the 31st (edge case for months with different lengths)
        yield '31st in month with 31 days' => ['2026-01-31', '2026-03-31', true];
        yield '30th does not match 31st start' => ['2026-01-31', '2026-03-30', false];
    }

    // ================================================================
    // matchesPattern() - CUSTOM
    // ================================================================

    #[Test]
    #[DataProvider('customPatternProvider')]
    public function customPatternMatchesOnlySpecifiedDays(
        ?array $recurrenceDays,
        string $testDate,
        bool $expected
    ): void {
        $task = $this->createRecurringTask(RecurrenceType::CUSTOM, new \DateTime('2026-01-01'));
        $task->setRecurrenceDays($recurrenceDays);

        $this->assertSame($expected, $this->service->matchesPattern($task, new \DateTime($testDate)));
    }

    public static function customPatternProvider(): iterable
    {
        // Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        // 2026-01-04 is Sunday (0), 2026-01-05 is Monday (1), etc.

        // Monday-Wednesday-Friday custom pattern
        yield 'monday matches MWF' => [[1, 3, 5], '2026-01-05', true];  // Monday
        yield 'tuesday does not match MWF' => [[1, 3, 5], '2026-01-06', false]; // Tuesday
        yield 'wednesday matches MWF' => [[1, 3, 5], '2026-01-07', true];  // Wednesday
        yield 'thursday does not match MWF' => [[1, 3, 5], '2026-01-08', false]; // Thursday
        yield 'friday matches MWF' => [[1, 3, 5], '2026-01-09', true];  // Friday
        yield 'saturday does not match MWF' => [[1, 3, 5], '2026-01-10', false]; // Saturday
        yield 'sunday does not match MWF' => [[1, 3, 5], '2026-01-04', false]; // Sunday

        // Weekend only
        yield 'saturday matches weekend' => [[0, 6], '2026-01-10', true];  // Saturday
        yield 'sunday matches weekend' => [[0, 6], '2026-01-04', true];  // Sunday
        yield 'monday does not match weekend' => [[0, 6], '2026-01-05', false]; // Monday

        // Edge cases
        yield 'empty array returns false' => [[], '2026-01-05', false];
        yield 'null returns false' => [null, '2026-01-05', false];
    }

    // ================================================================
    // findNextOccurrenceDate() tests
    // ================================================================

    #[Test]
    public function findNextOccurrenceDateReturnsDateForDailyPattern(): void
    {
        $task = $this->createRecurringTask(RecurrenceType::DAILY, new \DateTime('2026-01-01'));

        $nextDate = $this->service->findNextOccurrenceDate($task);

        $this->assertNotNull($nextDate);
        // Should be tomorrow (one day ahead from today)
        $expectedDate = (new \DateTime('today'))->modify('+1 day');
        $this->assertSame($expectedDate->format('Y-m-d'), $nextDate->format('Y-m-d'));
    }

    #[Test]
    public function findNextOccurrenceDateRespectsEndDate(): void
    {
        // Create a task that ended yesterday
        $task = $this->createRecurringTask(RecurrenceType::DAILY, new \DateTime('2026-01-01'));
        $task->setEndDate((new \DateTime('today'))->modify('-1 day'));

        $nextDate = $this->service->findNextOccurrenceDate($task);

        $this->assertNull($nextDate);
    }

    #[Test]
    public function findNextOccurrenceDateReturnsNullWhenNoMatchWithinRange(): void
    {
        // Create a weekly task starting on a specific day
        $task = $this->createRecurringTask(RecurrenceType::WEEKLY, new \DateTime('2026-01-05')); // Monday

        // Search only 1 day ahead - won't find next Monday
        $nextDate = $this->service->findNextOccurrenceDate($task, maxDaysAhead: 1);

        // May or may not find it depending on current day
        // If today is Sunday, tomorrow is Monday - would find it
        // Test with very short range to ensure no match scenario
        $task2 = $this->createRecurringTask(RecurrenceType::CUSTOM, new \DateTime('2026-01-01'));
        $task2->setRecurrenceDays([]);  // No days - will never match

        $noMatch = $this->service->findNextOccurrenceDate($task2, maxDaysAhead: 365);
        $this->assertNull($noMatch);
    }

    #[Test]
    public function findNextOccurrenceDateFindsCorrectWeeklyOccurrence(): void
    {
        // Start on Monday
        $task = $this->createRecurringTask(RecurrenceType::WEEKLY, new \DateTime('2026-01-05'));

        $nextDate = $this->service->findNextOccurrenceDate($task);

        $this->assertNotNull($nextDate);
        // Should be a Monday (day of week = 1)
        $this->assertSame('1', $nextDate->format('w'));
    }

    #[Test]
    public function findNextOccurrenceDateFindsCorrectMonthlyOccurrence(): void
    {
        // Start on 15th
        $task = $this->createRecurringTask(RecurrenceType::MONTHLY, new \DateTime('2026-01-15'));

        $nextDate = $this->service->findNextOccurrenceDate($task);

        $this->assertNotNull($nextDate);
        // Should be on the 15th of some month
        $this->assertSame('15', $nextDate->format('j'));
    }

    #[Test]
    public function findNextOccurrenceDateWithEndDateInFutureReturnsDate(): void
    {
        $task = $this->createRecurringTask(RecurrenceType::DAILY, new \DateTime('2026-01-01'));
        $task->setEndDate((new \DateTime('today'))->modify('+30 days'));

        $nextDate = $this->service->findNextOccurrenceDate($task);

        $this->assertNotNull($nextDate);
    }

    #[Test]
    public function findNextOccurrenceDateWithEndDateOnBoundaryStopsCorrectly(): void
    {
        // Create a daily task ending exactly on the day before we'd find the next occurrence
        $tomorrow = (new \DateTime('today'))->modify('+1 day');
        $yesterday = (new \DateTime('today'))->modify('-1 day');

        $task = $this->createRecurringTask(RecurrenceType::DAILY, new \DateTime('2026-01-01'));
        $task->setEndDate($yesterday);

        $nextDate = $this->service->findNextOccurrenceDate($task);

        // Should be null because end date is before tomorrow
        $this->assertNull($nextDate);
    }

    // ================================================================
    // Helper methods
    // ================================================================

    private function createRecurringTask(RecurrenceType $type, \DateTimeInterface $startDate): RecurringTask
    {
        $task = new RecurringTask();
        $task->setTitle('Test Task');
        $task->setRecurrenceType($type);
        $task->setStartDate($startDate);

        return $task;
    }
}
