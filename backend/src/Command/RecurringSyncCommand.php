<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\RecurringSyncService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:recurring:sync',
    description: 'Generate tasks from recurring task definitions',
)]
class RecurringSyncCommand extends Command
{
    public function __construct(
        private readonly RecurringSyncService $recurringSyncService,
        private readonly UserRepository $userRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('date', 'd', InputOption::VALUE_OPTIONAL, 'Target date (Y-m-d format)', null)
            ->addOption('user', 'u', InputOption::VALUE_OPTIONAL, 'Specific user ID', null);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // Parse date option
        $dateString = $input->getOption('date');
        $date = $dateString ? new \DateTime($dateString) : new \DateTime('today');

        // Parse user option
        $user = null;
        $userId = $input->getOption('user');
        if ($userId !== null) {
            $user = $this->userRepository->find((int) $userId);
            if ($user === null) {
                $io->error(sprintf('User with ID %d not found', $userId));

                return Command::FAILURE;
            }
        }

        $io->title('Recurring Task Sync');
        $io->text(sprintf('Generating tasks for date: %s', $date->format('Y-m-d')));

        if ($user !== null) {
            $io->text(sprintf('User: %s (ID: %d)', $user->getEmail(), $user->getId()));
        } else {
            $io->text('Processing all users');
        }

        try {
            $generatedTasks = $this->recurringSyncService->syncForDate($date, $user);

            if (empty($generatedTasks)) {
                $io->info('No tasks generated');
            } else {
                $io->success(sprintf('%d task(s) generated', count($generatedTasks)));

                $io->table(
                    ['ID', 'Title', 'User'],
                    array_map(fn ($task) => [
                        $task->getId(),
                        $task->getTitle(),
                        $task->getDailyNote()?->getUser()?->getEmail() ?? 'N/A',
                    ], $generatedTasks)
                );
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $io->error(sprintf('Error: %s', $e->getMessage()));

            return Command::FAILURE;
        }
    }
}
