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
      'click #recordRequestsBtn': 'startRecording',
      'click #stopRecordRequestsBtn': 'stopRecording',
      'click #resetProxyBtn': 'reset',
      'click .refreshProxyBtn': 'refresh'
    },

    initialize: function() {
      this.requestsCollection = new Pocuito.Requests();

      this.refresh();

      this.requestsCollection.on('change add remove', this.render);
    },

    refresh: function() {
      this.requestsCollection.refresh(this.render);
    },

    templateContext: function() {
      var state = this.requestsCollection.getStateObj();
      return state;
    },

    reset: function(e) {
      this.requestsCollection.clear();
    },

    startRecording: function(e) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var tabId = tabs[0].id;
        var bgPage = chrome.extension.getBackgroundPage();
        if (bgPage && bgPage.proxy) {
          bgPage.proxy.startRecording({'tabId': tabId});
        }
      });
      this.requestsCollection.setState(2);
    },

    stopRecording: function(e) {
      var bgPage = chrome.extension.getBackgroundPage();
      if (bgPage && bgPage.proxy) {
        bgPage.proxy.stopRecording();
      }
      this.requestsCollection.setState(1);
    },

    onRender: function() {
      var state = this.requestsCollection.getStateObj();
      if (!this.getRegion('proxy_table').hasView()) {
        this.showChildView('proxy_table', new Pocuito.RequestsTableView({'collection': this.requestsCollection}));
      }
    }
  });

})();
