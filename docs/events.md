### Events

#### User Actions

User actions (click and change events) can be recorded when the extension is in recording mode. Recording mode can be started by
clicking on record user actions button.

#### Start Proxy

Starting proxy will record all requests according to the url and request pattern provided. The recorded request will be later used for
asserting response attributes.

#### Stop Proxy

Stopping proxy is only an event to prevent wastage of space and callbacks.

#### Assert Response Status

Asserting a response status line with provided regexes. The first recorded request matching the filter criteria will be tested.

#### Assert Response Header

Asserting response headers with provided regexes. The first recorded request matching the filter criteria will be tested.

#### Assert Response Body

Asserting response body with provided regexes. The first recorded request matching the filter criteria will be tested.

