<?php

namespace Slate\CBL;

use DB;
use TableNotFoundException;

use Slate\People\Student;

use Slate\CBL\Demonstrations\Demonstration;
use Slate\CBL\Demonstrations\DemonstrationSkill;

class StudentCompetency extends \ActiveRecord
{
    public static $autoGraduate = true;

    // ActiveRecord configuration
    public static $tableName = 'cbl_student_competencies';
    public static $singularNoun = 'student competency';
    public static $pluralNoun = 'student competencies';
    public static $collectionRoute = '/cbl/student-competencies';

    public static $fields = [
        'StudentID' => [
            'type' => 'uint'
        ],
        'CompetencyID' => [
            'type' => 'uint'
        ],
        'Level' => [
            'type' => 'tinyint'
        ],
        'EnteredVia' => [
            'type' => 'enum',
            'values' => array('enrollment', 'graduation')
        ],
        'BaselineRating' => [
            'type' => 'decimal',
            'length' => '5,2',
            'default' => null
        ]
    ];

    public static $relationships = [
        'Student' => [
            'type' => 'one-one',
            'class' => Student::class
        ],
        'Competency' => [
            'type' => 'one-one',
            'class' => Competency::class
        ]
    ];

    public static $validators = [
        'Student' => 'require-relationship',
        'Competency' => 'require-relationship'
    ];

    public static $indexes = [
        'StudentCompetency' => [
            'fields' => ['StudentID', 'CompetencyID', 'Level'],
            'unique' => true
        ]
    ];

    public static $dynamicFields = [
        'completion' => [
            'getter' => 'getCompletion'
        ],
        'demonstrationsLogged' => [
            'getter' => 'getDemonstrationsLogged'
        ],
        'demonstrationsComplete' => [
            'getter' => 'getDemonstrationsComplete'
        ],
        'demonstrationsAverage' => [
            'getter' => 'getDemonstrationsAverage'
        ],
        'demonstrationData' => [
            'getter' => 'getDemonstrationData'
        ],
        'effectiveDemonstrationsData' => [
            'getter' => 'getEffectiveDemonstrationsData'
        ]
    ];

    public function getCompletion()
    {
        return [
            'StudentID' => $this->StudentID,
            'CompetencyID' => $this->CompetencyID,
            'currentLevel' => $this->Level,
            'baselineRating' => $this->BaselineRating,
            'demonstrationsLogged' => $this->getDemonstrationsLogged(),
            'demonstrationsComplete' => $this->getDemonstrationsComplete(),
            'demonstrationsAverage' => $this->getDemonstrationsAverage()
        ];
    }

