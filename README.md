![Pocuito](/images/icons/icon128.png)

# Pocuito

A tiny chrome extension to record and replay your web application proof-of-concepts. Replaying PoCs from bug tracker written steps is a pain
most of the time, so just record the poc, distribute and replay it whenever necessary without much hassle.

### Use Cases

+ To avoid developers wasting your time when they are unable to reproduce your issues, just send them the json file and let them go through step by step.
+ To share your shiny new web vulnerabilities with your colleagues.
+ To simplify verification of a bug fix by just replaying the poc.

### Installation

+ Download & Install [CRX](https://github.com/tunnelshade/pocuito/releases/download/v0.1/pocuito.crx)

or

+ Clone the repository
+ Install bower dependencies `bower install`
+ Open Chrome extension settings
+ Enable developer mode checkbox
+ Click on load unpacked extension and browse to root directory

### Usage

Let us take an example of a poc of XSS in chrome (Because of XSS Auditor you might not see a popup, but developer console will show your payload success).

+ Let's navigate to ``testphp.vulnweb.com``.
+ Let us click on the extension and add an event called start proxy (`https://testphp.vulnweb.com/*` as url filter) as we would like to assert response of a request later.
+ Once the proxy event is added, let us click on record user actions to record our search actions.
+ Now, we will click on the search, search for `"><img src=x onerror="alert(9);` and click on the button `Go`.
+ When we open the popup we will see multiple click and change events made by us.
+ Since our required capture is done, we will add stop proxy event.
+ Now, let us have a look at proxy tab to see the captured requests (Try to find the search request so that we can add an assert event).
+ Once we have the url, we can just add an assert response body event with a url regex (in this case `https://testphp.vulnweb.com/*` and `POST` method) and content regex (i.e `alert`).
+ If necessary add comments to each step, eg: Lets click on the first step cursor button and add comment `Navigate to https://testphp.vulnweb.com and then play`.

To replay any step just select a step and click on **Play Step**.

More Docs: [Events](/docs/events.md), [Buttons](/docs/buttons.md)

### Roadmap

#### v0.2

+ Add more events like tamper request body (Have to search more for how to do it in chrome extensions)
+ Move to typescript or coffeescript?
+ Add Unit Tests?
+ Add to webstore?

### Author

Bharadwaj Machiraju

The main reason for writing this extension is to learn MarionetteJS. May be learn more stuff like TypeScript or CoffeScript in the further development.
