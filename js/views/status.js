var Pocuito = Pocuito || {};

(function () {
	'use strict';

  var LOG_LEVELS = {
    'error': 40,
    'warning': 30,
    'success': 25,
    'info': 20,
    'debug': 10
  }

  Pocuito.StatusView = Mn.View.extend({
    template: '#template-status',

    initialize: function() {
      this.logs = [];
      this.logChannel = Backbone.Radio.channel('log');

      var $this = this;
      _.each(_.keys(LOG_LEVELS), function(level) {
        $this.logChannel.reply(level, function(msg) {
          $this.logs.splice(0, 0, {'level': level, 'msg': msg});
          $this.render();
        });
      });
    },

    templateContext: function() {
      var logEntry = this.logs.pop();
      var state = {}
      if (logEntry) {
        _.each(_.keys(LOG_LEVELS), function(level) {
          state['is_' + level] = (logEntry['level'] == level);
        }, this);
        state['msg'] = logEntry['msg'];
      }
      return state;
    },

    getAlert: function() {
      return this.$el.find('span.alert').first();
    },

    fadeAlert: function(e) {
      e.fadeTo(2000, 500).slideUp(500, function(){
            e.slideUp(500);
      });
    },

    onBeforeRender: function() {
      var a = this.getAlert();
      if (a.length > 0) this.fadeAlert(a);
    },

    onRender: function() {
      var a = this.getAlert();
      var $this = this;
      if (a.length > 0) setTimeout(function() { $this.fadeAlert(a); }, 7000);
    }
  });

})();
