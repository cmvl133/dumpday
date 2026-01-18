<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\RecurrenceType;
use App\Enum\TaskCategory;
use App\Repository\RecurringTaskRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RecurringTaskRepository::class)]
#[ORM\Table(name: 'recurring_tasks')]
#[ORM\HasLifecycleCallbacks]
class RecurringTask
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(length: 500)]
    private ?string $title = null;

    #[ORM\Column(type: 'string', enumType: RecurrenceType::class)]
    private RecurrenceType $recurrenceType = RecurrenceType::DAILY;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $recurrenceDays = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $startDate = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $endDate = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $lastGeneratedDate = null;

    #[ORM\Column(type: 'string', enumType: TaskCategory::class)]
    private TaskCategory $category = TaskCategory::TODAY;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $estimatedMinutes = null;

    #[ORM\Column(type: Types::TIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $fixedTime = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'boolean', options: [
        'default' => true,
    ])]
    private bool $isActive = true;

    /**
     * @var Collection<int, Task>
     */
    #[ORM\OneToMany(targetEntity: Task::class, mappedBy: 'recurringTask')]
    private Collection $generatedTasks;

    public function __construct()
    {
        $this->generatedTasks = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

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

    public function getRecurrenceType(): RecurrenceType
    {
        return $this->recurrenceType;
    }

    public function setRecurrenceType(RecurrenceType $recurrenceType): static
    {
        $this->recurrenceType = $recurrenceType;

        return $this;
    }

    public function getRecurrenceDays(): ?array
    {
        return $this->recurrenceDays;
    }

    public function setRecurrenceDays(?array $recurrenceDays): static
    {
        $this->recurrenceDays = $recurrenceDays;

        return $this;
    }

    public function getStartDate(): ?\DateTimeInterface
    {
        return $this->startDate;
    }

    public function setStartDate(\DateTimeInterface $startDate): static
    {
        $this->startDate = $startDate;

        return $this;
    }

    public function getEndDate(): ?\DateTimeInterface
    {
        return $this->endDate;
    }

    public function setEndDate(?\DateTimeInterface $endDate): static
    {
        $this->endDate = $endDate;

        return $this;
    }

    public function getLastGeneratedDate(): ?\DateTimeInterface
    {
        return $this->lastGeneratedDate;
    }

    public function setLastGeneratedDate(?\DateTimeInterface $lastGeneratedDate): static
    {
        $this->lastGeneratedDate = $lastGeneratedDate;

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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    /**
     * @return Collection<int, Task>
     */
    public function getGeneratedTasks(): Collection
    {
        return $this->generatedTasks;
    }
}
