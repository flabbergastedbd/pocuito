var PocuitoBackground = (function() {
  'use strict';


  function PocuitoBackground() {
    this.boundedRecord = this.record.bind(this);
  }

  PocuitoBackground.prototype = {
    keepPingingProxy: function(interval) {
      setInterval(this.ping, interval);
    },

    ping: function() {
      chrome.storage.local.get('proxy', function(items) {
        if (items.proxy && items.proxy.url) {
          var proxy = items.proxy;
          $.getJSON(addUrlPath(proxy.url, 'ping'), function(resp, textStatus, jqXHR) {
            if (resp && resp.active) {
              chrome.storage.local.set({'proxy': {'url': proxy.url, 'active': true}});
            }
          }).fail(function() {
            chrome.storage.local.set({'proxy': {'url': null, 'active': false}});
          });
        }
      });
    },

    startRecording: function() {
      chrome.runtime.onMessage.addListener(this.boundedRecord);
    },

    stopRecording: function() {
      chrome.runtime.onMessage.removeListener(this.boundedRecord);
    },

    record: function(message) {
      var eventsCollection = new Pocuito.Events();
      eventsCollection.refresh(function(collection, response, options) {
        eventsCollection.insertAfterCursor({'user_input': message});
      });
    },
  };

  return PocuitoBackground;

})();

var background = new PocuitoBackground();
background.keepPingingProxy(15000);
