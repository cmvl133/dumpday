<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\TimeBlockExceptionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TimeBlockExceptionRepository::class)]
#[ORM\Table(name: 'time_block_exceptions')]
#[ORM\UniqueConstraint(name: 'time_block_date_unique', columns: ['time_block_id', 'exception_date'])]
#[ORM\HasLifecycleCallbacks]
class TimeBlockException
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: TimeBlock::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?TimeBlock $timeBlock = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $exceptionDate = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isSkipped = false;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $overrideStartTime = null;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $overrideEndTime = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTimeBlock(): ?TimeBlock
    {
        return $this->timeBlock;
    }

    public function setTimeBlock(?TimeBlock $timeBlock): static
    {
        $this->timeBlock = $timeBlock;

        return $this;
    }

    public function getExceptionDate(): ?\DateTimeInterface
    {
        return $this->exceptionDate;
    }

    public function setExceptionDate(\DateTimeInterface $exceptionDate): static
    {
        $this->exceptionDate = $exceptionDate;

        return $this;
    }

    public function isSkipped(): bool
    {
        return $this->isSkipped;
    }

    public function setIsSkipped(bool $isSkipped): static
    {
        $this->isSkipped = $isSkipped;

        return $this;
    }

    public function getOverrideStartTime(): ?\DateTimeInterface
    {
        return $this->overrideStartTime;
    }

    public function setOverrideStartTime(?\DateTimeInterface $overrideStartTime): static
    {
        $this->overrideStartTime = $overrideStartTime;

        return $this;
    }

    public function getOverrideEndTime(): ?\DateTimeInterface
    {
        return $this->overrideEndTime;
    }

    public function setOverrideEndTime(?\DateTimeInterface $overrideEndTime): static
    {
        $this->overrideEndTime = $overrideEndTime;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}
