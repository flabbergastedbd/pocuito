var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.Event = Backbone.Model.extend({
    defaults: {
      'id': null,
      'description': 'Put some useful comments',
      // Related to input events like change, click etc..

      'user_input': null, // {'type': null, 'xpath': null, 'url': null, 'value': null, 'cursor': false, 'step': null, 'text': null, 'tag': null}

      // Tamper events
      'tamper_req_body': null,  // {'url_regexp': '', 'replacements': {}}  (Will be run on active tab only)

      // Add events
      'add_res_header': null,  // {'url_regexp': '', 'replacements': {}}  (Will be run on active tab only, and only on header values & request body)

      // Assert events
      'assert_res_header': null, // {'url': '', 'method': '', 'assertions': {}}  (Will be run on active tab only)
      'assert_res_status': null, // {'url': '', 'method': '', 'assertions': {}}  (Will be run on active tab only)
      'assert_res_body': null, // {'url': '', 'method': '', 'assertions': {}}  (Will be run on active tab only)

      // Proxy Events
      'start_proxy': null, // {'url_regexp': ''}  (Will be run on recorded only)
      'stop_proxy': null // {'url_regexp': ''}  (Will be run on recorded only)
    },

    initialize: function() {
      this.on('change', function() { this.save(); });
    },

    getAssertionTypes: function() {
      return ['Contains', 'Not contains'];
    },

    toString: function() {
      var str = '';
      if (this.get('user_input')) {
        var u = this.get('user_input');
        var s = u['value'] || u['text'] || u['xpath'];
        str += u['type'] + ' --> ' + s;
      } else if (this.get('add_res_header')) {
        str += 'Adding response headers ' + JSON.stringify(this.get('add_res_header')['replacements']);
      } else if (this.get('tamper_req_body')) {
        str += 'Tamper request body values on ' + JSON.stringify(this.get('tamper_req_body')['replacements']);
      } else if (this.get('assert_res_status')) {
        str += 'Assert response status values on ' + this.get('assert_res_status')['url'] + ' ' + JSON.stringify(this.get('assert_res_status')['assertions']);
      } else if (this.get('assert_res_header')) {
        str += 'Assert response header values on ' + this.get('assert_res_header')['url'] + ' ' + JSON.stringify(this.get('assert_res_header')['assertions']);
      } else if (this.get('assert_res_body')) {
        str += 'Assert response body values on ' + this.get('assert_res_body')['url'] + ' ' + JSON.stringify(this.get('assert_res_body')['assertions']);
      } else if (this.get('start_proxy')) {
        str += 'Start Proxy on ' + this.get('start_proxy')['url_regexp'];
      } else if (this.get('stop_proxy')) {
        str += 'Stop Proxy';
      }
      return str;
    },

    play: function(callback) {
      if (this.get('user_input')) {
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
      } else if (this.get('tamper_req_body')) {
        this.tamperReqBody(callback);
      } else if (this.get('add_res_header')) {
        this.addResHeader(callback);
      }
    },

    userInputPlay: function(callback) {
      var $this = this;
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, $this.get('user_input'), callback);
      });
    },

    startProxy: function(callback) {
      var $this = this;
      var data = $this.get('start_proxy')
      if (Pocuito.client) {
        Pocuito.client.set({
          'url_regexp': data['url_regexp'],
          'active': true
        });
        chrome.proxy.settings.get({incognito: false}, function(config) {
          chrome.storage.local.set({'proxyBackupConfig': config.value}, function() {
            var proxySettings = getProxyHostPort(Pocuito.proxy.url);
            var config = {
                mode: 'fixed_servers',
                rules: {
                  singleProxy: {
                    host: proxySettings.host,
                    port: parseInt(proxySettings.port)
                  },
                bypassList: [proxySettings.host + ':' + proxySettings.port]
                }
              };
            setChromeProxyConfig(config, function() {
              callback({
                'success': true,
                'message': 'Proxy service configured'
              });
            });
          });
        });
      } else {
        callback({
          'success': false,
          'message': 'Proxy URL not present'
        });
      }
    },

    stopProxy: function(callback) {
      var $this = this;
      var data = $this.get('stop_proxy')
      // Irrespective of Pocuito.client revert proxy settings so that user can sleep peacefully
      chrome.storage.local.get('proxyBackupConfig', function(items) {
        if (items.proxyBackupConfig) {
          setChromeProxyConfig(items.proxyBackupConfig, function() {
            callback({
              'success': true,
              'message': 'Proxy service stopped'
            });
          });
        }
      });
      if (Pocuito.client) {
        Pocuito.client.set({
          'url_regexp': '^$',
          'active': false
        });
      } else {
        callback({
          'success': false,
          'message': 'Proxy URL not present'
        });
      }
    },

    getResponse: function(data, callback) {
      var requestCollection = new Pocuito.Requests({'proxyUrl': Pocuito.proxy.url});
      requestCollection.setFilterData(data);
      requestCollection.refresh(function() {
        if (requestCollection.length > 0) {
          callback(requestCollection.at(0).toJSON());
        } else {
          callback({});
        }
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
      var filterData = { url: data.url, method: data.method } ;
      this.getResponse(filterData, function(request) {
        console.log(request);
        var success = false;
        var item;
        var message = 'Failed';
        if ((s_h_r == 's') && request['response_code']) {
          item = request['response_code'];
        } else if ((s_h_r == 'h') && request['response_headers']) {
          item = '';
          _.each(request['response_headers'], function(v, k) {
            item += k + ': ' + v + '\r\n';
          }, this);
        } else if ((s_h_r == 'b') && request['response_body']) {
          item = request['response_body'];
        }
        if (item) {
          _.each(data['assertions'], function(r, type) {
            success = success || $this.assert(type, r, item);
          }, $this);
          message = "Assert is " + success.toString();
        } else {
          message = "No requests matched for asserting";
        }
        callback({
          "success": success,
          "message": message
        });
      });
    },

    tamperReqBody: function(callback) {
      if (Pocuito.client) {
        var data = this.get('tamper_req_body');
        Pocuito.client.extendAttribute('body_tampers', data.replacements);
        callback({
          "success": true,
          "message": "Added tampering successfully"
        });
      } else {
        callback({
          "success": false,
          "message": "Couldn't add tampers"
        });
      }
    },

    addResHeader: function(callback) {
      if (Pocuito.client) {
        var data = this.get('add_res_header');
        Pocuito.client.extendAttribute('response_headers_add', data.replacements);
        callback({
          "success": true,
          "message": "Added tampering successfully"
        });
      } else {
        callback({
          "success": false,
          "message": "Couldn't add tampers"
        });
      }
    },
  });

})();
