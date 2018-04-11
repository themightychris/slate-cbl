/*jslint browser: true, undef: true *//*global Ext*/
/**
 * TODO: convert to a direct decendent for sliderfield that appends the label element instead of using container+component and burying the form api
 */

 var levelLut = {
   0 : "NE",
   1 : "EN",
   2 : "PR",
   3 : "GB",
   4 : "AD",
   5 : "EX",
   6 : "BA"
 }
Ext.define('Slate.cbl.field.LevelSlider', {
    extend: 'Ext.slider.Single',
    xtype: 'slate-cbl-levelsliderfield',
    uses: [
        'Ext.tip.ToolTip'
    ],

    config: {
        thumbValue: null,
        parkedValue: null
    },

    componentCls: 'cbl-level-slider-field',
    minValue: 0,
    maxValue: 6,
    useTips: false,
    thumbTpl: [
        '<span class="value">',
            '<tpl if="value === null">',
                '<small class="muted">N/A</small>',
            '<tpl elseif="value === 0">',
                'M',
            '<tpl else>',
                '{[levelLut[values.value]]}',
            '</tpl>',
        '</span>'
    ],

    listeners: {
        change: function(levelSlider, value) {
            levelSlider.setThumbValue(value);
        }
    },

    onRender: function() {
        var me = this;

        me.callParent(arguments);

        me.setThumbValue(me.getValue());

        me.thumbs[0].el.on('click', 'onThumbClick', me);
    },

    updateThumbValue: function(value, oldValue) {
        var me = this,
            thumbEl = me.thumbs[0].el,
            isParked = value == me.minValue;

        if (oldValue && isParked) {
            me.setParkedValue(null);
        }

        me.lookupTpl('thumbTpl').overwrite(thumbEl, {
            value: isParked ? me.getParkedValue() : value
        });

        thumbEl.toggleCls('thumb-parked', isParked);
    },

    updateParkedValue: function(value) {
        this.updateThumbValue(this.getThumbValue());
    },

    getLevel: function() {
        var me = this,
            thumbValue = me.getThumbValue();

        return thumbValue == me.minValue ? me.getParkedValue() : thumbValue;
    },

    setLevel: function(level) {
        var me = this,
            minValue = me.minValue;

        if (level > minValue) {
            me.setValue(level);
        } else {
            me.setValue(minValue);
            me.setParkedValue(level);
        }
    },

    onThumbClick: function() {
        var me = this,
            specialGradeTip, thumbEl, menuItems;

        if (me.getValue() != me.minValue) {
            return;
        }

        thumbEl = me.thumbs[0].el;

        if (!(specialGradeTip = me.self.specialGradeTip)) {
            specialGradeTip = me.self.specialGradeTip = Ext.create('Ext.tip.ToolTip', {
                anchor: 'left',
                target: thumbEl,
                autoHide: false,
                cls: 'special-grade-tip',
                items: {
                    xtype: 'menu',
                    floating: false,
                    plain: true,
                    defaults: {
                        checked: false,
                        group: 'level',
                        listeners: {
                            checkchange: function(menuItem, checked) {
                                if (!checked) {
                                    return; // ignore uncheck events
                                }

                                specialGradeTip.targetSlider.setParkedValue(menuItem.value);

                                Ext.defer(specialGradeTip.hide, 100, specialGradeTip);
                            }
                        }
                    },
                    items: [{
                        text: 'M',
                        value: 0
                    },{
                        text: 'N/A',
                        value: null
                    }]
                },
                listeners: {
                    hide: function() {
                        specialGradeTip.setTarget(null); // remove target on hide so that it does not open again on mouse hover
                    }
                }
            });
        } else {
            specialGradeTip.setTarget(thumbEl);
        }

        menuItems = specialGradeTip.down('menu').items;

        (
            menuItems.findBy(function(item) {
                return item.value === me.getParkedValue();
            }) ||
            menuItems.last()
        ).setChecked(true, true);

        specialGradeTip.targetSlider = me;
        specialGradeTip.show();
    }
});