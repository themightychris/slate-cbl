Ext.define('Slate.cbl.model.tasks.StudentTask', {
    extend: 'Ext.data.Model',
    requires: [
        'Ext.data.identifier.Negative',

        /* global Slate */
        'Slate.cbl.proxy.tasks.StudentTasks',
        'Slate.cbl.model.tasks.Task'
    ],


    statics: {
        statusClasses: {
            'assigned': 'due',
            're-assigned': 'revision',
            'submitted': 'due needsrated',
            're-submitted': 'revision needsrated',
            'completed': 'completed'
        },
        lateStatusClasses: {
            'submitted': 'late needsrated',
            're-submitted': 'late needsrated',

            'assigned': 'late',
            're-assigned': 'late'
        },
        statusStrings: {
            'assigned': 'Due',
            're-assigned': 'Revision',
            'submitted': 'Submitted',
            're-submitted': 'Resubmitted',
            'completed': 'Completed'
        },
        activeStatuses: [
            'assigned',
            're-assigned',
            'submitted',
            're-submitted'
        ]
    },


    // model config
    idProperty: 'ID',
    identifier: 'negative',

    fields: [
        // ActiveRecord fields
        {
            name: 'ID',
            type: 'int',
            allowNull: true
        },
        {
            name: 'Class',
            type: 'string',
            defaultValue: 'Slate\\CBL\\Tasks\\StudentTask'
        },
        {
            name: 'Created',
            type: 'date',
            dateFormat: 'timestamp',
            allowNull: true,
            persist: false
        },
        {
            name: 'CreatorID',
            type: 'int',
            allowNull: true,
            persist: false
        },
        {
            name: 'Modified',
            type: 'date',
            dateFormat: 'timestamp',
            allowNull: true
        },
        {
            name: 'ModifierID',
            type: 'int',
            allowNull: true
        },

        // StudentTask fields
        {
            name: 'TaskID',
            type: 'int'
        },
        {
            name: 'StudentID',
            type: 'int'
        },
        {
            name: 'DueDate',
            type: 'date',
            dateFormat: 'timestamp',
            allowNull: true
        },
        {
            name: 'ExpirationDate',
            type: 'date',
            dateFormat: 'timestamp',
            allowNull: true
        },
        {
            name: 'TaskStatus',
            type: 'string',
            allowNull: true
        },
        {
            name: 'DemonstrationID',
            type: 'int',
            allowNull: true
        },

        // virtual fields
        {
            name: 'DueTime',
            persist: false,
            depends: ['DueDate'],
            convert: function(v, r) {
                var dueDate = r.get('DueDate'),
                    dueTime;

                if (!dueDate) {
                    return null;
                }

                dueTime = new Date(dueDate);

                // task is late after midnight of due date
                dueTime.setHours(23, 59, 59, 999);

                return dueTime;
            }
        },
        {
            name: 'IsLate',
            persist: false,
            depends: ['DueTime', 'TaskStatus'],
            convert: function (v, r) {
                var dueTime = r.get('DueTime');

                return (
                    dueTime
                    && dueTime.getTime() < Date.now()
                    && r.self.activeStatuses.indexOf(r.get('TaskStatus')) > -1
                );
            }
        },
        {
            name: 'Student',
            persist: false
        },
        {
            name: 'Task',
            persist: false
        },

        // fields inherited from Task
        {
            name: 'ExperienceType',
            persist: false,
            depends: ['Task'],
            convert: function(v, r) {
                var taskData = r.get('Task');

                return taskData && taskData.ExperienceType || null;
            }
        },
        {
            name: 'Instructions',
            persist: false,
            depends: ['Task'],
            convert: function(v, r) {
                var taskData = r.get('Task');

                return taskData && taskData.Instructions || null;
            }
        },
        {
            name: 'Attachments',
            persist: false,
            depends: ['Task'],
            convert: function(v, r) {
                var taskData = r.get('Task');

                return taskData && taskData.Attachments || [];
            }
        },

        // fields inherited from Task but overridable
        {
            name: 'InheritedDueDate',
            persist: false,
            depends: ['Task'],
            convert: function(v, r) {
                var taskData = r.get('Task');

                return Slate.cbl.model.tasks.Task.fieldsMap.DueDate.convert(taskData && taskData.DueDate);
            }
        },
        {
            name: 'EffectiveDueDate',
            persist: false,
            depends: ['DueDate', 'InheritedDueDate'],
            convert: function(v, r) {
                return r.get('DueDate') || r.get('InheritedDueDate');
            }
        },
        {
            name: 'InheritedExpirationDate',
            persist: false,
            depends: ['Task'],
            convert: function(v, r) {
                var taskData = r.get('Task');

                return Slate.cbl.model.tasks.Task.fieldsMap.DueDate.convert(taskData && taskData.ExpirationDate);
            }
        },
        {
            name: 'EffectiveExpirationDate',
            persist: false,
            depends: ['ExpirationDate', 'InheritedExpirationDate'],
            convert: function(v, r) {
                return r.get('ExpirationDate') || r.get('InheritedExpirationDate');
            }
        },
        {
            name: 'InheritedSkills',
            persist: false,
            depends: ['Task'],
            convert: function(v, r) {
                var taskData = r.get('Task');

                return Slate.cbl.model.tasks.Task.fieldsMap.Skills.convert(taskData && taskData.Skills);
            }
        },
        {
            name: 'EffectiveSkills',
            persist: false,
            depends: ['InheritedSkills'],
            convert: function(v, r) {
                var inherited = r.get('InheritedSkills');

                return inherited;
            }
        }
    ],

    proxy: 'slate-cbl-studenttasks',

    // TODO: review if still needed
    // getTaskSkillsGroupedByCompetency: function() {
    //     var comps = [], compIds = [],
    //         skills = this.get('TaskSkills') || [],
    //         compIdx, skill,
    //         i = 0;

    //     for (; i < skills.length; i++) {
    //         skill = skills[i];

    //         if ((compIdx = compIds.indexOf(skill.CompetencyCode)) === -1) {
    //             compIdx = compIds.length;
    //             comps[compIdx] = {
    //                 Code: skill.CompetencyCode,
    //                 Descriptor: skill.CompetencyDescriptor,
    //                 skills: []
    //             };
    //             compIds.push(skill.CompetencyCode);
    //         }

    //         comps[compIdx].skills.push(skill);
    //     }

    //     return comps;
    // },

    readOperationData: function(operation) {
        var me = this,
            response = operation.getResponse(),
            data = response && response.data,
            studentData = data && data.Student,
            taskData = data && data.Task;

        me.beginEdit();

        if (studentData) {
            me.set('StudentID', studentData.ID);
            me.set('Student', studentData, { dirty: false });
        }

        if (taskData) {
            me.set('TaskID', taskData.ID);
            me.set('Task', taskData, { dirty: false });
        }

        me.endEdit();
    },


    // static methods
    inheritableStatics: {
        load: function(options, session) {
            var record = new this({}, session),
                student = options.student,
                task = options.task,
                params;

            options = Ext.Object.chain(options);
            params = options.params = Ext.Object.chain(options.params || null);

            if (student || student === false) {
                params.student = student || '*current';
            }

            if (task) {
                params.task = task;
            }

            record.load(options);

            return record;
        }
    }
});
