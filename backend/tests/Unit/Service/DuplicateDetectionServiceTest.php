<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Service\DuplicateDetectionService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class DuplicateDetectionServiceTest extends TestCase
{
    private DuplicateDetectionService $service;

    protected function setUp(): void
    {
        $this->service = new DuplicateDetectionService();
    }

    // ================================================================
    // isTaskDuplicate() tests
    // ================================================================

    #[Test]
    #[DataProvider('taskDuplicateProvider')]
    public function detectsTaskDuplicates(string $newTitle, array $existing, bool $expected): void
    {
        $this->assertSame($expected, $this->service->isTaskDuplicate($newTitle, $existing));
    }

    public static function taskDuplicateProvider(): iterable
    {
        yield 'exact match returns true' => ['Buy milk', ['Buy milk'], true];
        yield 'case insensitive lowercase' => ['buy milk', ['Buy Milk'], true];
        yield 'case insensitive uppercase' => ['BUY MILK', ['buy milk'], true];
        yield 'whitespace normalized leading' => ['  Buy milk', ['Buy milk'], true];
        yield 'whitespace normalized trailing' => ['Buy milk  ', ['Buy milk'], true];
        yield 'whitespace normalized both' => ['  Buy milk  ', ['Buy milk'], true];
        yield 'whitespace in existing' => ['Buy milk', ['  Buy milk  '], true];
        yield 'no match returns false' => ['Buy milk', ['Get bread'], false];
        yield 'empty existing array returns false' => ['Buy milk', [], false];
        yield 'partial match is not duplicate' => ['Buy milk', ['Buy'], false];
        yield 'substring is not duplicate' => ['Buy', ['Buy milk'], false];
        yield 'multiple items with match' => ['Buy milk', ['Get bread', 'Buy milk', 'Walk dog'], true];
        yield 'multiple items without match' => ['Buy milk', ['Get bread', 'Walk dog'], false];
        yield 'mixed case and whitespace' => ['  BUY MILK  ', ['  buy milk  '], true];
    }

    // ================================================================
    // isEventDuplicate() tests
    // ================================================================

    #[Test]
    #[DataProvider('eventDuplicateProvider')]
    public function detectsEventDuplicates(
        string $newTitle,
        ?\DateTimeInterface $newStart,
        ?\DateTimeInterface $newEnd,
        array $existingEvents,
        bool $expected
    ): void {
        $this->assertSame($expected, $this->service->isEventDuplicate($newTitle, $newStart, $newEnd, $existingEvents));
    }

    public static function eventDuplicateProvider(): iterable
    {
        $event10to11 = [
            'title' => 'Meeting',
            'startTime' => new \DateTime('10:00'),
            'endTime' => new \DateTime('11:00'),
        ];
        $event11to12 = [
            'title' => 'Meeting',
            'startTime' => new \DateTime('11:00'),
            'endTime' => new \DateTime('12:00'),
        ];
        $eventDifferentTitle = [
            'title' => 'Standup',
            'startTime' => new \DateTime('10:00'),
            'endTime' => new \DateTime('11:00'),
        ];

        yield 'same title overlapping times is duplicate' => [
            'Meeting',
            new \DateTime('10:30'),
            new \DateTime('11:30'),
            [$event10to11],
            true,
        ];

        yield 'same title non-overlapping times not duplicate' => [
            'Meeting',
            new \DateTime('12:00'),
            new \DateTime('13:00'),
            [$event10to11],
            false,
        ];

        yield 'different title overlapping times not duplicate' => [
            'Different Meeting',
            new \DateTime('10:30'),
            new \DateTime('11:30'),
            [$event10to11],
            false,
        ];

        yield 'case insensitive title match' => [
            'MEETING',
            new \DateTime('10:30'),
            new \DateTime('11:00'),
            [$event10to11],
            true,
        ];

        yield 'adjacent times do not overlap' => [
            'Meeting',
            new \DateTime('11:00'),
            new \DateTime('12:00'),
            [$event10to11],
            false,
        ];

        yield 'empty existing events returns false' => [
            'Meeting',
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            [],
            false,
        ];

        yield 'null new start time returns false' => [
            'Meeting',
            null,
            new \DateTime('11:00'),
            [$event10to11],
            false,
        ];

        yield 'title with whitespace normalized' => [
            '  Meeting  ',
            new \DateTime('10:30'),
            new \DateTime('11:00'),
            [$event10to11],
            true,
        ];

        yield 'multiple events with one match' => [
            'Meeting',
            new \DateTime('10:30'),
            new \DateTime('11:00'),
            [$eventDifferentTitle, $event10to11],
            true,
        ];

        yield 'same title different day returns duplicate if times overlap' => [
            'Meeting',
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            [[
                'title' => 'Meeting',
                'startTime' => new \DateTime('10:00'),
                'endTime' => new \DateTime('11:00'),
            ]],
            true,
        ];
    }

    // ================================================================
    // timesOverlap() tests
    // ================================================================

    #[Test]
    #[DataProvider('timesOverlapProvider')]
    public function detectsTimesOverlap(
        ?\DateTimeInterface $start1,
        ?\DateTimeInterface $end1,
        ?\DateTimeInterface $start2,
        ?\DateTimeInterface $end2,
        bool $expected
    ): void {
        $this->assertSame($expected, $this->service->timesOverlap($start1, $end1, $start2, $end2));
    }

    public static function timesOverlapProvider(): iterable
    {
        yield 'overlapping ranges return true' => [
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            new \DateTime('10:30'),
            new \DateTime('11:30'),
            true,
        ];

        yield 'contained range returns true' => [
            new \DateTime('10:00'),
            new \DateTime('12:00'),
            new \DateTime('10:30'),
            new \DateTime('11:30'),
            true,
        ];

        yield 'identical ranges return true' => [
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            true,
        ];

        yield 'adjacent ranges 10-11 and 11-12 do not overlap' => [
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            new \DateTime('11:00'),
            new \DateTime('12:00'),
            false,
        ];

        yield 'non-overlapping ranges return false' => [
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            new \DateTime('12:00'),
            new \DateTime('13:00'),
            false,
        ];

        yield 'null start1 returns false' => [
            null,
            new \DateTime('11:00'),
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            false,
        ];

        yield 'null start2 returns false' => [
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            null,
            new \DateTime('11:00'),
            false,
        ];

        yield 'both starts null returns false' => [
            null,
            new \DateTime('11:00'),
            null,
            new \DateTime('11:00'),
            false,
        ];

        yield 'null end1 uses 1 hour default - overlapping' => [
            new \DateTime('10:00'),
            null,  // Defaults to 11:00
            new \DateTime('10:30'),
            new \DateTime('11:30'),
            true,
        ];

        yield 'null end2 uses 1 hour default - overlapping' => [
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            new \DateTime('10:30'),
            null,  // Defaults to 11:30
            true,
        ];

        yield 'null end1 uses 1 hour default - not overlapping' => [
            new \DateTime('10:00'),
            null,  // Defaults to 11:00
            new \DateTime('12:00'),
            new \DateTime('13:00'),
            false,
        ];

        yield 'both ends null use 1 hour default - overlapping' => [
            new \DateTime('10:00'),
            null,  // Defaults to 11:00
            new \DateTime('10:30'),
            null,  // Defaults to 11:30
            true,
        ];

        yield 'partial overlap at start returns true' => [
            new \DateTime('09:00'),
            new \DateTime('10:30'),
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            true,
        ];

        yield 'partial overlap at end returns true' => [
            new \DateTime('10:30'),
            new \DateTime('12:00'),
            new \DateTime('10:00'),
            new \DateTime('11:00'),
            true,
        ];
    }

    // ================================================================
    // isContentDuplicate() tests
    // ================================================================

    #[Test]
    #[DataProvider('contentDuplicateProvider')]
    public function detectsContentDuplicates(string $newContent, array $existing, bool $expected): void
    {
        $this->assertSame($expected, $this->service->isContentDuplicate($newContent, $existing));
    }

    public static function contentDuplicateProvider(): iterable
    {
        yield 'exact match returns true' => [
            'Today was a good day',
            ['Today was a good day'],
            true,
        ];

        yield 'case insensitive lowercase' => [
            'today was a good day',
            ['Today Was A Good Day'],
            true,
        ];

        yield 'case insensitive uppercase' => [
            'TODAY WAS A GOOD DAY',
            ['today was a good day'],
            true,
        ];

        yield 'whitespace normalized leading' => [
            '  Today was a good day',
            ['Today was a good day'],
            true,
        ];

        yield 'whitespace normalized trailing' => [
            'Today was a good day  ',
            ['Today was a good day'],
            true,
        ];

        yield 'whitespace normalized both' => [
            '  Today was a good day  ',
            ['Today was a good day'],
            true,
        ];

        yield 'whitespace in existing' => [
            'Today was a good day',
            ['  Today was a good day  '],
            true,
        ];

        yield 'no match returns false' => [
            'Today was a good day',
            ['Yesterday was terrible'],
            false,
        ];

        yield 'empty existing array returns false' => [
            'Today was a good day',
            [],
            false,
        ];

        yield 'partial match is not duplicate' => [
            'Today',
            ['Today was a good day'],
            false,
        ];

        yield 'substring is not duplicate' => [
            'Today was a good day',
            ['Today'],
            false,
        ];

        yield 'multiple items with match' => [
            'Second note',
            ['First note', 'Second note', 'Third note'],
            true,
        ];

        yield 'multiple items without match' => [
            'Fourth note',
            ['First note', 'Second note', 'Third note'],
            false,
        ];

        yield 'mixed case and whitespace' => [
            '  TODAY WAS A GOOD DAY  ',
            ['  today was a good day  '],
            true,
        ];

        yield 'multiline content exact match' => [
            "Line 1\nLine 2",
            ["Line 1\nLine 2"],
            true,
        ];

        yield 'empty string matches empty string' => [
            '',
            [''],
            true,
        ];

        yield 'empty string does not match non-empty' => [
            '',
            ['Some content'],
            false,
        ];

        yield 'whitespace only matches whitespace only' => [
            '   ',
            ['  '],
            true,  // Both trim to empty string
        ];
    }
}
