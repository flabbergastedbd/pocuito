![Pocuito](/images/icons/icon128.png)

# Pocuito

A tiny chrome extension to record and replay your web application proof-of-concepts. Replaying PoCs from bug tracker written steps is a pain
most of the time, so just record the poc, distribute and replay it whenever necessary without much hassle.

### Use Cases

+ To avoid developers wasting your time when they are unable to reproduce your issues, just send them the json file and let them go through step by step.
+ To share your shiny new web vulnerabilities with your colleagues.
+ To simplify verification of a bug fix by just replaying the poc.

### Installation

+ Clone the repository
+ Open Chrome extension settings
+ Enable developer mode checkbox
+ Click on load unpacked extension and browse to root directory

### Usage

Let us take an example of a poc where we search in github and verify that our search term is in response body.

+ Let's navigate to ``github.com``.
+ Let us click on the extension and add an event called start proxy (`https://github.com/*` as url filter) as we would like to assert response of a request later.
+ Once the proxy event is added, let us click on record user actions to record our search actions.
+ Now, we will click on the github search and search for `anything`.
+ When we open the popup we will see multiple click and change events made by us.
+ Since our required capture is done, we will add stop proxy event.
+ Now, let us have a look at proxy tab to see the captured requests (Try to find the search request so that we can add an assert event).
+ Once we have the url, we can just add an assert response body event with a url regex (in this case `https://github.com/search*`) and content regex (i.e `anything`).
+ If necessary add comments to each step, eg: Lets click on the first step cursor button and add comment `Navigate to https://github.com and then play`.

To replay any step just select a step and click on **Play Step**.

### Buttons

#### Global

+ **Reset**: Reset everything i.e clear event and proxy log completely. (Highly suggested while playing a new poc)

#### Event Log

+ **Record User Actions**: Start recording user input events
+ **Pause Recording**: Temporarily stop recording user input events
+ **Add Event**: Add different kinds of events like starting proxy, asserting response body etc.. . New event will be added after the event with cursor.
+ **Play Step**: Execute one event that is under the cursor
+ **Reset Events**: Clear all the events (NOTE: Reset the proxy as well, or click reset on the top when doing this)
+ **Download**: Download the poc as a file
+ **Load Poc**: Upload a POC file

#### Proxy Log

+ **Record**: Start recording requests
+ **Stop**: Stop recording requests
+ **Reset Requests**: Clear request log

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

### TBD

+ Add more events like tamper request body (Have to search more for how to do it in chrome extensions)
+ Move to typescript or coffeescript?
+ Add Unit Tests?
+ Add to webstore?

### AUTHOR

Bharadwaj Machiraju

The main reason for writing this extension is to learn MarionetteJS. May be learn more stuff like TypeScript or CoffeScript in the further development.
