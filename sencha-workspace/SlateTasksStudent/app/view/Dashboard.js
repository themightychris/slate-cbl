/**
 * The application's top level container, to be manually rendered to a
 * specific pre-painted container in the design
 */
Ext.define('SlateTasksStudent.view.Dashboard', {
    extend: 'Ext.container.Container',
    xtype: 'slate-tasks-student-dashboard',
    requires: [
        'Ext.layout.container.Column',

        'SlateTasksStudent.view.AppHeader',
        'SlateTasksStudent.view.TaskTree',
        'SlateTasksStudent.view.TodoList'
    ],


    config: {
        student: null,
        section: null
    },

    items: [
        {
            xtype: 'slate-tasks-student-appheader',
            style: {
                border: 'none',
                padding: '1em 7.5%'
            }
        },
        {
            // like .site > .inner
            xtype: 'container',
            style: {
                padding: '2em 7.5%'
            },
            items: [
                {
                    xtype: 'container',
                    layout: 'column',
                    defaults: {
                        columnWidth: 0.5
                    },
                    items: [
                        {
                            xtype: 'slate-tasks-student-tasktree',
                            margin: '0 32 0 0',
                            store: 'Tasks'
                        }, {
                            xtype: 'slate-tasks-student-todolist',
                            store: 'Todos'
                        }
                    ]
                }
            ]
        }
    ],


    // config handlers
    updateStudent: function(student, oldStudent) {
        this.fireEvent('studentchange', this, student, oldStudent);
    },

    updateSection: function(section, oldSection) {
        this.fireEvent('sectionchange', this, section, oldSection);
    }
});