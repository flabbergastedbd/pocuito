var PocuitoProxy = (function() {
  'use strict';


  function PocuitoProxy() {
    // To get state whether to record or not
    this.requestsCollection = new Pocuito.Requests();
  }

  PocuitoProxy.prototype = {
    initialize: function() {
      this.boundedRecordRequestBody = this.recordRequestBody.bind(this);
      this.boundedRecordRequestHeaders = this.recordRequestHeaders.bind(this);
    },

    reset: function() {
      this.requestsCollection.clear();
    },

    recordRequestHeaders: function(message) {
      console.log(message);
      this.insertOrUpdate(message, 'requestHeaders');
    },

    // Called before thee headers one
    recordRequestBody: function(message) {
      console.log(message);
      this.insertOrUpdate(message, 'requestBody');
    },

    insertOrUpdate: function(message, attr) {
      var m = this.requestsCollection.get(parseInt(message.requestId));
      if (m) {
        var data = {};
        data[attr] = message[attr];
        m.set(data);
      } else {
        this.requestsCollection.insert(message);
      }
    },

    startRecording: function(filterDetails) {
      console.log("Starting proxy recording");
      if (!filterDetails.url) filterDetails["urls"] = ['http://*/*', 'https://*/*'];
      if (!filterDetails.types) filterDetails["types"] = ['main_frame', 'sub_frame', 'object', 'xmlhttprequest', 'ping', 'other'];
      chrome.webRequest.onBeforeRequest.addListener(
        this.boundedRecordRequestBody,
        filterDetails,
        ['requestBody']
      );
      chrome.webRequest.onSendHeaders.addListener(
        this.boundedRecordRequestHeaders,
        filterDetails,
        ['requestHeaders']
      );
    },

    stopRecording: function() {
      console.log("Stopping proxy recording");
      chrome.webRequest.onBeforeRequest.removeListener(this.boundedRecordRequestBody);
      chrome.webRequest.onSendHeaders.removeListener(this.boundedRecordRequestHeaders);
    },
  };

  return PocuitoProxy;

})();

var proxy = new PocuitoProxy();
proxy.initialize();
