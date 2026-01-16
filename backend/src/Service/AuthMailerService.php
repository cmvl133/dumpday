<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

class AuthMailerService
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly string $mailFrom = 'noreply@dopaminder.app',
    ) {
    }

    public function sendLoginCode(User $user, string $code): void
    {
        $email = (new Email())
            ->from($this->mailFrom)
            ->to($user->getEmail())
            ->subject('Dopaminder - Twój kod logowania')
            ->text($this->getPlainTextContent($code))
            ->html($this->getHtmlContent($code));

        $this->mailer->send($email);
    }

    private function getPlainTextContent(string $code): string
    {
        return <<<TEXT
Twój kod logowania do Dopaminder:

$code

Kod jest ważny przez 10 minut.

Jeśli nie prosiłeś o ten kod, zignoruj tę wiadomość.
TEXT;
    }

    private function getHtmlContent(string $code): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 30px; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; }
        .text { color: #666; line-height: 1.5; }
        .footer { margin-top: 30px; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">Dopaminder</div>
        <p class="text">Twój kod logowania:</p>
        <div class="code">$code</div>
        <p class="text">Kod jest ważny przez <strong>10 minut</strong>.</p>
        <p class="footer">Jeśli nie prosiłeś o ten kod, zignoruj tę wiadomość.</p>
    </div>
</body>
</html>
HTML;
    }
}
