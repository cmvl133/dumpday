<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;
use Twig\Environment;

class BrainDumpAnalyzer
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly Environment $twig,
        private readonly string $openAiApiKey,
    ) {
    }

    public function analyze(string $rawContent, \DateTimeInterface $date): array
    {
        if (empty(trim($rawContent))) {
            return $this->getEmptyResponse();
        }

        $prompt = $this->twig->render('prompts/brain_dump_analysis.twig', [
            'raw_content' => $rawContent,
            'current_date' => $date->format('Y-m-d'),
            'day_of_week' => $this->getPolishDayOfWeek($date),
        ]);

        try {
            $response = $this->httpClient->request('POST', 'https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->openAiApiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.3,
                    'response_format' => [
                        'type' => 'json_object',
                    ],
                ],
            ]);

            $content = $response->toArray();
            $result = json_decode($content['choices'][0]['message']['content'], true);

            if ($result === null) {
                return $this->getEmptyResponse();
            }

            return $this->normalizeResponse($result);
        } catch (\Throwable $e) {
            throw new \RuntimeException('Failed to analyze brain dump: ' . $e->getMessage(), 0, $e);
        }
    }

    private function getPolishDayOfWeek(\DateTimeInterface $date): string
    {
        $days = [
            'Monday' => 'poniedziałek',
            'Tuesday' => 'wtorek',
            'Wednesday' => 'środa',
            'Thursday' => 'czwartek',
            'Friday' => 'piątek',
            'Saturday' => 'sobota',
            'Sunday' => 'niedziela',
        ];

        return $days[$date->format('l')] ?? $date->format('l');
    }

    private function getEmptyResponse(): array
    {
        return [
            'tasks' => [
                'today' => [],
                'scheduled' => [],
                'someday' => [],
            ],
            'events' => [],
            'notes' => [],
            'journal' => [],
        ];
    }

    private function normalizeResponse(array $result): array
    {
        return [
            'tasks' => [
                'today' => $result['tasks']['today'] ?? [],
                'scheduled' => $result['tasks']['scheduled'] ?? [],
                'someday' => $result['tasks']['someday'] ?? [],
            ],
            'events' => $result['events'] ?? [],
            'notes' => $result['notes'] ?? [],
            'journal' => $result['journal'] ?? [],
        ];
    }
}
