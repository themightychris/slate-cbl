<?php

namespace Slate\CBL\Tasks;

use Slate\People\Student;
use Slate\CBL\Skill;
use Slate\CBL\Tasks\Attachments\AbstractTaskAttachment;
use Slate\Courses\SectionsRequestHandler;
use Emergence\People\PeopleRequestHandler;
use Emergence\Comments\Comment;

class StudentTasksRequestHandler extends \RecordsRequestHandler
{
    public static $recordClass =  StudentTask::class;
    public static $accountLevelBrowse = 'User';
    //public static $browseOrder = ['TaskID' => 'ASC'];

    /*
    public static $browseConditions = [
        'Status' => [
            'operator' => '!=',
            'value' => 'deleted'
        ]
    ];
    */


    public static function handleRecordsRequest($action = false)
    {
        $CurrentUser = $GLOBALS['Session']->Person;

        switch ($action = $action ?: static::shiftPath()) {
            case 'assigned':
                return static::handleAssignedRequest();
            default:
                return parent::handleRecordsRequest($action);
        }
    }


    public static function handleRecordRequest(\ActiveRecord $Record, $action = false)
    {
        switch ($action = $action ?: static::shiftPath()) {
            case 'rate':
                return static::handleRateSkillRequest($Record);
            default:
                return parent::handleRecordRequest($Record, $action);
        }
    }

    public static function handleAssignedRequest($options = [], $conditions = [])
    {
        $student = static::_getRequestedStudent();

        $conditions['StudentID'] = $student->ID;

        return static::handleBrowseRequest($options, $conditions);

    }

    public static function handleBrowseRequest($options = [], $conditions = [], $responseID = null, $responseData = [])
    {
        $student = static::_getRequestedStudent();
        $courseSection = static::_getRequestedCourseSection();

        if ($courseSection) {
            $conditions['CourseSectionID'] = $courseSection->ID;
        }

        return parent::handleBrowseRequest($options, $conditions, $responseID, $responseData);
    }

    public static function handleRateSkillRequest(StudentTask $Record)
    {
        $requestData = $_REQUEST;
        $rating = $requestData['Score'];
        $skillId = $requestData['SkillID'];
        $error = null;
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {

            if (!isset($skillId) || !$Skill = Skill::getByHandle($skillId)) {
                $error = sprintf('Skill %s not found.', $skillId);
            } else {

                if (!$skillRating = StudentTaskSkillRating::getByWhere(['StudentTaskID' => $Record->ID, 'SkillID' => $Skill->ID])) {
                    $skillRating = StudentTaskSkillRating::create([
                        'StudentTaskID' => $Record->ID,
                        'SkillID' => $Skill->ID
                    ]);
                }

                $skillRating->Score = $rating;
                $skillRating->save(false);
            }


        }

        return static::respond('studenttask/ratings', [
            'data' => $skillRating,
            'record' => $Record,
            'success' => empty($error),
            'error' => $error
        ]);
    }

    public static function onRecordSaved(\ActiveRecord $Record, $data)
    {

        if (is_array($data) && isset($data['Comment'])) {
            Comment::create([
                'ContextClass' => $Record->getRootClass(),
                'ContextID' => $Record->ID,
                'Message' => $data['Comment']
            ], true);
        }

        //update attachments
        if (isset($data['Attachments'])) {
            $originalAttachments = $Record->Attachments;
            $originalAttachmentIds = array_map(function($s) {
                return $s->ID;
            }, $originalAttachments);

            $failed = [];
            $attachmentIds = [];
            $attachments = [];
            $defaultAttachmentClass = AbstractTaskAttachment::$defaultClass;

            foreach ($data['Attachments'] as $attachmentData) {
                $attachmentClass = $attachmentData['Class'] ?: $defaultAttachmentClass;
                if ($attachmentData['ID'] >= 1) {
                    if (!$Attachment = $attachmentClass::getByID($attachmentData['ID'])) {
                        $failed[] = $attachmentData;
                        continue;
                    }
                } else {
                    $Attachment = $attachmentClass::create($attachmentData);
                }

                $Attachment->ContextID = $Record->ID;
                $Attachment->ContextClass = $Record->getRootClass();
                $Attachment->save();
                $attachments[] = $Attachment;
                $attachmentIds[] = $Attachment->ID;
            }


            \DB::nonQuery('DELETE FROM `%s` WHERE ContextClass = "%s" AND ContextID = %u AND ID NOT IN ("%s")', [
                AbstractTaskAttachment::$tableName,
                $Record->getRootClass(),
                $Record->ID,
                join('", "', $attachmentIds)
            ]);

        }
        $Record->Attachments = $attachments;

        // update skills
        if (isset($data['SkillIDs'])) {
            $originalSkills = $Record->Skills;
            $originalSkillIds = array_map(function($s) {
                return $s->ID;
            }, $originalSkills);

            $oldSkillIds = array_diff($originalSkillIds, $data['SkillIDs']);
            $newSkillIds = array_diff($data['SkillIDs'], $originalSkillIds);

            foreach ($newSkillIds as $newSkill) {
                if (!$taskSkill = TaskSkill::getByWhere(['TaskID' => $Record->Task->ID, 'SkillID' => $newSkill])) { // check if skill is attached to related task first
                    StudentTaskSkill::create([
                        'StudentTaskID' => $Record->ID,
                        'SkillID' => $newSkill
                    ], true);
                }
            }

            if (!empty($oldSkillIds)) {

                DB::nonQuery('DELETE FROM `%s` WHERE StudentTaskID = %u AND SkillID IN ("%s")', [
                    StudentTaskSkill::$tableName,
                    $Record->ID,
                    join('", "', $oldSkillIds)
                ]);
            }
        }

    }

    public static function checkWriteAccess(\ActiveRecord $Record, $suppressLogin = false)
    {
        if ($Record && $Record->StudentID == $GLOBALS['Session']->PersonID) {
            return true;
        }

        return parent::checkWriteAccess($Record, $suppressLogin);
    }

    protected static function _getRequestedStudent()
    {
        if (
            !empty($_GET['student']) &&
            $GLOBALS['Session']->hasAccountLevel('Staff')
        ) {
            if (!$Student = PeopleRequestHandler::getRecordByHandle($_GET['student'])) {
                return static::throwNotFoundError('Student not found');
            }
        } else {
            $Student = $GLOBALS['Session']->Person;
        }

        return $Student;
    }

    protected static function _getRequestedCourseSection()
    {
        $CourseSection = null;

        if (!empty($_GET['course_section'])) {
            if (!$CourseSection = SectionsRequestHandler::getRecordByHandle($_GET['course_section'])) {
                return static::throwNotFoundError('Course Section not found');
            }
        }

        return $CourseSection;
    }
}

