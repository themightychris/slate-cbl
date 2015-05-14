/*jslint browser: true, undef: true *//*global Ext*/
Ext.define('Slate.cbl.model.Skill', {
    extend: 'Ext.data.Model',
    requires: [
        'Slate.cbl.API',
        'Slate.cbl.proxy.Records',
        'Ext.data.identifier.Negative',
        'Ext.data.Store'
    ],


    // model config
    idProperty: 'ID',
    identifier: 'negative',

    fields: [
        {
            name: "ID",
            type: "int",
            useNull: true
        },
        {
            name: "Class",
            type: "string",
            defaultValue: "Slate\\CBL\\Skill"
        },
        {
            name: "Created",
            type: "date",
            dateFormat: "timestamp",
            useNull: true
        },
        {
            name: "CreatorID",
            type: "int",
            useNull: true
        },
        {
            name: "RevisionID",
            type: "int",
            useNull: true
        },
        {
            name: "CompetencyID",
            type: "int"
        },
        {
            name: "Code",
            type: "string"
        },
        {
            name: "Descriptor",
            type: "string"
        },
        {
            name: "Statement",
            type: "string"
        },
        {
            name: "DemonstrationsRequired",
            type: "int",
            defaultValue: 2
        }
    ],

    proxy: {
        type: 'slate-cbl-records',
        url: '/cbl/skills'
    }
});