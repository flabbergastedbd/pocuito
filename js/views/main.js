var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.MainView = Mn.View.extend({
    regions: {
      'eventsTable': '#eventsTable',
      'eventForm': '#eventForm'
    },
    template: '#template-main',

    events: {
      'click #recordPocBtn': 'recordPoc',
      'click #pausePocBtn': 'pausePoc',
      'click #playPocStepBtn': 'playPocStep',
      'click #showEventFormBtn': 'showEventForm',
      'click #removeEventFormBtn': 'removeEventForm',
      'click #resetPocBtn': 'reset',
      'click #downloadPocBtn': 'downloadPoc',
      'click #openInNewTabBtn': 'openInNewTab',
      'change #pocFile': 'loadPoc'
    },

    initialize: function() {
      this.eventsCollection = new Pocuito.Events();

      this.eventsCollection.on('change add remove', this.render);

      this.eventsCollection.refresh(this.render);
    },

    openInNewTab: function() {
      var url = chrome.extension.getURL('/popup.html');
      chrome.tabs.create({'url': url});
    },

    loadPoc: function(e) {
      if (e.target.files.length > 0) {
        var file = e.target.files[0];
        var reader = new FileReader();
        var $this = this;
        reader.onload = function(e1) {
          var eventsArray = JSON.parse(e1.target.result);
          _.each(eventsArray, function(v, i) {
            $this.eventsCollection.create(v);
          }, this);
        };
        reader.readAsText(file);
      }
    },

    templateContext: function() {
      var state = this.eventsCollection.getStateObj();
      state['is_popup'] = (location.href.indexOf('popup=true') != -1);
      return state;
    },

    reset: function(e) {
      this.eventsCollection.clear();
    },

    downloadPoc: function(e) {
      var $this = this;
      this.eventsCollection.refresh(function() {
        var a = $('<a>', {
          'download': 'pocuito.json',
          'href': 'data:application/json,' + encodeURIComponent(JSON.stringify($this.eventsCollection.toJSON())),
          'text': 'Download File'
        });
        $this.$el.append(a);
        a[0].click();
      });
    },

    recordPoc: function(e) {
      var bgPage = chrome.extension.getBackgroundPage();
      if (bgPage && bgPage.background) {
        bgPage.background.startRecording();
      }
      this.eventsCollection.setState(2);
    },

    pausePoc: function(e) {
      var bgPage = chrome.extension.getBackgroundPage();
      if (bgPage && bgPage.background) {
        bgPage.background.stopRecording();
      }
      this.eventsCollection.setState(1);
    },

    playPocStep: function(e) {
      this.eventsCollection.playStep();
    },

    showEventForm: function(e) {
      this.showChildView('eventForm', new Pocuito.EventFormPickerView({'collection': this.eventsCollection}));
    },

    removeEventForm: function(e) {
      this.detachChildView('eventForm');
    },

		onRender: function() {
      this.showChildView('eventsTable', new Pocuito.EventsTableView({'collection': this.eventsCollection}));
		}
  });

})();
