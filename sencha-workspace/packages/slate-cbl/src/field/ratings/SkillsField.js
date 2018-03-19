/**
 * Implements a custom field for looking up skills and inputting ratings
 *
 * Modeled after a combination of FieldContainer and field.Base
 */
Ext.define('Slate.cbl.field.ratings.SkillsField', {
    extend: 'Slate.ui.form.ContainerField',
    xtype: 'slate-cbl-ratings-skillsfield',
    requires: [
        'Ext.button.Button',

        'Slate.cbl.store.Skills',
        'Slate.cbl.store.Competencies',
        'Slate.cbl.store.StudentCompetencies',
        'Slate.cbl.field.ratings.SkillsCompetency',
        'Slate.cbl.field.ratings.Slider',
        'Slate.cbl.field.SkillsSelector',

        'Jarvus.override.data.RequireLoadedStores',

        /* global Slate */
        'Slate.sorter.Code',
        'Slate.ui.override.AddSorted'
    ],


    config: {
        selectedStudent: null,

        skillsSelector: true,
        addSkillsButton: true,
        footer: true,

        skillsStore: {
            type: 'slate-cbl-skills',
            proxy: {
                type: 'slate-cbl-skills',
                summary: true,
                relatedTable: ['Competency']
            }
        },

        competenciesStore: {
            type: 'slate-cbl-competencies'
        },

        studentCompetenciesStore: {
            type: 'slate-cbl-studentcompetencies'
        }
    },


    // containerfield configuration
    name: 'DemonstrationSkills',
    allowBlank: false,
    blankText: 'At least one rating must be selected',


    // container/component configuration
    componentCls: 'slate-cbl-skillratingsfield',
    layout: 'anchor',
    defaults: {
        xtype: 'slate-cbl-ratings-skillscompetency',
        anchor: '100%'
    },


    // config handlers
    updateSelectedStudent: function(selectedStudent, oldSelectedStudent) {
        var studentCompetenciesStore = this.getStudentCompetenciesStore();

        if (oldSelectedStudent) {
            studentCompetenciesStore.unload();
        }

        if (selectedStudent) {
            studentCompetenciesStore.setStudent(selectedStudent);
            studentCompetenciesStore.load({});
        }
    },

    applySkillsSelector: function(skillsSelector, oldSkillsSelector) {
        if (!skillsSelector || typeof skillsSelector == 'boolean') {
            skillsSelector = {
                hidden: !skillsSelector
            };
        }

        if (typeof skillsSelector == 'object' && !skillsSelector.isComponent) {
            skillsSelector = Ext.apply({
                fieldLabel: null,
                flex: 1,
                showPermanentTags: false
            }, skillsSelector);
        }

        return Ext.factory(skillsSelector, 'Slate.cbl.field.SkillsSelector', oldSkillsSelector);
    },

    updateSkillsSelector: function(skillsSelector) {
        skillsSelector.on('change', 'onSkillsSelectorChange', this);
    },

    applyAddSkillsButton: function(addSkillsButton, oldAddSkillsButton) {
        if (!addSkillsButton || typeof addSkillsButton == 'boolean') {
            addSkillsButton = {
                hidden: !addSkillsButton
            };
        }

        if (typeof addSkillsButton == 'object' && !addSkillsButton.isComponent) {
            addSkillsButton = Ext.apply({
                text: 'Add Skills',
                margin: '0 0 0 10'
            }, addSkillsButton);
        }

        return Ext.factory(addSkillsButton, 'Ext.button.Button', oldAddSkillsButton);
    },

    updateAddSkillsButton: function(addSkillsButton) {
        addSkillsButton.on('click', 'onAddSkillsClick', this);
    },

    applyFooter: function(footer, oldFooter) {
        if (!footer || typeof footer == 'boolean') {
            footer = {
                hidden: !footer
            };
        }

        if (typeof footer == 'object' && !footer.isComponent) {
            footer = Ext.apply({
                layout: {
                    type: 'hbox',
                    align: 'center'
                },
                items: [
                    this.getSkillsSelector(),
                    this.getAddSkillsButton()
                ]
            }, footer);
        }

        return Ext.factory(footer, 'Ext.container.Container', oldFooter);
    },

    applySkillsStore: function(store) {
        return Ext.StoreMgr.lookup(store);
    },

    updateSkillsStore: function(store, oldStore) {
        if (oldStore) {
            oldStore.un('load', 'onSkillsStoreLoad', this);
        }

        if (store) {
            store.on('load', 'onSkillsStoreLoad', this);
        }
    },

    applyCompetenciesStore: function(store) {
        return Ext.StoreMgr.lookup(store);
    },

    applyStudentCompetenciesStore: function(store) {
        return Ext.StoreMgr.lookup(store);
    },


    // container lifecycle
    initItems: function() {
        var me = this,
            footer = me.getFooter();

        me.callParent();

        // configure sorter for contained items
        me.items.setSorters([
            {
                sorterFn: function(a, b) {
                    if (a === footer) {
                        return 1;
                    }

                    if (b === footer) {
                        return -1;
                    }

                    return 0;
                }
            },
            new Slate.sorter.Code({
                codeFn: function(item) {
                    return item.selectedCompetency;
                }
            })
        ]);

        // add footer to end of items
        me.add(footer);

        // initialize map of competency containers and skill rating fields
        me.competencyContainers = {};
        me.skillRatingFields = {};
    },


    // event handlers
    onSkillsStoreLoad: function(skillsStore) {
        var competenciesCollection = skillsStore.getProxy().relatedCollections.Competency,
            competenciesStore = this.getCompetenciesStore();

        if (!competenciesStore.isLoaded() && competenciesCollection) {
            competenciesStore.loadRawData(competenciesCollection.getRange());
        }
    },

    onSkillsSelectorChange: function(skillsSelector, value) {
        this.getAddSkillsButton().setDisabled(Ext.Array.difference(value, skillsSelector.getPermanentValues()).length == 0);
    },

    onAddSkillsClick: function() {
        var me = this,
            skillsSelector = me.getSkillsSelector();

        me.addSkills(skillsSelector.getValue(), true);

        skillsSelector.clearValue();
        me.getAddSkillsButton().disable();
    },


    // public API
    clearSkills: function() {
        var me = this,
            competencyContainers = me.competencyContainers,
            competencyId;

        Ext.suspendLayouts();

        for (competencyId in competencyContainers) {
            if (!competencyContainers.hasOwnProperty(competencyId)) {
                continue;
            }

            me.remove(competencyContainers[competencyId], true);
            delete competencyContainers[competencyId];
        }

        Ext.resumeLayouts(true);

        me.skillRatingFields = {};
    },

    addSkills(skills, removable) {
        var me = this,
            competencyContainers = me.competencyContainers,
            skillRatingFields = me.skillRatingFields,
            competenciesStore = me.getCompetenciesStore(),
            skillsStore = me.getSkillsStore(),
            skillsSelector = me.getSkillsSelector();

        removable = removable !== false;

        Ext.StoreMgr.requireLoaded([competenciesStore, skillsStore], function() {
            var skillsLength = skills.length,
                skillIndex = 0, skillCode, skill, competency, competencyId, competencyContainer;

            Ext.suspendLayouts();

            // group skills by competency
            for (; skillIndex < skillsLength; skillIndex++) {
                skillCode = skills[skillIndex];

                if (skillCode in skillRatingFields) {
                    continue;
                }

                skill = skillsStore.getByCode(skillCode);
                competencyId = skill.get('CompetencyID');
                competency = competenciesStore.getById(competencyId);

                if (competencyId in competencyContainers) {
                    competencyContainer = competencyContainers[competencyId];
                } else {
                    competencyContainer = competencyContainers[competencyId] = me.addSorted({
                        loadedCompetency: competency
                    });
                }

                skillRatingFields[skillCode] = competencyContainer.addSorted({
                    skill: skill,
                    removable: removable,
                    listeners: {
                        removeclick: function(ratingField) {
                            me.removeSkills([ratingField.getSkill().get('Code')]);
                        }
                    }
                });
            }

            // add skills to permanent values
            skillsSelector.setPermanentValues(Ext.Array.union(skillsSelector.getPermanentValues() || [], skills));

            Ext.resumeLayouts(true);
        });
    },

    removeSkills: function(skills) {
        var me = this,
            skillsSelector = me.getSkillsSelector(),
            skillRatingFields = me.skillRatingFields,
            competencyContainers = me.competencyContainers,
            skillsLength = skills.length,
            skillIndex = 0, skillCode, skillRatingField, competencyId, competencyContainer;

        Ext.suspendLayouts();

        // remove rating fields
        for (; skillIndex < skillsLength; skillIndex++) {
            skillCode = skills[skillIndex];
            skillRatingField = skillRatingFields[skillCode];

            if (!skillRatingField) {
                continue;
            }

            competencyContainer = skillRatingField.ownerCt;
            competencyId = Ext.Object.getKey(competencyContainers, competencyContainer);

            competencyContainer.remove(skillRatingField, true);
            delete skillRatingFields[skillCode];

            if (competencyContainer.items.getCount() == 0) {
                me.remove(competencyContainer, true);
                delete competencyContainer[competencyId];
            }
        }

        // remove from permanent values
        skillsSelector.setPermanentValues(Ext.Array.difference(skillsSelector.getPermanentValues() || [], skills));

        Ext.resumeLayouts(true);
    }
});