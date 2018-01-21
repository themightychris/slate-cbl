Ext.define('Slate.cbl.widget.CompetencySelector', {
    extend: 'Slate.cbl.widget.ClearableSelector',
    xtype: 'slate-cbl-competencyselector',
    requires: [
        'Slate.cbl.store.Skills'
    ],


    config: {
        loadSummaries: true,

        fieldLabel: 'Competency',
        labelWidth: 75,

        displayField: 'Descriptor',
        valueField: 'Code',
        forceSelection: true,
        editable: false,
        matchFieldWidth: false,
        queryMode: 'local',

        tpl: [
            '<tpl for=".">',
                '<div class="x-boundlist-item"><small style="float:right">{Code}</small> {Descriptor}</div>',
            '</tpl>'
        ]
    },


    componentCls: 'slate-cbl-competencyselector',
    store: {
        type: 'slate-cbl-competencies',
        proxy: {
            type: 'slate-cbl-competencies'
        }
    },


    // config handlers
    updateLoadSummaries: function(loadSummaries) {
        var store = this.getStore();

        if (store.isStore) {
            store.getProxy().setSummary(loadSummaries);
        }
    },


    // component lifecycle
    initComponent: function() {
        this.callParent(arguments);

        this.getStore().getProxy().setSummary(this.getLoadSummaries());
    }
});