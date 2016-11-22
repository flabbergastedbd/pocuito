var PocuitoBackground = (function() {
  'use strict';


  function PocuitoBackground() {
    this.boundedRecord = this.record.bind(this);
  }

  PocuitoBackground.prototype = {
    startRecording: function() {
      chrome.runtime.onMessage.addListener(this.boundedRecord);
    },

    stopRecording: function() {
      chrome.runtime.onMessage.removeListener(this.boundedRecord);
    },

    record: function(message) {
      var eventsCollection = new Pocuito.Events();
      eventsCollection.refresh(function(collection, response, options) {
        eventsCollection.insertAfterCursor(message);
      });
    },
  };

  return PocuitoBackground;

})();

var background = new PocuitoBackground();