    public function calculateStartingRating()
    {
        $validSkills = DB::table(
            'ID',
            '
            SELECT ID,
                REPLACE(
                   IFNULL (
                       JSON_EXTRACT(DemonstrationsRequired, \'$."%u"\'),
                       JSON_EXTRACT(DemonstrationsRequired, "$.default")
                   ),
                   \'"\',
                   ""
                ) AS DemonstrationsRequirements
              FROM `%s`
             WHERE CompetencyID = %u
            HAVING DemonstrationsRequirements > 0
            ',
            [
                $this->Level,
                Skill::$tableName,
                $this->Competency->ID
            ]
        );
        $validSkillIds = array_keys($validSkills);

        $ratedSkills = DB::valuesTable(
            'SkillID',
            'skillRatings',
            '
            SELECT COUNT(*) AS skillRatings, SkillID
        	  FROM `%1$s` ds
    		  JOIN `%2$s` d
    			ON d.ID = ds.DemonstrationID
    		 WHERE ds.SkillID IN (%3$s)
    		   AND ds.TargetLevel = %4$u
    		   AND ds.DemonstratedLevel > 0
    		   AND d.StudentID = %5$u
    		   AND ds.Override = false
    		 GROUP BY SkillID
            ',
            [
                DemonstrationSkill::$tableName,
                Demonstration::$tableName,
                join(', ', $validSkillIds),
                $this->Level,
                $this->StudentID
            ]
        );

        // starting rating can not be calculated if each required skill has not been rated at least once
        foreach ($validSkillIds as $skillId) {
            if (empty($ratedSkills[$skillId])) {
                return null;
            }
        }

        // get the first rating (by date) for each skill
        $demonstrationSkillRatings = DB::allValues(
            'skillRatings',
            '
            SELECT ds.DemonstratedLevel as skillRatings
        	  FROM `%1$s` ds
    		  JOIN `%2$s` d
    		    ON d.ID = ds.DemonstrationID
    		 INNER JOIN (
                    SELECT MIN(demo.Demonstrated) as Created, SkillID
    		          FROM `%1$s` demoskill
    		          JOIN `%2$s` demo
    		            ON demo.ID = demoskill.DemonstrationID
    		         WHERE TargetLevel = %3$u
                       AND DemonstratedLevel > 0
                       AND Override = false
                       AND demoskill.SkillID IN (%4$s)
                       AND demo.StudentID = %5$u
                     GROUP BY SkillID
    		  ) ds2
    		    ON ds2.SkillID = ds.SkillID
    		   AND ds2.Created = d.Demonstrated
    		 WHERE ds.SkillID IN (%4$s)
    		   AND ds.TargetLevel = %3$u
    		   AND ds.DemonstratedLevel > 0
    		   AND d.StudentID = %5$u
    		   AND ds.Override = false
            ',
            [
                DemonstrationSkill::$tableName,
                Demonstration::$tableName,
                $this->Level,
                join(', ', $validSkillIds),
                $this->StudentID
            ]
        );

        return array_sum($demonstrationSkillRatings) / count($validSkills);
    }

    private $demonstrationData;
    public function getDemonstrationData()
    {
        if ($this->demonstrationData === null) {
            try {
                $this->demonstrationData = DB::arrayTable(
                    'SkillID',
                    '
                    SELECT DemonstrationSkill.*,
                           Demonstration.Demonstrated AS DemonstrationDate
                      FROM `%s` DemonstrationSkill
                      JOIN (SELECT ID, Demonstrated FROM `%s` WHERE StudentID = %u) Demonstration
                        ON Demonstration.ID = DemonstrationSkill.DemonstrationID
                     WHERE DemonstrationSkill.SkillID IN (%s)
                       AND DemonstrationSkill.TargetLevel = %u
                     ORDER BY SkillID, DemonstrationDate, DemonstrationID
                    ',
                    [
                        DemonstrationSkill::$tableName,
                        Demonstration::$tableName,
                        $this->StudentID,
                        join(', ', $this->Competency->getSkillIds()),
                        $this->Level
                    ]
                );
            } catch (TableNotFoundException $e) {
                $this->demonstrationData = [];
            }
        }

        return $this->demonstrationData;
    }

    protected static function sortEffectiveDemonstrations($a, $b)
    {
        if ($a['DemonstratedLevel'] == $b['DemonstratedLevel']) {
            return 0;
        }
        return ($a['DemonstratedLevel'] < $b['DemonstratedLevel']) ? -1 : 1;
    }

    private $effectiveDemonstrationsData;
    public function getEffectiveDemonstrationsData()
    {
        if ($this->effectiveDemonstrationsData === null) {
            $demonstrationsData = $this->getDemonstrationData();

            foreach ($demonstrationsData as $skillId => &$demonstrationData) {
                uasort($demonstrationData, [__CLASS__,  'sortEffectiveDemonstrations']);

                $Skill = Skill::getByID($skillId);
                $demonstrationsRequired = $Skill->getDemonstrationsRequiredByLevel($this->Level);

                array_splice($demonstrationData, $demonstrationsRequired);
            }
            $this->effectiveDemonstrationsData = $demonstrationsData;
        }

        return $this->effectiveDemonstrationsData;
    }

    private $demonstrationsLogged;
    public function getDemonstrationsLogged()
    {
        if ($this->demonstrationsLogged === null) {
            $effectiveDemonstrationsData = $this->getEffectiveDemonstrationsData();
            $this->getDemonstrationsLogged = 0;
            foreach ($effectiveDemonstrationsData as $skillId => $demonstrationData) {
                $Skill = Skill::getByID($skillId);
                $skillCount = 0;
                foreach ($demonstrationData as $demonstration) {
                    if (empty($demonstration['Override']) && !empty($demonstration['DemonstratedLevel'])) {
                        $skillCount++;
                    }
                }
                $this->demonstrationsLogged += $skillCount;
            }
        }

        return $this->demonstrationsLogged;
    }

    private $demonstrationsComplete;
    public function getDemonstrationsComplete()
    {
        if ($this->demonstrationsComplete === null) {
            $effectiveDemonstrationsData = $this->getEffectiveDemonstrationsData();
            $this->demonstrationsComplete = 0;
            foreach ($effectiveDemonstrationsData as $skillId => $demonstrationData) {
                $Skill = Skill::getByID($skillId);
                $skillCount = 0;
                foreach ($demonstrationData as $demonstration) {
                    if (!empty($demonstration['DemonstratedLevel'])) {
                        if ($demonstration['Override']) {
                            $skillCount += $Skill->getDemonstrationsRequiredByLevel($this->Level);
                        } else {
                            $skillCount++;
                        }
                    }
                    $skillCount = min($Skill->getDemonstrationsRequiredByLevel($this->Level), $skillCount);
                }
                $this->demonstrationsComplete += $skillCount;
            }
        }

        return $this->demonstrationsComplete;
    }

    private $demonstrationsAverage;
    public function getDemonstrationsAverage()
    {
        if ($this->demonstrationsAverage === null) {
            if ($this->getDemonstrationsLogged()) {
                $effectiveDemonstrationsData = $this->getEffectiveDemonstrationsData();
                $totalScore = 0;
                foreach ($effectiveDemonstrationsData as $skillId => $demonstrationsData) {
                    foreach ($demonstrationsData as $demonstration) {
                        if (empty($demonstration['Override'])) {
                            $totalScore += $demonstration['DemonstratedLevel'];
                        }
                    }
                }
                $this->demonstrationsAverage = $totalScore / $this->getDemonstrationsLogged();
            }
        }

        return $this->demonstrationsAverage;
    }

    public function isLevelComplete()
    {
        $logged = $this->getDemonstrationsLogged();
        $completed = $this->getDemonstrationsComplete();
        $average = $this->getDemonstrationsAverage();

        $competencyEvidenceRequirements = $this->Competency->getTotalDemonstrationsRequired($this->Level);
        $minimumOffset = $this->Competency->getMinimumAverageOffset();

        return (
            $completed >= $comptencyEvidenceRequirements &&
            (
                $logged === 0 ||
                $average >= ($this->Level + $minimumOffset)
            )
        );
    }

    private $competencyGrowth;
    public function getGrowth()
    {
        if ($this->competencyGrowth === null && $this->BaselineRating) {
            $demonstrationData = $this->getDemonstrationData();

            $totalSkills = $this->Competency->getTotalSkills();

            $growthData = array_filter(array_map(function($demonstrations) {
                if (count($demonstrations) === 1 && $this->BaselineRating) {
                    return null;
                }

                $lastRating = end($demonstrations);
                if ($this->BaselineRating) {
                    return $lastRating['DemonstratedLevel'] - floatval($this->BaselineRating);
                } else {
                    $firstRating = reset($demonstrations);

                    return $lastRating['DemonstratedLevel'] - $firstRating['DemonstratedLevel'];
                }
            }, $demonstrationData));

            $totalGrowthSkills = count($growthData);
            if (false === (count($growthData) * 2 < $totalSkills)) {
                $this->competencyGrowth = array_sum($growthData) / $totalSkills;
            }
        }

        return $this->competencyGrowth;
    }


    public static function getCurrentForStudent(Student $Student, Competency $Competency)
    {
        return static::getByWhere(['StudentID' => $Student->ID, 'CompetencyID' => $Competency->ID], ['order' => ['Level' => 'DESC']]);
    }

    public static function isCurrentLevelComplete(Student $Student, Competency $Competency)
    {
        $StudentCompetency = static::getCurrentForStudent($Student, $Competency);

        if ($StudentCompetency) {
            return $StudentCompetency->isLevelComplete();
        }

        return false;
    }

    public static function getBlankCompletion(Student $Student, Competency $Competency)
    {
        return [
                'StudentID' => $Student->ID,
                'CompetencyID' => $Competency->ID,
                'currentLevel' => null,
                'baselineRating' => null,
                'demonstrationsLogged' => 0,
                'demonstrationsComplete' => 0,
                'demonstrationsAverage' => null
            ];
    }
}