var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.ResourceFilterFormView = Marionette.View.extend({
    template: '#template-request-filter-form',

    getData: function() {
      return {
        'url_regexp': $('#urlRegexp').val()
      };
    }
  });

  // All other individual event forms will extend from this
  // and implement getCustomData function
  Pocuito.CustomFormView = Marionette.View.extend({
    regions: {
      'resourceFilter': '#resourceFilter'
    },

    onRender: function() {
      this.showChildView('resourceFilter', new Pocuito.ResourceFilterFormView());
    },

    getResourceFilterData: function() {
      var view = this.getChildView('resourceFilter');
      if (view) {
        return view.getData();
      } else {
        return {};
      }
    },

    getData: function() {
      var filterData = this.getResourceFilterData();
      var customData = this.getCustomData();
      _.each(customData, function(v, k, i) {
        filterData[k] = v;
      }, this);
      return filterData;
    }
  });

  Pocuito.TamperFormView = Marionette.View.extend({
    template: '#template-tamper-form',

    getData: function() {
      var replacements = {};
      var k, v;
      _.each(_.range(2), function(i, index) {
        k = $('#key'+String(i)).val();
        v = $('#value'+String(i)).val();
        if (k && v) replacements[k] = v;
      });
      return {'replacements': replacements};
    }
  });

  Pocuito.HeaderFormView = Pocuito.TamperFormView.extend({
    template: '#template-header-form'
  });

  Pocuito.AssertFormView = Marionette.View.extend({
    template: '#template-assert-form',

    templateContext: function() {
      return {
        types: this.collection.model.prototype.getAssertionTypes()
      };
    },

    getData: function() {
      var data = {'assertions': {}};
      var k, v;
      _.each(_.range(2), function(i, index) {
        k = $('select#type'+String(i)).val();
        v = $('#text'+String(i)).val();
        if (k && v) data['assertions'][k] = v;
      });
      data['url'] = $('#url').val();
      data['method'] = $('select#method').val();
      return data;
    }
  });

  Pocuito.ProxyFormView = Pocuito.CustomFormView.extend({
    template: '#template-proxy-form',

    getCustomData: function() {
      return {};
    }
  });

  Pocuito.EventFormPickerView = Marionette.View.extend({
    template: '#template-event-form',

    initialize: function() {
      this.forms = {
        'Stop Proxy': [Pocuito.ProxyFormView, 'stop_proxy'],
        'Start Proxy': [Pocuito.ProxyFormView, 'start_proxy'],
        'Tamper Request Body': [Pocuito.TamperFormView, 'tamper_req_body'],
        'Add Response Header': [Pocuito.HeaderFormView, 'add_res_header'],
        'Assert Response Header': [Pocuito.AssertFormView, 'assert_res_header'],
        'Assert Response Body': [Pocuito.AssertFormView, 'assert_res_body'],
        'Assert Response Status': [Pocuito.AssertFormView, 'assert_res_status'],
      };
      this.type = null;
    },

    regions: {
      "relevantEventForm": "#relevantEventForm"
    },

    events: {
      'click #eventTypeFormSel': 'showRelevantEventForm',
      'click #addEventBtn': 'addEvent'
    },

    templateContext: function() {
      return {
        'eventTypes': _.keys(this.forms)
      };
    },

    showRelevantEventForm: function(e) {
      this.type = $(e.target).find('option:selected').val();
      if (this.forms[this.type] && this.forms[this.type][0]) {
        this.showChildView('relevantEventForm', new this.forms[this.type][0]({collection: this.collection}));
      }
    },

    addEvent: function() {
      var formView = this.getChildView('relevantEventForm');
      if (formView) {
        var eData = formView.getData();
        var mData = {};
        mData[this.forms[this.type][1]] = eData;
        this.collection.insertAfterCursor(mData);
        logger.info('Event added');
        // The newly added event will have cursor, so play it
        this.collection.playStep();
      }
    }
  });

})();
