var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.MainView = Mn.View.extend({
    regions: {
      'main': '#main'
    },
    template: '#template-main',
		recorderView: null,
		replayerView: null,

    events: {
      'click #recordPocBtn': 'recordPoc',
      'click #replayPocBtn': 'replayPoc',
      'click #pausePocBtn': 'pausePoc',
      'click #playPocStepBtn': 'playPocStep',
      'click #resetPocBtn': 'reset'
    },

    initialize: function() {
      this.eventsCollection = new Pocuito.Events();

      this.eventsCollection.on('change add remove', this.render);

      this.eventsCollection.refresh(this.render);
    },

    templateContext: function() {
      var state = this.eventsCollection.getStateObj();
      return state;
    },

    reset: function(e) {
      this.eventsCollection.clear();
      this.eventsCollection.setState(1);
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

		onRender: function() {
      var state = this.eventsCollection.getStateObj();
			if (!state.is_init) {
				this.showChildView('main', new Pocuito.EventsTableView({'collection': this.eventsCollection}));
			} else {
        this.detachChildView('main');
      }
		}
  });

})();
