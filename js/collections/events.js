var Pocuito = Pocuito || {};

(function () {
	'use strict';
  var STATE_INIT = 1;
  var STATE_RECORDING = 2;
  var STATE_PAUSED = 3;
  var STATE_REPLAYING = 4;

  Pocuito.Events = Backbone.Collection.extend({
    model: Pocuito.Event,
    localStorage: new Backbone.LocalStorage("Events"),

    initialize: function() {
      this.a = null;
    },

    clear: function() {
      var m;
      _.each(_.map(this.models, function(m) { return m.id; }), function(i) {
        m = this.get(i)
        if (m) m.destroy();
      }, this);
      this.setState(STATE_INIT);
    },

    getItem: function(k) {
      return localStorage.getItem(k);
    },

    setItem: function(k, v) {
      localStorage.setItem(k, v);
    },

    setState: function(i) {
      this.setItem('PocuitoState', i);
      this.trigger('change');
    },

    getState: function() {
      var s = this.getItem('PocuitoState');
      if (s === null) {
        s = 1;
        this.setState(s);
      } else {
        s = parseInt(s);
      }
      return s;
    },

    updateCursor: function(model) {
      this.each(function(m) {
        if (m.get('id') === model.get('id')) {
          m.set('cursor', true);
        } else if (m.get('cursor') === true) {
          m.set('cursor', false);
        }
      }, this);
      // this.refresh();
    },

    refresh: function(callback) {
      this.fetch({"success": callback, "reset": true});
    },

    insertAfterCursor: function(data) {
      var cursorModel = this.find(function(m) { return m.get("cursor") === true; });
      var step;
      if (cursorModel === undefined) {
        step = 1;
      } else {
        cursorModel.set('cursor', false);
        step = cursorModel.get("step") + 1;
      }

      // Before creating new event, create a gap with that step number
      // i.e increment all steps from the insertion point by 1
      this.each(function(m) {
        if (m.get('step') >= step) {
          m.set({step: m.get('step') + 1});
        }
      }, this);

      data['id'] = this.length + 1;
      data['cursor'] = true;
      data['step'] = step;
      this.create(data);
      this.sort();
    },

    getStateObj: function() {
      var s = this.getState();
      return {
        is_init: s === STATE_INIT,
        is_recording: s === STATE_RECORDING,
        is_paused: s === STATE_PAUSED,
        is_replaying: s === STATE_REPLAYING,
        events: this.toJSON()
      };
    },

    comparator: function(m) {
      return m.get('step');
    },

    playStep: function() {
      var cursorModel = this.find(function(m) { return m.get("cursor") === true; });
      var nextModel;
      if (cursorModel) {
        nextModel = this.at(this.indexOf(cursorModel)+1);
        var $this = this;
        cursorModel.play(function(resp) {
          if (nextModel && resp && resp['success']) {
            $this.updateCursor(nextModel);
          } else {
            alert(JSON.stringify(resp));
          }
        });
      }
    }
  });

})();
