<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260118170737 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE tasks ADD is_part BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE tasks ADD part_number SMALLINT DEFAULT NULL');
        $this->addSql('ALTER TABLE tasks ADD parent_task_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE tasks ADD CONSTRAINT FK_50586597FFFE75C0 FOREIGN KEY (parent_task_id) REFERENCES tasks (id) ON DELETE SET NULL NOT DEFERRABLE');
        $this->addSql('CREATE INDEX IDX_50586597FFFE75C0 ON tasks (parent_task_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE tasks DROP CONSTRAINT FK_50586597FFFE75C0');
        $this->addSql('DROP INDEX IDX_50586597FFFE75C0');
        $this->addSql('ALTER TABLE tasks DROP is_part');
        $this->addSql('ALTER TABLE tasks DROP part_number');
        $this->addSql('ALTER TABLE tasks DROP parent_task_id');
    }
}
