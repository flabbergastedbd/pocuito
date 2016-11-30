### Events

#### User Actions

User actions (click and change events) can be recorded when the extension is in recording mode. Recording mode can be started by
clicking on record user actions button.

#### Start Proxy

Will configure your browser to use the proxy inorder to record all requests according to the url pattern provided. The
recorded requests will be later used for asserting response attributes or headers. Recorded requests can be seen in proxy tab of the
extension

#### Stop Proxy

Will reconfigure your browser to the old proxy settings and instruct the proxy to stop recording.

#### Tamper Request Body

Tampering part of request body, the two input parameters are pattern to match and text to replace it with. Useful in scenarios where
client side filters exist for filtering few characters.

#### Assert Response Status

Asserting a response status line with provided regexes. The first recorded request matching the filter criteria will be tested.

#### Assert Response Header

Asserting response headers with provided regexes. The first recorded request matching the filter criteria will be tested.

#### Assert Response Body

Asserting response body with provided regexes. The first recorded request matching the filter criteria will be tested.

#### Add Response Header

Add a response header to the responses matched by proxy url pattern. Use case can be to disable chrome xss auditor by setting
`X-XSS-Protection: 1`
