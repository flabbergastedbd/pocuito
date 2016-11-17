var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.Event = Backbone.Model.extend({
    defaults: {
      'id': null,
      // Related to input events like change, click etc..
      'type': null,
      'xpath': null,
      'url': null,
      'value': null,
      'cursor': false,
      'step': null,

      // Tamper events
      'tamper_req_header': null,  // {'urls': [], 'types': [], 'replacements': {}}  (Will be run on active tab only, and only on header values & request body)
      'tamper_req_body': null,  // {'urls': [], 'types': [], 'replacements': {}}  (Will be run on active tab only)

      // Assert events
      'assert_res': null, // {'urls': [], 'types': [], 'assertions': {}}  (Will be run on active tab only)
      // assertions: keys can be one of ['header_name', 'header_value', 'status_line', 'body']
    },

    initialize: function() {
      this.on('change', function() { this.save(); });
    },
  });

})();
