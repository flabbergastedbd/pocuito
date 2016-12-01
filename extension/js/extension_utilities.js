function setChromeProxyConfig(config, callback) {
  chrome.proxy.settings.set({value: config, scope: 'regular'}, function() {
    if (callback) callback();
  });
}
