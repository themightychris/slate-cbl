Ext.define('Slate.cbl.view.CompetencyRatings', {
    extend: 'Ext.panel.Panel',
    xtype: 'slate-cbl-competencyratings',
    requires: [
        /* global Slate */
        'Slate.cbl.model.Competency'
    ],


    config: {
        selectedCompetency: null,
        loadedCompetency: null
    },


    // component configuration
    padding: '16 75',


    // container configuration
    dockedItems: [
        {
            dock: 'top',

            xtype: 'component',
            itemId: 'competencyInfo',
            tpl: [
                '<h4 class="competency-descriptor">{Descriptor}</h4>',
                '<blockquote class="competency-statement">{Statement}</blockquote>'
            ]
        }
    ],


    // config handlers
    updateSelectedCompetency: function(competencyCode) {
        this.title = competencyCode;
        this.setLoadedCompetency(null);
        this.loadIfNeeded();
    },

    updateLoadedCompetency: function(competency) {
        var me = this,
            skills;

        if (competency) {
            me.setSelectedCompetency(competency.get('Code'));
            me.getDockedComponent('competencyInfo').setData(competency.getData());

            skills = competency.get('Skills') || [];

            me.removeAll();
        }
    },


    // component lifecycle
    afterRender: function() {
        this.callParent(arguments);
        this.loadIfNeeded();
    },


    // local functions
    loadIfNeeded: function() {
        var me = this,
            selectedCompetency = me.getSelectedCompetency(),
            loadedCompetency = me.getLoadedCompetency();

        if (
            !me.rendered
            || !selectedCompetency
            || (loadedCompetency && loadedCompetency.get('Code') == selectedCompetency)
        ) {
            return;
        }

        me.setLoading('Loading '+selectedCompetency+'&hellip;');
        Slate.cbl.model.Competency.loadByCode(selectedCompetency, {
            include: 'Skills',
            success: function(competency) {
                me.setLoadedCompetency(competency);
                me.setLoading(false);
            }
        });
    }
});