/*jslint browser: true, undef: true *//*global Ext*/
Ext.define('Slate.cbl.model.Demonstration', {
    extend: 'Ext.data.Model',
    requires: [
        'Slate.cbl.proxy.Records',
        'Ext.data.identifier.Negative'
    ],


    // model config
    idProperty: 'ID',
    identifier: 'negative',

    fields: [
        {
            name: "ID",
            type: "int",
            allowNull: true
        },
        {
            name: "Class",
            type: "string",
            defaultValue: "Slate\\CBL\\Demonstration"
        },
        {
            name: "Created",
            type: "date",
            dateFormat: "timestamp",
            allowNull: true
        },
        {
            name: "CreatorID",
            type: "int",
            allowNull: true
        },
        {
            name: "StudentID",
            type: "int"
        },
        {
            name: "Demonstrated",
            type: "date",
            dateFormat: "timestamp",
            allowNull: true
        },
        {
            name: "ExperienceType",
            type: "string"
        },
        {
            name: "Context",
            type: "string"
        },
        {
            name: "PerformanceType",
            type: "string"
        },
        {
            name: "ArtifactURL",
            type: "string",
            allowNull: true
        },
        {
            name: "Comments",
            type: "string",
            allowNull: true
        },

        // server-provided metadata
        {
            name: 'Skills',
            defaultValue: [],
            persist: false
        },
        {
            name: 'competencyCompletions',
            defaultValue: [],
            persist: false
        }
    ],

    proxy: {
        type: 'slate-cbl-records',
        url: '/cbl/demonstrations'
    }
});