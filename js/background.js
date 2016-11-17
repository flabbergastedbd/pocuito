var PocuitoBackground = (function() {
  'use strict';


  function PocuitoBackground() {
    this.eventsCollection = new Pocuito.Events();
  }

  PocuitoBackground.prototype = {
    'listen': function() {
      var $this = this;
      // This are events sent from Content Script
      chrome.runtime.onMessage.addListener(function(message) {
        $this.refresh(function() {
          var state = $this.eventsCollection.getStateObj();
          if (state.is_recording) {
            $this.eventsCollection.insertAfterCursor(message);
          }
        });
      });
    },

    'refresh': function(callback) {
      this.eventsCollection.fetch({"success": callback});
    },

    'reset': function() {
      this.eventsCollection.clear();
      this.refresh();
    }
  };

  return PocuitoBackground;

})();

var background = new PocuitoBackground();
background.listen();
