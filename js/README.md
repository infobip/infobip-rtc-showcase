## About the Javascript Infobip RTC Showcase Apps

The Javascript Infobip RTC Showcase offers code samples demonstrating the implementation of:

- [audio and video calls](https://github.com/infobip/infobip-rtc-showcase/tree/master/js/audio-and-video-calls),
- [application calls](https://github.com/infobip/infobip-rtc-showcase/tree/master/js/application-calls).

Code samples are available in AngularJS, JQuery, and ReactJS, utilizing the
[Infobip RTC SDK](https://github.com/infobip/infobip-rtc-js).

## Getting Started

### Application Calls Showcase App

Please note that, before running the Application Calls Showcase App, it is necessary to consult the instructions on how
to set up and use the
[Calls API Showcase App](https://github.com/infobip/infobip-rtc-showcase/tree/master/calls-api-showcase). Running the
Calls API Showcase App is essential for enabling the full functionality of the Application Calls Showcase App and
should be regarded as its prerequisite.

Additionally, before running the Application Calls Showcase App, create a `config.json` file in the following directory
for your chosen framework:

- Angular.js: `./js/application-calls/angular/src/assets`

and populate it with the following data:

```
{
  "INFOBIP_APP_ID": "YOUR_APP_ID"
}
```

## Running the Showcase Apps

You need to have `Node.js` installed on your computer (https://nodejs.org/en/).

In the corresponding project directory:

- install needed dependencies by running:
  ### `npm install`

- start the application by running:
  ### `npm start`

After successfully running the app, you can access it by opening a localhost URL in your web browser. This URL
will display the application's user interface and functionality.

|                       | JQuery                                         | ReactJS                                        | AngularJS                                      |
|-----------------------|------------------------------------------------|------------------------------------------------|------------------------------------------------|
| Audio and video calls | [http://localhost:8010](http://localhost:8010) | [http://localhost:8020](http://localhost:8020) | [http://localhost:8030](http://localhost:8030) |
| Application calls     | [http://localhost:8040](http://localhost:8040) | [http://localhost:8050](http://localhost:8050) | [http://localhost:8060](http://localhost:8060) |