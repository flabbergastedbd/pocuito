var Pocuito = Pocuito || {};

logger = new Pocuito.Logger();  // Create logger which uses backbone.radio

(function () {
	'use strict';
  Pocuito.proxy = {'url': null, 'active': false};
  Pocuito.client = null;

  // Override default renderer as we use mustache
  Mn.Renderer.render = function(template, data) {
    return(Mustache.render($(template).html(), data));
  };

  var PocuitoRootView = Mn.View.extend({
    template: '#template-root',
    el: '.container',
    regions: {
      eventsRegion: '#events',
      proxyRegion: '#proxy',
      statusRegion: '#status'
    },

    events: {
      'click #resetPocuitoBtn': 'resetChildren',
      'change #proxyUrl': 'changeProxyUrl'
    },

    changeProxyUrl: function(evnt) {
      var $this = this;
      var e = $(evnt.target);
      Pocuito.proxy['url'] = e.val();
      Pocuito.proxy['active'] = false;  // Will be changed by background script
      // Set new url and invoke background proxy check
      chrome.storage.local.set({proxy: Pocuito.proxy}, function() {
        var bgPage = chrome.extension.getBackgroundPage();
        if (bgPage && bgPage.background) bgPage.background.ping();
        Pocuito.client = new Pocuito.Client({'proxyUrl': Pocuito.proxy.url});
        $this.render();
      });
    },

    templateContext: function() {
      return {
        'proxy': Pocuito.proxy
      };
    },

    start: function() {
      var $this = this;
      chrome.storage.local.get('proxy', function(items) {
        if (items.proxy) {
          Pocuito.proxy = items.proxy;
        } else {
          Pocuito.proxy = {'url': null, 'active': false};
        }
        // If proxy is not present with url
        $this.render();
      });
    },

    initClient: function(url, reset) {
      Pocuito.client = new Pocuito.Client({'url': url});
      if (reset === undefined) {
        Pocuito.client.fetch();  // Simple get will give a new client
      } else {
        Pocuito.client.save();  // A POST will clean current one
      }
    },

    onBeforeRender: function() {
      if (Pocuito.proxy.url) this.initClient(Pocuito.proxy.url);
    },

    onRender: function() {
      this.showChildView('eventsRegion', new Pocuito.MainView());
      this.showChildView('proxyRegion', new Pocuito.ProxyView());
      this.showChildView('statusRegion', new Pocuito.StatusView());
    },

    resetChildren: function() {
      if (Pocuito.client) {
        this.initClient(Pocuito.proxy.url, true);
      }
      _.each(_.keys(this.regions), function(region) {
        var view = this.getChildView(region);
        if (view && view.reset) {
          view.reset();
        }
      }, this);
    }
  });

	var PocuitoApp = Mn.Application.extend({
    rootView: new PocuitoRootView(),

    onStart: function() {
      this.rootView.start();
    }
  });

	Pocuito.App = new PocuitoApp();
  Pocuito.App.start();

})();
