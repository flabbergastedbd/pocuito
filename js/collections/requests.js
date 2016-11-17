var Pocuito = Pocuito || {};

(function () {
	'use strict';

  var STATE_INIT = 1;
  var STATE_RECORDING = 2;

  Pocuito.Requests = Backbone.Collection.extend({
    model: Pocuito.Request,
    localStorage: new Backbone.LocalStorage("Requests"),

    initialize: function() {
      this.a = null;
    },

    clear: function() {
      var m;
      _.each(_.map(this.models, function(m) { return m.id; }), function(i) {
        m = this.get(i)
        if (m) m.destroy();
      }, this);
    },

    getItem: function(k) {
      return localStorage.getItem(k);
    },

    setItem: function(k, v) {
      localStorage.setItem(k, v);
    },

    setState: function(i) {
      this.setItem('ProxyState', i);
      this.trigger('change');
    },

    getState: function() {
      var s = this.getItem('ProxyState');
      if (s === null) {
        s = 1;
        this.setState(s);
      } else {
        s = parseInt(s);
      }
      return s;
    },

    getStateObj: function() {
      var s = this.getState();
      return {
        is_init: s === STATE_INIT,
        is_recording: s === STATE_RECORDING,
      };
    },

    refresh: function(callback) {
      this.fetch({"success": callback, "reset": true});
    },

    insert: function(data) {
      data['id'] = this.length + 1;
      this.create(data);
    }
  });

})();
