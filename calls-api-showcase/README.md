## Calls Showcase - Getting Started

Calls API Showcase App serves as a demonstration of implementing the
[Infobip Calls API](https://www.infobip.com/docs/api/channels/voice/calls) and handling 
[Calls Events](https://www.infobip.com/docs/api/channels/voice/calls/calls-applications/receive-calls-event). It 
complements the showcase of making the application calls within the context of the Infobip 
RTC SDKs, hence it is recommended to use this secondary app together with the Application Calls Showcase Apps:

- Application Calls Showcase App (Javascript)
    * jQuery
    * [AngularJS](https://github.com/infobip/infobip-rtc-showcase/tree/master/js/application-calls/angular)
    * ReactJS
- Application Calls Showcase App (Android)
- Application Calls Showcase App (iOS)

## Prerequisite

Before running the Calls API Showcase App, create a `config.json` file in the `./calls-showcase/node` directory and 
populate it with the following data:

```
{
  "HTTP_PORT": 8090,
  "INFOBIP_API_HOST": "api.infobip.com",
  "INFOBIP_API_KEY": "YOUR_API_KEY"
}
```

## Running the Calls Showcase App

Ensure that you have [Node.js]((https://nodejs.org/en/)) installed on your computer.

When running the application, use an additional argument `--phone-number={phone-number}` to enable a phone call 
scenario. Replace `{phone-number}` with the desired phone number to receive the call.

In the project directory `./calls-showcase/node`:

- install the required dependencies by running:
  ### `npm install`

- start the application by running:
  ### `npm start` or `npm start --phone-number={phone-number}`

After successfully running the app, access it by opening a localhost URL in your web browser:
[http://localhost:8090](http://localhost:8090).

## Exposing the Calls API Showcase App with Webhooks to the public Internet

To configure Calls Application with a Webhook URL, the Calls API Showcase App can be exposed to the public internet. The 
easiest way to achieve this is through [ngrok](https://ngrok.com/). Run the following command in your terminal to obtain 
a public URL:

```shell
ngrok http 8090
```

## Creating and Configuring [Calls Application](https://www.infobip.com/docs/voice-and-video/calls#applications-concepts) 

Actions performed on calls, conferences and dialogs using the Calls API as a part of Calls API Showcase App will trigger 
one or several events. These events are sent to your exposed application webhooks using subscriptions. Therefore, it's 
crucial to ensure that your chosen application has defined subscriptions. You can manage subscriptions via the
[API](https://www.infobip.com/docs/api/platform/subscriptions-api) or on the 
[Portal](https://portal.infobip.com/dev/subscriptions). 

For more information on creating a new application and setting up subscriptions, please refer to the 
[documentation](https://www.infobip.com/docs/voice-and-video/calls#applications-concepts).

Please note that the notification profile linked to your subscription will include the details of your application 
webhook. If you have chosen to use `ngrok` as previously described, your webhook URL will follow this format:
`https://${your-ngrok-id}.ngrok-free.app/event`. Ensure that you replace `${your-ngrok-id}` with the unique ID obtained 
via `ngrok http 8090`.
