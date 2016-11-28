var Pocuito = Pocuito || {};

(function () {
	'use strict';

  Pocuito.RequestView = Marionette.View.extend({
    tagName: 'tr',
    template: '#template-request-item',

    events: {
      'click .deleteRequestBtn': 'deleteModel',
    },

    deleteModel: function() {
      this.model.destroy();
    },
  });

  Pocuito.RequestsView = Marionette.CollectionView.extend({
    tagName: 'tbody',
    childView: Pocuito.RequestView,

    initialize: function() {
      this.a = null;
    }
  });

	Pocuito.RequestsTableView = Marionette.View.extend({
		template: '#template-requests-table',

		regions: {
			body: {
				el: 'tbody',
        replaceElement: true
			}
		},

		onRender: function() {
      if (this.collection.length > 0) {
        this.showChildView('body', new Pocuito.RequestsView({
          collection: this.collection
        }));
      }
		}
	});

  Pocuito.ProxyView = Mn.View.extend({
    regions: {
      'proxy_table': '#proxyTable'
    },
    template: '#template-proxy',

    events: {
      'click #resetProxyBtn': 'reset',
      'click .refreshProxyBtn': 'refresh',
      'click #setToSystemProxyBtn': 'setToSystemProxy',
      'click #setToDirectBtn': 'setToDirect'
    },

    setToSystemProxy: function() {
      setChromeProxyConfig({'mode': 'system'});
      logger.success('Proxy settings changed to system');
    },

    setToDirect: function() {
      setChromeProxyConfig({'mode': 'direct'});
      logger.success('Direct connection');
    },

    initialize: function() {
      this.requestsCollection = new Pocuito.Requests({'proxyUrl': Pocuito.proxy.url});

      this.refresh();

      this.requestsCollection.on('change add remove', this.render);
    },

    refresh: function() {
      this.requestsCollection.refresh(this.render);
    },

    templateContext: function() {
      // var state = this.getStateObj();
      var state = {};
      return state;
    },

    reset: function(e) {
      this.requestsCollection.clear();
    },

    onRender: function() {
      if (!this.getRegion('proxy_table').hasView() && (this.requestsCollection.length > 0)) {
        this.showChildView('proxy_table', new Pocuito.RequestsTableView({'collection': this.requestsCollection}));
      }
    }
  });

})();
