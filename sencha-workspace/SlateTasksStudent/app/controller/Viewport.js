Ext.define('SlateTasksStudent.controller.Viewport', {
    extend: 'Ext.app.Controller',
    requires: [
        'Slate.API'
    ],

    // entry points
    control: {
        'slate-tasktree': {
            resize: 'onTaskTreeResize'
        }
    },


    config: {
    },


    // controller configuration
    views: [
        'TaskTree',
        'TodoList',
        'RecentActivity',
        'Slate.cbl.view.student.OverallProgress',
        'Slate.cbl.view.student.TaskHistory'
    ],

    refs: {
        taskTree: {
            selector: 'slate-tasktree',
            autoCreate: true,

            xtype: 'slate-tasktree'
        },
        todoList: {
            selector: 'slate-todolist',
            autoCreate: true,

            xtype: 'slate-todolist'
        },
        recentActivity: {
            selector: 'slate-recentactivity',
            autoCreate: true,

            xtype: 'slate-recentactivity'
        },
        taskHistory: {
            selector: 'slate-taskhistory',
            autoCreate: true,

            xtype: 'slate-taskhistory'
        },
        overallProgress: {
            selector: 'slate-overallprogress',
            autoCreate: true,

            xtype: 'slate-cbl-student-overallprogress'
        }
    },


    // controller templates method overrides
    onLaunch: function () {
        this.getTaskTree().render('slate-tasktree');
        this.getTodoList().render('slate-todolist');
        this.getRecentActivity().render('slate-recentactivity');
        this.getTaskHistory().render('slate-taskhistory');
        this.getOverallProgress().render('slate-overallprogress');

    },

    onTaskTreeResize: function () {
        this.maskDemoElements();
    },

    maskDemoElements: function () {
        this.getTodoList().setLoading(false);
        this.getRecentActivity().setLoading(false);
        this.getTaskHistory().setLoading(false);
        this.getOverallProgress().setLoading(false);

        this.getTodoList().setLoading('');
        this.getRecentActivity().setLoading('');
        this.getTaskHistory().setLoading('');
        this.getOverallProgress().setLoading('');
    }
});
