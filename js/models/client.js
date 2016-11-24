var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.Client = Backbone.Model.extend({
    idAttribute: "ip",

    initialize: function(props) {
      this.url = addUrlPath(props.url, 'client');
      this.on('change', function(attrs) { console.log(attrs); this.save(attrs.changed); });
      this.fetch();  // New client created only on POST
    },

    addBodyTampers: function(replacements) {
      if (this.body_tampers === null) this.body_tampers = {};
      _.extend(replacements, this.body_tampers)
      this.set({'body_tampers': replacements});
    }
  });

})();
