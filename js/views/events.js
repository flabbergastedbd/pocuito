var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.EventView = Marionette.View.extend({
    tagName: 'tr',
    template: '#template-event-item',

    events: {
      'click .deleteEventBtn': 'deleteModel',
      'click .getCursorBtn': 'getCursor',
    },

    deleteModel: function() {
      this.model.destroy();
    },

    getCursor: function() {
      this.model.collection.updateCursor(this.model);
    }
  });

  Pocuito.EventsView = Marionette.CollectionView.extend({
    tagName: 'tbody',
    childView: Pocuito.EventView
  });

	Pocuito.EventsTableView = Marionette.View.extend({
		template: '#template-events-table',

		regions: {
			body: {
				el: 'tbody',
        replaceElement: true
			}
		},

		onRender: function() {
      if (this.collection.length > 0) {
        this.showChildView('body', new Pocuito.EventsView({
          collection: this.collection
        }));
      }
		}
	});

})();
