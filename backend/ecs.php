<?php

declare(strict_types=1);

use PhpCsFixer\Fixer\Import\NoUnusedImportsFixer;
use PhpCsFixer\Fixer\Strict\DeclareStrictTypesFixer;
use Symplify\EasyCodingStandard\Config\ECSConfig;

return ECSConfig::configure()
    ->withPaths([
        __DIR__ . '/src',
        __DIR__ . '/tests',
    ])
    ->withRules([
        NoUnusedImportsFixer::class,
        DeclareStrictTypesFixer::class,
    ])
    ->withPreparedSets(
        psr12: true,
        arrays: true,
        namespaces: true,
        spaces: true,
        docblocks: true,
        comments: true,
    );
