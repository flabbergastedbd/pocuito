var Pocuito = Pocuito || {};

(function() {
  'use strict';

  Pocuito.Logger = function() {
    this.logChannel = new Backbone.Radio.channel('log');
  }

  Pocuito.Logger.prototype = {
    'info': function(msg) {
      this.logChannel.request('info', msg);
    },

    'debug': function(msg) {
      this.logChannel.request('debug', msg);
    },

    'warning': function(msg) {
      this.logChannel.request('warning', msg);
    },

    'error': function(msg) {
      this.logChannel.request('error', msg);
    }
  };
})();

