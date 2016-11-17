var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.RecorderView = Mn.View.extend({
    template: '#template-recorder',

    initialize: function() {
      this.listenForEvents();
    },

    listenForEvents: function() {
      chrome.runtime.onMessage.addListener(function(message) {
        console.log(message);
      });
    },
  });

})();
