var Pocuito = Pocuito || {};

(function () {
	'use strict';

  // Override default renderer as we use mustache
  Mn.Renderer.render = function(template, data) {
    return(Mustache.render($(template).html(), data));
  };

  var PocuitoRootView = Mn.View.extend({
    template: '#template-root',
    el: '.container',
    regions: {
      eventsRegion: '#events',
      proxyRegion: '#proxy'
    },

    onRender: function() {
      this.showChildView('eventsRegion', new Pocuito.MainView());
      this.showChildView('proxyRegion', new Pocuito.ProxyView());
    }
  });

	var PocuitoApp = Mn.Application.extend({
    rootView: new PocuitoRootView(),

    onStart: function() {
      this.rootView.render();
    }
  });

	Pocuito.App = new PocuitoApp();
  Pocuito.App.start();

})();
