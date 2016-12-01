var Pocuito = Pocuito || {};

(function () {
	'use strict';

  var UNSAFE_HEADERS = ['Cookie', 'Referer', 'Accept-Encoding', 'User-Agent', 'Origin'];

  Pocuito.Request = Backbone.Model.extend({
    // idAttribute: "requestId",
    defaults: {
      'id': null,
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

  Pocuito.Requests = Backbone.Collection.extend({
    model: Pocuito.Request,
    filterData: null,

    initialize: function(props) {
      this.url = addUrlPath(props.proxyUrl, 'requests');
    },

    clear: function() {
      var m;
      _.each(_.map(this.models, function(m) { return m.id; }), function(i) {
        m = this.get(i)
        if (m) m.destroy();
      }, this);
    },

    refresh: function(callback) {
      var data = this.filterData ? $.param(this.filterData) : null;
      this.fetch({
        data: data,
        success: callback,
        reset: true
      });
    },

    setFilterData: function(data) {
      this.filterData = data;
    },

    getRequest: function(url, method, data) {
      var urlRegex = new RegExp(url);
      var request = this.find(function(m) {
        if (urlRegex.test(m.get('url')) && (method == m.get('method'))) {
          return true;
        }
      });
      if (request) {
        return request.getJqueryAjaxFormat();
      } else {
        return null;
      }
    }

  });

})();
