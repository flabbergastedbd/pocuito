// XPath Helpers
function getElementXPath(element) {
	if (element && element.id)
		return '//*[@id="' + element.id + '"]';
	else
		return getElementTreeXPath(element);
}

function getElementTreeXPath(element) {
	var paths = [];
	// Use nodeName (instead of localName) so namespace prefix is included (if any).
	for (; element && element.nodeType == Node.ELEMENT_NODE; element = element.parentNode)
	{
		var index = 0;
		var hasFollowingSiblings = false;
		for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling)
		{
			// Ignore document type declaration.
			if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
				continue;
			if (sibling.nodeName == element.nodeName)
				++index;
		}
		for (var sibling = element.nextSibling; sibling && !hasFollowingSiblings;
			sibling = sibling.nextSibling)
		{
			if (sibling.nodeName == element.nodeName)
				hasFollowingSiblings = true;
		}
		var tagName = (element.prefix ? element.prefix + ":" : "") + element.localName;
		var pathIndex = (index || hasFollowingSiblings ? "[" + (index + 1) + "]" : "");
		paths.splice(0, 0, tagName + pathIndex);
	}
	return paths.length ? "/" + paths.join("/") : null;
}

function getElementByXPath(path) {
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}
// ----- End XPath Helpers -------

function getElement(m) {
  var elem = getElementByXPath(m['xpath']);
  return elem;
}

(function() {
	$(document).on('click change', function(e) {
    var elem = $(e.target);
    var data = {};
    // Event added if at all execution reaches here
    var xpath = getElementXPath(elem[0]);
		chrome.runtime.sendMessage(null, {
      "url": document.location.href,
      "xpath": xpath,
      "type": e.type,
      "value": elem.val(),
      "text": elem.text(),
      "tag": elem.prop('tagName')
    });
    // console.log(e.type + ' ' + xpath + ' ' + elem.value);
	});

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request);
    if (request['xpath']) {
      var e = getElement(request);
      var resp = {'success': false};
      if (e) {
        if (request['type'] === 'click') {
          $(e)[0].click();  // Access vanilla js object from jquery and then click
          console.log("Clicking " + request['xpath']);
        } else if (request['type'] === 'change') {
          $(e).val(request['value']);
          $(e).trigger('change');
        }
        resp['success'] = true;
        resp['message'] = request['type'] + ' executed';
      } else {
        console.log("Step failed!!");
        console.log(request);
      }
      sendResponse(resp);
    }
    return true;
  });
})();
