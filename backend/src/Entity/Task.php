<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\TaskCategory;
use App\Repository\TaskRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TaskRepository::class)]
#[ORM\Table(name: 'tasks')]
class Task
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: DailyNote::class, inversedBy: 'tasks')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?DailyNote $dailyNote = null;

    #[ORM\Column(length: 500)]
    private ?string $title = null;

    #[ORM\Column]
    private bool $isCompleted = false;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dueDate = null;

    #[ORM\Column(type: 'string', enumType: TaskCategory::class)]
    private TaskCategory $category = TaskCategory::TODAY;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isDropped = false;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $completedAt = null;

    #[ORM\Column(type: Types::TIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $reminderTime = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDailyNote(): ?DailyNote
    {
        return $this->dailyNote;
    }

    public function setDailyNote(?DailyNote $dailyNote): static
    {
        $this->dailyNote = $dailyNote;

        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function isCompleted(): bool
    {
        return $this->isCompleted;
    }

    public function setIsCompleted(bool $isCompleted): static
    {
        $this->isCompleted = $isCompleted;

        return $this;
    }

    public function getDueDate(): ?\DateTimeInterface
    {
        return $this->dueDate;
    }

    public function setDueDate(?\DateTimeInterface $dueDate): static
    {
        $this->dueDate = $dueDate;

        return $this;
    }

    public function getCategory(): TaskCategory
    {
        return $this->category;
    }

    public function setCategory(TaskCategory $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function isDropped(): bool
    {
        return $this->isDropped;
    }

    public function setIsDropped(bool $isDropped): static
    {
        $this->isDropped = $isDropped;

        return $this;
    }

    public function getCompletedAt(): ?\DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function setCompletedAt(?\DateTimeImmutable $completedAt): static
    {
        $this->completedAt = $completedAt;

        return $this;
    }

    public function getReminderTime(): ?\DateTimeImmutable
    {
        return $this->reminderTime;
    }

    public function setReminderTime(?\DateTimeImmutable $reminderTime): static
    {
        $this->reminderTime = $reminderTime;

        return $this;
    }
}
