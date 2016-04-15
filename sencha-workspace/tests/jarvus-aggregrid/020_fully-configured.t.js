StartTest(function(t){
    // TODO: create series of tests that check that rowsStore and columnsStore return correct counts and the update event has been fired exactly once with every combination of instantiation, store configuration, and rendering happeing in different orders and groupings

    t.requireOk('Jarvus.aggregrid.Aggregrid', function () {

        var refreshCount = 0,
            AggregridView = Ext.create('Jarvus.aggregrid.Aggregrid', {
                renderTo: Ext.getBody(),
                columnsStore: {
                    fields: ['id', 'fullName'],
                    data: [
                        {id: 1, fullName: 'Ali', rank: 'Pro'},
                        {id: 2, fullName: 'Chris'},
                        {id: 3, fullName: 'Ryon'},
                        {id: 4, fullName: 'Kevin'},
                        {id: 5, fullName: 'Christian'}
                    ]
                },
                columnHeaderTpl: [
                    '{fullName}',
                    '<tpl if="rank">',
                        ' ({rank})',
                    '</tpl>'
                ],

                rowsStore: {
                    fields: ['id', 'taskName'],
                    data: [
                        {id: 1, taskName: 'Task 1'},
                        {id: 2, taskName: 'Task 2'},
                        {
                            id: 3, taskName: 'Task 3',
                            rows: [
                                { taskName: 'Task 3 - Subtask 1'},
                                { taskName: 'Task 3 - Subtask 2'},
                                { taskName: 'Task 3 - Subtask 3'}
                            ]
                        },
                        {id: 4, taskName: 'Task 4'}
                    ]
                },
                rowHeaderField: 'taskName',
                listeners: {
                    refresh: function() {
                        refreshCount++;
                    }
                }
            });

        t.is(AggregridView.columnsStore.getCount(), 5, 'Rendered all 5 students in columnsStore OK');
        t.is(AggregridView.rowsStore.getCount(), 4, 'Rendered all 4 Tasks in rowsStore OK');

        // t.waitForComponentVisible(AggregridView, function() {
        //     // TODO: validate render
        // });

        t.waitForMs(2000, function() {
            t.is(refreshCount, 1, 'refresh event fired only once during setup');
            t.done();
        });
    });
})