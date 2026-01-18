<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Twig\Environment;

class AuthMailerService
{
    private const TAGLINES_EN = [
        'Your chaos, organized',
        'Taming the ADHD brain',
        'Where chaos meets done',
        'Dopamine-driven productivity',
        'Your daily dopamine dealer',
    ];

    private const TAGLINES_PL = [
        'Twój chaos, zorganizowany',
        'Oswajanie mózgu z ADHD',
        'Gdzie chaos spotyka zrobione',
        'Produktywność napędzana dopaminą',
        'Twój codzienny dealer dopaminy',
    ];

    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly Environment $twig,
        private readonly string $mailFrom = 'noreply@dopaminder.app',
    ) {
    }

    public function sendLoginCode(User $user, string $code): void
    {
        $locale = $user->getLanguage();
        $taglines = $locale === 'pl' ? self::TAGLINES_PL : self::TAGLINES_EN;
        $tagline = $taglines[array_rand($taglines)];

        $html = $this->twig->render('emails/login_code.html.twig', [
            'code' => $code,
            'locale' => $locale,
            'tagline' => $tagline,
        ]);

        $text = $this->twig->render('emails/login_code.txt.twig', [
            'code' => $code,
            'locale' => $locale,
            'tagline' => $tagline,
        ]);

        $subject = $locale === 'pl'
            ? 'Dopaminder - Twój kod logowania'
            : 'Dopaminder - Your login code';

        $email = (new Email())
            ->from($this->mailFrom)
            ->to($user->getEmail())
            ->subject($subject)
            ->text($text)
            ->html($html);

        $this->mailer->send($email);
    }
}
