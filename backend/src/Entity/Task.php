<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\TaskCategory;
use App\Repository\TaskRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
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

    #[ORM\Column(type: 'boolean', options: [
        'default' => false,
    ])]
    private bool $isDropped = false;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $completedAt = null;

    #[ORM\Column(type: Types::TIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $reminderTime = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $estimatedMinutes = null;

    #[ORM\Column(type: Types::TIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $fixedTime = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $canCombineWithEvents = null;

    #[ORM\Column(type: 'boolean', options: [
        'default' => false,
    ])]
    private bool $needsFullFocus = false;

    #[ORM\ManyToOne(targetEntity: RecurringTask::class, inversedBy: 'generatedTasks')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?RecurringTask $recurringTask = null;

    /**
     * @var Collection<int, Tag>
     */
    #[ORM\ManyToMany(targetEntity: Tag::class, inversedBy: 'tasks')]
    #[ORM\JoinTable(name: 'task_tags')]
    private Collection $tags;

    #[ORM\ManyToOne(targetEntity: Task::class, inversedBy: 'subtasks')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Task $parentTask = null;

    /**
     * @var Collection<int, Task>
     */
    #[ORM\OneToMany(mappedBy: 'parentTask', targetEntity: Task::class)]
    private Collection $subtasks;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isPart = false;

    #[ORM\Column(type: Types::SMALLINT, nullable: true)]
    private ?int $partNumber = null;

    public function __construct()
    {
        $this->tags = new ArrayCollection();
        $this->subtasks = new ArrayCollection();
    }

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

    public function getEstimatedMinutes(): ?int
    {
        return $this->estimatedMinutes;
    }

    public function setEstimatedMinutes(?int $estimatedMinutes): static
    {
        $this->estimatedMinutes = $estimatedMinutes;

        return $this;
    }

    public function getFixedTime(): ?\DateTimeImmutable
    {
        return $this->fixedTime;
    }

    public function setFixedTime(?\DateTimeImmutable $fixedTime): static
    {
        $this->fixedTime = $fixedTime;

        return $this;
    }

    public function getCanCombineWithEvents(): ?array
    {
        return $this->canCombineWithEvents;
    }

    public function setCanCombineWithEvents(?array $canCombineWithEvents): static
    {
        $this->canCombineWithEvents = $canCombineWithEvents;

        return $this;
    }

    public function isNeedsFullFocus(): bool
    {
        return $this->needsFullFocus;
    }

    public function setNeedsFullFocus(bool $needsFullFocus): static
    {
        $this->needsFullFocus = $needsFullFocus;

        return $this;
    }

    public function getRecurringTask(): ?RecurringTask
    {
        return $this->recurringTask;
    }

    public function setRecurringTask(?RecurringTask $recurringTask): static
    {
        $this->recurringTask = $recurringTask;

        return $this;
    }

    /**
     * @return Collection<int, Tag>
     */
    public function getTags(): Collection
    {
        return $this->tags;
    }

    public function addTag(Tag $tag): static
    {
        if (!$this->tags->contains($tag)) {
            $this->tags->add($tag);
        }

        return $this;
    }

    public function removeTag(Tag $tag): static
    {
        $this->tags->removeElement($tag);

        return $this;
    }

    public function getParentTask(): ?Task
    {
        return $this->parentTask;
    }

    public function setParentTask(?Task $parentTask): static
    {
        $this->parentTask = $parentTask;

        return $this;
    }

    /**
     * @return Collection<int, Task>
     */
    public function getSubtasks(): Collection
    {
        return $this->subtasks;
    }

    public function addSubtask(Task $subtask): static
    {
        if (!$this->subtasks->contains($subtask)) {
            $this->subtasks->add($subtask);
            $subtask->setParentTask($this);
        }

        return $this;
    }

    public function removeSubtask(Task $subtask): static
    {
        if ($this->subtasks->removeElement($subtask)) {
            if ($subtask->getParentTask() === $this) {
                $subtask->setParentTask(null);
            }
        }

        return $this;
    }

    public function isPart(): bool
    {
        return $this->isPart;
    }

    public function setIsPart(bool $isPart): static
    {
        $this->isPart = $isPart;

        return $this;
    }

    public function getPartNumber(): ?int
    {
        return $this->partNumber;
    }

    public function setPartNumber(?int $partNumber): static
    {
        $this->partNumber = $partNumber;

        return $this;
    }

    /**
     * Check if all subtasks are completed (for parent tasks).
     */
    public function isFullyCompleted(): bool
    {
        if ($this->subtasks->isEmpty()) {
            return $this->isCompleted;
        }

        foreach ($this->subtasks as $subtask) {
            if (!$subtask->isCompleted()) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get progress string like "2/3" for parent tasks.
     */
    public function getProgress(): ?string
    {
        if ($this->subtasks->isEmpty()) {
            return null;
        }

        $completed = 0;
        $total = $this->subtasks->count();

        foreach ($this->subtasks as $subtask) {
            if ($subtask->isCompleted()) {
                $completed++;
            }
        }

        return sprintf('%d/%d', $completed, $total);
    }

    /**
     * Check if this task has subtasks.
     */
    public function hasSubtasks(): bool
    {
        return !$this->subtasks->isEmpty();
    }
}
