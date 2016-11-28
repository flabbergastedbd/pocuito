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

    extendAttribute: function(attrName, extraAttrs) {
      if (this.get(attrName) != null) {
        _.extend(extraAttrs, this.get(attrName));
      }
      this.set(attrName, extraAttrs);
    }
  });

})();
