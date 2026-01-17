<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260117060511 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE tasks ADD estimated_minutes INT DEFAULT NULL');
        $this->addSql('ALTER TABLE tasks ADD fixed_time TIME(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE tasks ADD can_combine_with_events JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE tasks ADD needs_full_focus BOOLEAN DEFAULT false NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE tasks DROP estimated_minutes');
        $this->addSql('ALTER TABLE tasks DROP fixed_time');
        $this->addSql('ALTER TABLE tasks DROP can_combine_with_events');
        $this->addSql('ALTER TABLE tasks DROP needs_full_focus');
    }
}
