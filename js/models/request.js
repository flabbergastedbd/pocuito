var Pocuito = Pocuito || {};

(function () {
	'use strict';

  var UNSAFE_HEADERS = ['Cookie', 'Referer', 'Accept-Encoding', 'User-Agent'];

  Pocuito.Request = Backbone.Model.extend({
    // idAttribute: "requestId",
    defaults: {
      'id': null,
    },

    initialize: function() {
      this.on('change', function() { this.save(); });
    },

    getJqueryAjaxFormat: function() {
      var data = {};
      data['url'] = this.get('url');
      data['headers'] = {};
      _.each(this.get('requestHeaders'), function(h, i) {
        if (UNSAFE_HEADERS.indexOf(h['name']) == -1)
          data['headers'][h['name']] = h['value'];
      }, this);
      data['method'] = this.get('method');

      var rBody = this.get('requestBody');
      if (rBody && rBody.formData) data['data'] = rBody.formData
      return(data);
    }
  });

})();
