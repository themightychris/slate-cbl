/**
 * The Dashboard controller manages the main functionality of the SlateTasksTeacher application where teachers can
 * browse, search, create, edit, and assign tasks.
 *
 * ## Responsibilities
 * - Handle section/:sectionId route
 * - Handle CRUD operations for tasks/student tasks
 * - Filter StudentsGrid tasks/students by selected section
 *
 * ## TODO
 * - [X] sort refs by parent
 * - [X] ensure no extra autoCreate refs
 * - [X] match dependencies to controller refs
 * - [X] change route format to ':sectionCode'
 * - [X] mediate state through dashboard view config
 * - [X] drive `setSection`/`sectionchange` and `setCohort`/`cohortchange` state via dashboard view config
 * - [X] drive store and view config from change events in controller
 * - [ ] ensure Navigation <-> State flow
 * - [ ] ensure requires include all and only the views being create within the same file
 * - [ ] Update controller descriptions/responsibilities
 *
 * ## Roadmap
 * - Break out sibling controllers for post-navigation workflows like drive integration, task editing
 */
Ext.define('SlateTasksTeacher.controller.Dashboard', {
    extend: 'Ext.app.Controller',


    // dependencies
    views: [
        'Dashboard'
    ],

    stores: [
        'Sections@Slate.store.courses',
        'SectionCohorts@Slate.store.courses',
        'SectionParticipants'
    ],


    // component factories and selectors
    refs: {
        dashboardCt: {
            selector: 'slate-tasks-teacher-dashboard',
            autoCreate: true,

            xtype: 'slate-tasks-teacher-dashboard'
        },
        sectionSelector: 'slate-tasks-teacher-appheader slate-section-selector',
        cohortSelector: 'slate-tasks-teacher-appheader slate-cohort-selector'
    },


    // entry points
    routes: {
        ':sectionCode/:cohortName': {
            action: 'showDashboard',
            conditions: {
                ':sectionCode': '([^/]+)',
                ':cohortName': '([^/]+)'
            }
        }
    },

    listen: {
        store: {
            '#Sections': {
                load: 'onSectionsLoad'
            },
            '#SectionCohorts': {
                load: 'onSectionCohortsLoad'
            }
        }
    },

    control: {
        dashboardCt: {
            selectedsectionchange: 'onSelectedSectionChange',
            selectedcohortchange: 'onSelectedCohortChange'
        },
        sectionSelector: {
            select: 'onSectionSelectorSelect'
        },
        cohortSelector: {
            select: 'onCohortSelectorSelect',
            clear: 'onCohortSelectorClear'
        }
    },


    // controller templates method overrides
    onLaunch: function () {
        var sectionsStore = this.getSectionsStore();

        // configure and load sections store for selector
        sectionsStore.getProxy().setExtraParam('enrolled_user', 'current');
        sectionsStore.load();

        // render dashboard container to #slateapp-viewport element provided by framing HTML
        this.getDashboardCt().render('slateapp-viewport');
    },


    // route handlers
    showDashboard: function(sectionCode, cohortName) {
        var dashboardCt = this.getDashboardCt();

        // use false instead of null, to indicate selecting *nothing* vs having no selection
        dashboardCt.setSelectedSection(sectionCode || false);
        dashboardCt.setSelectedCohort(cohortName && cohortName != 'all' ? this.decodeRouteComponent(cohortName) : false);
    },


    // event handlers
    onSectionsLoad: function(sectionsStore) {
        var dashboardCt = this.getDashboardCt(),
            sectionCode = dashboardCt.getSelectedSection(),
            loadedSection = dashboardCt.getLoadedSection();

        if (!loadedSection || loadedSection.get('Code') != sectionCode) {
            dashboardCt.setLoadedSection(sectionsStore.getByCode(sectionCode));
        }
    },

    onSectionCohortsLoad: function(store, records, success) {
        if (success) {
            this.getCohortSelector().enable();
        }
    },

    onSelectedSectionChange: function(dashboardCt, sectionCode) {
        var me = this,
            sectionSelector = me.getSectionSelector(),
            sectionsStore = me.getSectionsStore(),
            cohortsStore = me.getSectionCohortsStore(),
            sectionParticipants = me.getSectionParticipantsStore(),
            section;

        // push value to selector
        sectionSelector.setValue(sectionCode);

        // update loaded section record
        section = sectionsStore.getByCode(sectionCode);

        if (section) {
            dashboardCt.setLoadedSection(section);
        } else {
            sectionsStore.getModel().load(null, {
                url: '/sections/'+encodeURIComponent(sectionCode),
                success: function(loadedSection) {
                    dashboardCt.setLoadedSection(loadedSection);
                }
            });
        }

        // (re)load the cohorts list
        cohortsStore.setSection(sectionCode);
        cohortsStore.loadIfDirty();

        // (re)load participants list
        sectionParticipants.setSection(sectionCode);
        sectionParticipants.loadIfDirty(true);
    },

    onSelectedCohortChange: function(dashboardCt, cohortName) {
        var sectionParticipants = this.getSectionParticipantsStore();

        // push value to selector
        this.getCohortSelector().setValue(cohortName);

        // filter participants list
        if (cohortName) {
            sectionParticipants.filter('Cohort', cohortName);
        } else {
            sectionParticipants.clearFilter();
        }
    },

    onSectionSelectorSelect: function(sectionSelector, section) {
        this.redirectTo([section.get('Code'), 'all']);
    },

    onCohortSelectorSelect: function(cohortSelector, cohort) {
        this.redirectTo([this.getDashboardCt().getSelectedSection(), cohort.get('Cohort') || 'all']);
    },

    onCohortSelectorClear: function() {
        this.redirectTo([this.getDashboardCt().getSelectedSection(), 'all']);
    }
});