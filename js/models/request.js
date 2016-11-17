var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.Request = Backbone.Model.extend({
    defaults: {
      'id': null,
    },

    initialize: function() {
      this.on('change', function() { this.save(); });
    },
  });

})();
