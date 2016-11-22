var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.Event = Backbone.Model.extend({
    defaults: {
      'id': null,
      'description': 'Put some useful comments',
      // Related to input events like change, click etc..
      'type': null,
      'xpath': null,
      'url': null,
      'value': null,
      'cursor': false,
      'step': null,
      'text': null,
      'tag': null,

      // Tamper events
      'tamper_req_header': null,  // {'urls': [], 'types': [], 'replacements': {}}  (Will be run on active tab only, and only on header values & request body)
      'tamper_req_body': null,  // {'urls': [], 'types': [], 'replacements': {}}  (Will be run on active tab only)

      // Assert events
      'assert_res_header': null, // {'url': '', 'method': [], 'assertions': {}}  (Will be run on active tab only)
      'assert_res_status': null, // {'url': '', 'method': [], 'assertions': {}}  (Will be run on active tab only)
      'assert_res_body': null, // {'url': '', 'method': [], 'assertions': {}}  (Will be run on active tab only)

      // Proxy Events
      'start_proxy': null, // {'urls': [], 'types': []}  (Will be run on recorded only)
      'stop_proxy': null // {'urls': [], 'types': []}  (Will be run on recorded only)
    },

    initialize: function() {
      this.on('change', function() { this.save(); });
    },

    getAssertionTypes: function() {
      return ['Contains', 'Not contains'];
    },

    toString: function() {
      var str = '';
      if (this.get('xpath')) {
        var s = this.get('value') || this.get('text') || this.get('xpath');
        str += this.get('type') + ' --> ' + s;
      } else if (this.get('tamper_req_header')) {
        str += 'Tamper request header values on ' + this.get('tamper_req_header')['urls'].join(',') + ' ' + JSON.stringify(this.get('tamper_req_header')['replacements']);
      } else if (this.get('tamper_req_body')) {
        str += 'Tamper request body values on ' + this.get('tamper_req_body')['urls'].join(',') + ' ' + JSON.stringify(this.get('tamper_req_body')['replacements']);
      } else if (this.get('assert_res_status')) {
        str += 'Assert response status values on ' + this.get('assert_res_status')['url'] + ' ' + JSON.stringify(this.get('assert_res_status')['assertions']);
      } else if (this.get('assert_res_header')) {
        str += 'Assert response header values on ' + this.get('assert_res_header')['url'] + ' ' + JSON.stringify(this.get('assert_res_header')['assertions']);
      } else if (this.get('assert_res_body')) {
        str += 'Assert response body values on ' + this.get('assert_res_body')['url'] + ' ' + JSON.stringify(this.get('assert_res_body')['assertions']);
      } else if (this.get('start_proxy')) {
        str += 'Start Proxy on ' + this.get('start_proxy')['urls'].join(',');
      } else if (this.get('stop_proxy')) {
        str += 'Stop Proxy';
      }
      return str;
    },

    play: function(callback) {
      if (this.get('xpath')) {
        this.userInputPlay(callback);
      } else if (this.get('start_proxy')) {
        this.startProxy(callback);
      } else if (this.get('stop_proxy')) {
        this.stopProxy(callback);
      } else if (this.get('assert_res_body')) {
        this.assertRes('b', callback);
      } else if (this.get('assert_res_header')) {
        this.assertRes('h', callback);
      } else if (this.get('assert_res_status')) {
        this.assertRes('s', callback);
      }
    },

    userInputPlay: function(callback) {
      var $this = this;
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, $this.toJSON(), callback);
      });
    },

    startProxy: function(callback) {
      var $this = this;
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var tabId = tabs[0].id;
        var bgPage = chrome.extension.getBackgroundPage();
        if (bgPage && bgPage.proxy) {
          var data = $this.get('start_proxy')
          data['tabId'] = tabId;
          bgPage.proxy.startRecording(data);
          callback({
            'success': true,
            'message': 'Proxy service started'
          });
        }
      });
    },

    stopProxy: function(callback) {
      var bgPage = chrome.extension.getBackgroundPage();
      if (bgPage && bgPage.proxy) {
        bgPage.proxy.stopRecording();
        callback({
          'success': true,
          'message': 'Proxy service stopped'
        });
      }
    },

    getAjaxResponse: function(data, callback) {
      var requestCollection = new Pocuito.Requests();
      requestCollection.refresh(function() {
        var ajaxRequestData = requestCollection.getAjaxRequest(data['url'], data['method']);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, ajaxRequestData, callback);
        });
      });
    },

    assert: function(type, regex, string) {
      var r = new RegExp(regex);
      var m = r.test(string);
      if (type === 'Not contains') {
        m = !m;
      }
      return(m);
    },

    assertRes: function(s_h_r, callback) {
      var $this = this;
      var data = this.get('assert_res_body') || this.get('assert_res_status') || this.get('assert_res_header');
      this.getAjaxResponse(data, function(respData) {
        var success = false;
        var item;
        if (s_h_r == 's') {
          item = respData['status'];
        } else if (s_h_r == 'h') {
          item = respData['headers'];
        } else {
          item = respData['response'];
        }
        _.each(data['assertions'], function(r, type) {
          success = success || $this.assert(type, r, item);
        }, $this);
        callback({
          "success": success,
          "message": "Assert is " + success.toString()
        })
      });
    }

  });

})();
