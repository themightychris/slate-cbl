<?php

namespace Slate\CBL\Tasks;


use Emergence\People\Person;
use Emergence\Comments\Comment;

use Slate\CBL\Skill;
use Slate\CBL\StudentCompetency;
use Slate\CBL\Demonstrations\Demonstration;
use Slate\CBL\Demonstrations\ExperienceDemonstration;

class StudentTask extends \VersionedRecord
{
    public static $rateExpiredMissing = false;


    //VersionedRecord configuration
    public static $historyTable = 'history_cbl_student_tasks';


    // ActiveRecord configuration
    public static $tableName = 'cbl_student_tasks';
    public static $singularNoun = 'student task';
    public static $pluralNoun = 'student tasks';
    public static $collectionRoute = '/cbl/student-tasks';


    public static $fields = [
        'TaskID' => 'uint',
        'StudentID' => 'uint',

        'TaskStatus' => [
            'type' => 'enum',
            'notnull' => true,
            'values' => ['assigned', 're-assigned', 'submitted', 're-submitted', 'completed'],
            'default' => 'assigned'
        ],
        'DemonstrationID' => [
            'type' => 'uint',
            'default' => null
        ],

        // Task fields that can be overridden
        'DueDate' => [
            'type' => 'timestamp',
            'default' => null
        ],
        'ExpirationDate' => [
            'type' => 'timestamp',
            'default' => null
        ]
    ];

    public static $relationships = [
        'Task' => [
            'type' => 'one-one',
            'local' => 'TaskID',
            'class' => Task::class
        ],
        'Student' => [
            'type' => 'one-one',
            'local' => 'StudentID',
            'class' => Person::class
        ],
        'Comments' => [
            'type' => 'context-children',
            'class' => Comment::class
        ],
        'Attachments' => [
            'type' => 'context-children',
            'class' => Attachments\AbstractTaskAttachment::class
        ],
        'Submissions' => [
            'type' => 'one-many',
            'class' => StudentTaskSubmission::class,
            'foreign' => 'StudentTaskID',
            'local' => 'ID',
            'order' => ['Created' => 'ASC']
        ],
        'TaskSkills' => [
            'type' => 'one-many',
            'class' => StudentTaskSkill::class,
            'prune' => 'delete'
        ],
        'Skills' => [
            'type' => 'many-many',
            'class' => Skill::class,
            'linkClass' => StudentTaskSkill::class,
            'linkLocal' => 'StudentTaskID',
            'linkForeign' => 'SkillID'
        ],
        'Demonstration' => [
            'type' => 'one-one',
            'class' => Demonstration::class
        ]
    ];

    public static $dynamicFields = array(
        'Task',
        'Student',
        'SkillRatings',
        'Comments',
        'Attachments',
        'Submissions',
        // 'StudentName' => [
        //     'getter' => 'getStudentName'
        // ],
        // 'TaskSkills' => [
        //     'getter' => 'getTaskSkills'
        // ],
        'Skills',
        'Demonstration'
        // 'Submitted' => [
        //     'getter' => 'getSubmissionTimestamp'
        // ]
    );

    public static $indexes = [
        'StudentTask' => [
            'fields' => ['TaskID', 'StudentID'],
            'unique' => true
        ]
    ];

    public static $validators = [
        'Task' => 'require-relationship',
        'Student' => 'require-relationship'
    ];

    public static $searchConditions = [
        'Task' => [
            'qualifiers' => ['task'],
            'points' => 2,
            'sql' => 'TaskID = %u'
        ],
        'Student' => [
            'qualifiers' => ['student'],
            'points' => 2,
            'sql' => 'StudentID = %u'
        ]
    ];


    public function getOrCreateDemonstration()
    {
        if (!$this->Demonstration) {
            $this->Demonstration = ExperienceDemonstration::create([
                'StudentID' => $this->StudentID,
                'PerformanceType' => $this->Task->Title,
                'Context' => $this->Task->Section->Title,
                'ExperienceType' => $this->Task->ExperienceType
            ]);
        }

        return $this->Demonstration;
    }

    // TODO: delete all this?
    // public function getValue($name)
    // {
    //     switch ($name) {
    //         case 'AllSkills':
    //             return $this->Skills + ($this->Task ? $this->Task->Skills : []);

    //         default:
    //             return parent::getValue($name);
    //     }
    // }

    // public function getStudentName()
    // {
    //     return $this->Student->FullName;
    // }

    // public function getTaskSkills()
    // {
    //     // todo: use a UI-centric api endpoint instead of dynamic fields
    //     $taskSkills = [];
    //     $demoSkillIds = [];
    //     $demoSkills = $this->Demonstration ? $this->Demonstration->Skills : [];
    //     foreach ($demoSkills as $demoSkill) {
    //         $demoSkillIds[$demoSkill->SkillID] = $demoSkill;
    //     }

    //     if ($this->Task && $this->Task->Skills) {
    //         foreach ($this->Task->Skills as $skill) {
    //             $StudentCompetency = StudentCompetency::getCurrentForStudent($this->Student, $skill->Competency);
    //             $DemonstrationSkill = $demoSkillIds[$skill->ID];

    //             $taskSkills[] = array_merge($skill->getData(), [
    //                 'CompetencyLevel' => $StudentCompetency ? $StudentCompetency->Level : null,
    //                 'CompetencyCode' => $skill->Competency ? $skill->Competency->Code : null,
    //                 'CompetencyDescriptor' => $skill->Competency ? $skill->Competency->Descriptor : null,
    //                 'Rating' => $DemonstrationSkill ? $DemonstrationSkill->DemonstratedLevel : null,
    //                 'Level' => $DemonstrationSkill ? $DemonstrationSkill->TargetLevel : null
    //             ]);
    //         }
    //     }

    //     if ($this->Skills) {
    //         foreach ($this->Skills as $skill) {
    //             $StudentCompetency = StudentCompetency::getCurrentForStudent($this->Student, $skill->Competency);
    //             $DemonstrationSkill = $demoSkillIds[$skill->ID];

    //             $taskSkills[] = array_merge($skill->getData(), [
    //                 'CompetencyLevel' => $StudentCompetency ? $StudentCompetency->Level : null,
    //                 'CompetencyCode' => $skill->Competency ? $skill->Competency->Code : null,
    //                 'CompetencyDescriptor' => $skill->Competency ? $skill->Competency->Descriptor : null,
    //                 'Rating' => $DemonstrationSkill ? $DemonstrationSkill->DemonstratedLevel : null,
    //                 'Level' => $DemonstrationSkill ? $DemonstrationSkill->TargetLevel : null
    //             ]);
    //         }
    //     }

    //     return $taskSkills;
    // }

    // public function getSubmissionTimestamp()
    // {
    //     $timestamp = null;
    //     if (!empty($this->Submissions)) {
    //         $submission = end($this->Submissions);
    //         $timestamp = $submission->Created;
    //     }

    //     return $timestamp;
    // }
}
