var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.MainView = Mn.View.extend({
    regions: {
      'eventsTable': '#eventsTable',
      'eventForm': '#eventForm'
    },
    template: '#template-main',
		recorderView: null,
		replayerView: null,

    events: {
      'click #recordPocBtn': 'recordPoc',
      'click #loadPocBtn': 'loadPoc',
      'click #pausePocBtn': 'pausePoc',
      'click #playPocStepBtn': 'playPocStep',
      'click #showEventFormBtn': 'showEventForm',
      'click #resetPocBtn': 'reset',
      'click #downloadPocBtn': 'downloadPoc'
    },

    initialize: function() {
      this.eventsCollection = new Pocuito.Events();

      this.eventsCollection.on('change add remove', this.render);

      this.eventsCollection.refresh(this.render);

    },

    loadPoc: function() {
      var bgPage = chrome.extension.getBackgroundPage();
      if (bgPage && bgPage.background) {
        bgPage.background.loadPocFile();
      }
    },

    templateContext: function() {
      var state = this.eventsCollection.getStateObj();
      return state;
    },

    reset: function(e) {
      this.eventsCollection.clear();
      this.eventsCollection.setState(1);
    },

    downloadPoc: function(e) {
      var $this = this;
      this.eventsCollection.refresh(function() {
        var a = $('<a/>', {
          'download': 'pocuito.txt',
          'href': 'data:application/json,' + JSON.stringify($this.eventsCollection.toJSON()),
          'text': 'Download File'
        });
        $this.$el.append(a);
        a[0].click();
        $this.$el.remove(a);
      });
    },

    recordPoc: function(e) {
      this.eventsCollection.setState(2);
    },
    pausePoc: function(e) {
      this.eventsCollection.setState(3);
    },

    playPocStep: function(e) {
      this.eventsCollection.playStep();
    },

    replayPoc: function(e) {
      this.eventsCollection.setState(4);
    },

    showEventForm: function(e) {
      this.showChildView('eventForm', new Pocuito.EventFormPickerView({'collection': this.eventsCollection}));
    },

		onRender: function() {
      this.showChildView('eventsTable', new Pocuito.EventsTableView({'collection': this.eventsCollection}));
		}
  });

})();
