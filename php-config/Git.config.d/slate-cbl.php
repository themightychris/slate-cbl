<?php

Git::$repositories['slate-cbl'] = [
    'remote' => 'https://github.com/SlateFoundation/slate-cbl.git',
    'originBranch' => 'releases/v3',
    'workingBranch' => 'releases/v3',
    'localOnly' => true,
    'trees' => [
        'api-docs/definitions/Slate/CBL',
        'data-exporters/slate-cbl',
        'event-handlers/Slate/CBL',
        'event-handlers/Emergence/Site/nightly-maintenance/50_cbl-google-drive-changes-monitor.php',
        'event-handlers/Emergence/Site/nightly-maintenance/50_cbl-invalidate-expired-tasks.php',
        'html-templates/webapps/SlateDemonstrationsStudent',
        'html-templates/webapps/SlateDemonstrationsTeacher',
        'html-templates/webapps/SlateStudentCompetenciesAdmin',
        'html-templates/webapps/SlateTasksManager',
        'html-templates/webapps/SlateTasksStudent',
        'html-templates/webapps/SlateTasksTeacher',
        'html-templates/cbl',
        'html-templates/connectors/cbl-maps',
        'html-templates/exports/exports.tpl',
        'html-templates/google-drive/files.tpl',
        'php-classes/Google/API.php',
        'php-classes/Google/Drive',
        'php-classes/Google/DriveFile.php',
        'php-classes/Google/RequestBuilder.php',
        'php-classes/Google/ResponseProcessor.php',
        'php-classes/Slate/CBL',
        'php-config/Git.config.d/slate-cbl.php',
        'php-config/Slate/CBL/Demonstrations/ExperienceDemonstration.config.d/context.php',
        'php-config/Slate/CBL/Demonstrations/ExperienceDemonstration.config.d/experience-type.php',
        'php-config/Slate/CBL/Demonstrations/ExperienceDemonstration.config.d/performance-type.php',
        'php-config/Slate/CBL/Tasks/ExperienceTask.config.d/experience-type.php',
        'php-config/Slate/UI/Tools.config.d/cbl.php',
        'php-config/Slate/UI/UserProfile.config.d/cbl.php',
        'php-config/Slate/UI/SectionProfile.config.d/cbl.php',
        'php-migrations/Slate/CBL',
        'sencha-workspace/packages/slate-cbl',
        'sencha-workspace/SlateDemonstrationsStudent',
        'sencha-workspace/SlateDemonstrationsTeacher',
        'sencha-workspace/SlateStudentCompetenciesAdmin',
        'sencha-workspace/SlateTasksManager',
        'sencha-workspace/SlateTasksStudent',
        'sencha-workspace/SlateTasksTeacher',
        'site-root/cbl',
        'site-root/connectors/cbl-maps.php',
        'site-root/google-drive/files.php',
        'site-root/google-drive/user-change-monitor.php'
    ]
];
