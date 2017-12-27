<?php

namespace Slate\CBL\Demonstrations;

use DB, TableNotFoundException;

use Emergence\People\Person;
use Emergence\People\GuardianRelationship;
use Emergence\People\PeopleRequestHandler;

use Sencha_App;
use Sencha_RequestHandler;

use Slate\CBL\ContentArea;
use Slate\CBL\ContentAreasRequestHandler;
use Slate\CBL\Competency;
use Slate\CBL\Skill;
use Slate\CBL\StudentCompetency;
use Slate\People\Student;


class StudentDashboardRequestHandler extends \RequestHandler
{
    public static $userResponseModes = [
        'application/json' => 'json',
        'text/csv' => 'csv'
    ];

    public static function handleRequest()
    {
        switch ($action = static::shiftPath()) {
            case '':
            case false:
                return static::handleDashboardRequest();

            case 'bootstrap':
                return static::handleBootstrapRequest();

            case 'recent-progress':
                return static::handleRecentProgressRequest();

            default:
                return static::throwNotFoundError();
        }
    }

    public static function handleDashboardRequest()
    {
        $GLOBALS['Session']->requireAuthentication();

        return Sencha_RequestHandler::respond('app/SlateDemonstrationsStudent/ext', [
            'App' => Sencha_App::getByName('SlateDemonstrationsStudent'),
            'mode' => 'production'
        ]);
    }

    public static function handleBootstrapRequest()
    {
        $GLOBALS['Session']->requireAuthentication();

        return static::respond('bootstrap', [
            'user' => $GLOBALS['Session']->Person
        ]);
    }

    public static function handleRecentProgressRequest()
    {
        $GLOBALS['Session']->requireAuthentication();
        $Student = static::_getRequestedStudent();
        $ContentArea = static::_getRequestedContentArea();


        $where = [
            'd.StudentID = ' . $Student->ID
        ];

        if ($ContentArea) {
            $where[] = 'c.ContentAreaID = ' . $ContentArea->ID;
        }


        $limit = isset($_GET['limit']) ? $_GET['limit'] : 10;


        try {
            // TODO: do name formatting on the client-side
            $progress = DB::allRecords('
                SELECT ds.TargetLevel AS targetLevel,
                       ds.DemonstratedLevel AS demonstratedLevel,
                       d.Created AS demonstrationCreated,
                       CONCAT(CASE p.Gender
                         WHEN "Male"   THEN "Mr. "
                         WHEN "Female" THEN "Ms. "
                          END, p.lastName) AS teacherTitle,
                       c.Descriptor AS competencyDescriptor,
                       s.Descriptor AS skillDescriptor,
                       d.StudentID,
                       c.ContentAreaID
                  FROM %s AS ds
                  JOIN %s AS p
                    ON ds.CreatorID = p.ID
                  JOIN %s AS d
                    ON d.ID = ds.DemonstrationID
                  JOIN %s AS s
                    ON s.ID = ds.SkillID
                  JOIN %s AS c
                    ON c.ID = s.CompetencyID
                  WHERE (%s)
                  ORDER BY d.ID DESC
                  LIMIT %d',
                [
                    DemonstrationSkill::$tableName,
                    Person::$tableName,
                    Demonstration::$tableName,
                    Skill::$tableName,
                    Competency::$tableName,
                    count($where) ? implode(') AND (', $where) : 'TRUE',
                    $limit
                ]
            );
        } catch (TableNotFoundException $e) {
            $progress = [];
        }

        // cast strings to integers
        foreach ($progress as &$progressRecord) {
            $progressRecord['demonstratedLevel'] = intval($progressRecord['demonstratedLevel']);
            $progressRecord['demonstrationCreated'] = strtotime($progressRecord['demonstrationCreated']);

            if ($Student) {
                unset($progressRecord['StudentID']);
            } else {
                $progressRecord['StudentID'] = intval($progressRecord['StudentID']);
            }

            if ($ContentArea) {
                unset($progressRecord['ContentAreaID']);
            } else {
                $progressRecord['ContentAreaID'] = intval($progressRecord['ContentAreaID']);
            }
        }


        return static::respond('progress', [
            'data' => $progress
        ]);
    }

    protected static function _getRequestedStudent()
    {
        if (!empty($_GET['student'])) {
            $Student = PeopleRequestHandler::getRecordByHandle($_GET['student']);
            $userIsStaff = $GLOBALS['Session']->hasAccountLevel('Staff');

            if ($Student && !$userIsStaff) {
                $GuardianRelationship = \Emergence\People\GuardianRelationship::getByWhere([
                    'PersonID' => $Student->ID,
                    'RelatedPersonID' => $GLOBALS['Session']->PersonID
                ]);
            }

            if (!$Student || ($Student->ID != $GLOBALS['Session']->PersonID && !$userIsStaff && !$GuardianRelationship)) {
                return static::throwNotFoundError('Student not found');
            }
        }

        if (!$Student) { // automatically set student to session user
            $Student = $GLOBALS['Session']->Person;
        }

        return $Student;
    }

    protected static function _getRequestedContentArea()
    {
        $ContentArea = null;

        if (!empty($_GET['content_area'])) {
            if (!$ContentArea = ContentAreasRequestHandler::getRecordByHandle($_GET['content_area'])) {
                return static::throwNotFoundError('Content area not found');
            }
        }

        return $ContentArea;
    }
}
