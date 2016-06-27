/**
 * TODO:
 * - move rendering responsibilities to the view?
 */
Ext.define('SlateTasksTeacher.controller.Dashboard', {
    extend: 'Ext.app.Controller',


    // entry points
    control: {
        taskGrid: {
            competencyrowclick: 'onCompetencyRowClick'
        }
    },


    // controller configuration
    views: [
        'Dashboard'
    ],

    refs: {
        dashboardCt: {
            selector: 'slate-tasks-teacher-dashboard',
            autoCreate: true,

            xtype: 'slate-tasks-teacher-dashboard'
        },
        taskGrid: 'slate-tasks-teacher-dashboard slate-tasks-teacher-studentstaskgrid'
    },


    // controller templates method overrides
    onLaunch: function () {
        this.getDashboardCt().render('slateapp-viewport');
    },


    // event handlers
    onCompetencyRowClick: function(me, competency, ev, targetEl) {
        me.toggleCompetency(competency);
    }
});