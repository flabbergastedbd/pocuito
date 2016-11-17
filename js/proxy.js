var PocuitoProxy = (function() {
  'use strict';


  function PocuitoProxy() {
    // To get state whether to record or not
    this.requestsCollection = new Pocuito.Requests();
  }

  PocuitoProxy.prototype = {
    'initialize': function() {
      this.boundedRecordRequest = this.recordRequest.bind(this);
    },

    'reset': function() {
      this.requestsCollection.clear();
    },

    'recordRequest': function(message) {
      console.log(message);
      this.requestsCollection.insert(message)
    },

    'startRecording': function(tabId) {
      console.log("Starting proxy recording");
      chrome.webRequest.onBeforeRequest.addListener(
        this.boundedRecordRequest,
        {
          urls: ['http://*/*', 'https://*/*'],
          types: ['main_frame', 'sub_frame', 'object', 'xmlhttprequest', 'ping', 'other'],
          tabId: tabId
        },
        ['requestBody']
      );
    },

    'stopRecording': function() {
      console.log("Stopping proxy recording");
      chrome.webRequest.onBeforeRequest.removeListener(this.boundedRecordRequest);
    },
  };

  return PocuitoProxy;

})();

var proxy = new PocuitoProxy();
proxy.initialize();
