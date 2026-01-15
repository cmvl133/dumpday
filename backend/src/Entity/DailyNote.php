<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\DailyNoteRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: DailyNoteRepository::class)]
#[ORM\Table(name: 'daily_notes')]
#[ORM\UniqueConstraint(name: 'unique_user_date', columns: ['user_id', 'date'])]
#[ORM\HasLifecycleCallbacks]
class DailyNote
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'dailyNotes')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $rawContent = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $updatedAt = null;

    /**
     * @var Collection<int, Task>
     */
    #[ORM\OneToMany(targetEntity: Task::class, mappedBy: 'dailyNote', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $tasks;

    /**
     * @var Collection<int, Event>
     */
    #[ORM\OneToMany(targetEntity: Event::class, mappedBy: 'dailyNote', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $events;

    /**
     * @var Collection<int, JournalEntry>
     */
    #[ORM\OneToMany(targetEntity: JournalEntry::class, mappedBy: 'dailyNote', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $journalEntries;

    /**
     * @var Collection<int, Note>
     */
    #[ORM\OneToMany(targetEntity: Note::class, mappedBy: 'dailyNote', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $notes;

    public function __construct()
    {
        $this->tasks = new ArrayCollection();
        $this->events = new ArrayCollection();
        $this->journalEntries = new ArrayCollection();
        $this->notes = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): static
    {
        $this->date = $date;

        return $this;
    }

    public function getRawContent(): ?string
    {
        return $this->rawContent;
    }

    public function setRawContent(?string $rawContent): static
    {
        $this->rawContent = $rawContent;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /**
     * @return Collection<int, Task>
     */
    public function getTasks(): Collection
    {
        return $this->tasks;
    }

    public function addTask(Task $task): static
    {
        if (! $this->tasks->contains($task)) {
            $this->tasks->add($task);
            $task->setDailyNote($this);
        }

        return $this;
    }

    public function removeTask(Task $task): static
    {
        if ($this->tasks->removeElement($task)) {
            if ($task->getDailyNote() === $this) {
                $task->setDailyNote(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Event>
     */
    public function getEvents(): Collection
    {
        return $this->events;
    }

    public function addEvent(Event $event): static
    {
        if (! $this->events->contains($event)) {
            $this->events->add($event);
            $event->setDailyNote($this);
        }

        return $this;
    }

    public function removeEvent(Event $event): static
    {
        if ($this->events->removeElement($event)) {
            if ($event->getDailyNote() === $this) {
                $event->setDailyNote(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, JournalEntry>
     */
    public function getJournalEntries(): Collection
    {
        return $this->journalEntries;
    }

    public function addJournalEntry(JournalEntry $journalEntry): static
    {
        if (! $this->journalEntries->contains($journalEntry)) {
            $this->journalEntries->add($journalEntry);
            $journalEntry->setDailyNote($this);
        }

        return $this;
    }

    public function removeJournalEntry(JournalEntry $journalEntry): static
    {
        if ($this->journalEntries->removeElement($journalEntry)) {
            if ($journalEntry->getDailyNote() === $this) {
                $journalEntry->setDailyNote(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Note>
     */
    public function getNotes(): Collection
    {
        return $this->notes;
    }

    public function addNote(Note $note): static
    {
        if (! $this->notes->contains($note)) {
            $this->notes->add($note);
            $note->setDailyNote($this);
        }

        return $this;
    }

    public function removeNote(Note $note): static
    {
        if ($this->notes->removeElement($note)) {
            if ($note->getDailyNote() === $this) {
                $note->setDailyNote(null);
            }
        }

        return $this;
    }

    public function clearAllItems(): void
    {
        $this->tasks->clear();
        $this->events->clear();
        $this->journalEntries->clear();
        $this->notes->clear();
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
}
