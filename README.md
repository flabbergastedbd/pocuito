![Pocuito](/images/icons/icon128.png)

# Pocuito

A tiny chrome extension to record and replay your web application proof-of-concepts. Replaying PoCs from bug tracker written steps is a pain
most of the time, so just record the poc, distribute and replay it whenever necessary without much hassle.

### Use Cases

+ To avoid developers wasting your time when they are unable to reproduce your issues, just send them the json file and let them go through step by step.
+ To share your shiny new web vulnerabilities with your colleagues.
+ To simplify verification of a bug fix by just replaying the poc.

### Installation

+ Download & Install from [here](https://github.com/tunnelshade/pocuito/releases)
+ Start python proxy if planning on using tampering or asserting functionality.

or

+ Clone the repository
+ Install bower dependencies `bower install`
+ Setup proxy
+ Open Chrome extension settings
+ Enable developer mode checkbox
+ Click on load unpacked extension and browse to root directory

### Proxy Setup

+ Install pip requirements `pip install -r proxy/requirements.txt`
+ Start proxy server `python proxy.py`
+ It will print a url to the console which will be used in the addon

### Usage

Setup the proxy and put that url in the addon and wait a moment or two so that addon can verify. Let us take an example of a
poc of XSS in chrome (Because of XSS Auditor you might not see a popup, but developer console will show your payload success).

+ Let's navigate to ``testphp.vulnweb.com``.
+ Let us click on the extension and add an event called start proxy (`testphp` as url filter) to tamper responses later.
+ Once the proxy event is added, let us disable XSS auditor by adding event add response header & fill the first row with `X-XSS-Protection` and `0`.
+ Click on record user actions to record our search actions.
+ Now, we will click on the search, search for `<img src=x onerror='alert(9);'/>` and click on the button `Go`.
+ When we open the popup we will see multiple click and change events made by us. Stop user event recording by clicking on `Pause Recording Events`.
+ Since our required capture is done, we will add stop proxy event.
+ If necessary add comments to each step, eg: Lets click on the first step cursor button and add comment `Navigate to https://testphp.vulnweb.com and then play`.

To replay any step just select a step and click on **Play Step**.

More Docs: [Events](/docs/events.md), [Buttons](/docs/buttons.md)

### Known Issues

+ User input events like `return` on input fields is not being recorded as an event yet. Only click and change events are being monitored now.

### Roadmap

#### v0.2

+ Move to typescript or coffeescript?
+ Add Unit Tests?
+ Add to webstore?

### Author

Bharadwaj Machiraju

The main reason for writing this extension is to learn MarionetteJS. May be learn more stuff like TypeScript or CoffeScript in the further development.
