/**
 * Main controller for SlateTasksStudent app
 *
 * ## Responsibilities:
 * - Configure and render main view
 * - Manage selection of student
 * - Manage selection of section
 */
Ext.define('SlateTasksStudent.controller.Dashboard', {
    extend: 'Ext.app.Controller',
    requires: [
        /* global Slate */
        'Slate.API',
        'Slate.cbl.util.Google'
    ],


    // dependencies
    views: [
        'Dashboard'
    ],

    stores: [
        'Sections@Slate.store.courses'
    ],


    // component factories and selectors
    refs: {
        dashboardCt: {
            selector: 'slate-tasks-student-dashboard',
            autoCreate: true,

            xtype: 'slate-tasks-student-dashboard'
        },
        studentSelector: 'slate-tasks-student-appheader slate-cbl-studentselector',
        sectionSelector: 'slate-tasks-student-appheader slate-cbl-sectionselector',
        taskTree: 'slate-tasks-student-tasktree',
        todoList: 'slate-tasks-student-todolist'
    },


    // entry points
    routes: {
        ':studentUsername/:sectionCode': {
            action: 'showDashboard',
            conditions: {
                ':studentUsername': '([^/]+)',
                ':sectionCode': '([^/]+)'
            }
        }
    },

    listen: {
        global: {
            resize: 'onBrowserResize'
        },
        controller: {
            '#': {
                unmatchedroute: 'onUnmatchedRoute'
            }
        },
        store: {
            '#Sections': {
                load: 'onSectionsLoad'
            }
        }
    },

    control: {
        dashboardCt: {
            studentchange: 'onStudentChange',
            sectionchange: 'onSectionChange'
        },
        studentSelector: {
            select: 'onStudentSelectorSelect',
            clear: 'onStudentSelectorClear'
        },
        sectionSelector: {
            change: 'onSectionSelectorChange'
        }
    },


    // controller templates method overrides
    onLaunch: function () {
        var me = this;

        // instantiate and render viewport
        me.getDashboardCt().render('slateapp-viewport');

        // load bootstrap data
        Slate.API.request({
            url: '/cbl/dashboards/tasks/student/bootstrap',
            success: function(response) {
                var userData = response.data.user,
                    googleApiConfig = response.data.googleApiConfig || {};

                // show and load student selector for priveleged users
                if (!userData || userData.AccountLevel != 'User') {
                    me.getStudentSelector().show();
                }

                // configure Google API
                if (googleApiConfig) {
                    Slate.cbl.util.Google.setConfig(googleApiConfig);
                }
            }
        });
    },


    // route handlers
    showDashboard: function(studentUsername, sectionCode) {
        var dashboardCt = this.getDashboardCt();

        // use false instead of null, to indicate selecting *nothing* vs having no selection
        dashboardCt.setStudent(studentUsername == 'me' ? false : studentUsername);
        dashboardCt.setSection(sectionCode == 'all' ? false : sectionCode);
    },


    // event handlers
    onBrowserResize: function() {
        this.getDashboardCt().updateLayout();
    },

    onUnmatchedRoute: function() {
        this.redirectTo('me/all');
    },

    onSectionsLoad: function() {
        this.getSectionSelector().enable();
    },

    onStudentChange: function(dashboardCt, studentUsername) {
        var me = this,
            studentCombo = me.getStudentSelector(),
            sectionsStore = me.getSectionsStore();

        // (re)load sections list
        sectionsStore.getProxy().setExtraParam('enrolled_user', studentUsername || 'current');
        sectionsStore.load();

        // push value to selector
        studentCombo.setValue(studentUsername);

        // reload students store with just selected student if they're not in the current result set
        if (studentUsername && !studentCombo.getSelectedRecord()) {
            studentCombo.getStore().load({
                params: {
                    q: 'username:'+studentUsername
                }
            });
        }
    },

    onSectionChange: function(dashboardCt, sectionCode) {
        var me = this;

        me.getSectionSelector().setValue(sectionCode);
    },

    onStudentSelectorSelect: function(studentCombo, student) {
        this.redirectTo([student.get('Username'), 'all']);
    },

    onStudentSelectorClear: function() {
        this.redirectTo(['me', 'all']);
    },

    onSectionSelectorChange: function(sectionCombo, sectionCode) {
        this.redirectTo([this.getDashboardCt().getStudent() || 'me', sectionCode || 'all']);
    }
});