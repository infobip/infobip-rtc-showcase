## Token Application - Node.js

You need to have `Node.js` installed on your computer (https://nodejs.org/en/).

Create `config.json` file in the `./token/node` project directory, and fill it with data:
```
{  
  "HTTP_PORT": 8080,
  "INFOBIP_API_HOST": "api.infobip.com",
  "INFOBIP_RTC_TOKEN_PATH": "/webrtc/1/token",
  "INFOBIP_API_KEY": "YOUR_API_KEY",
  "INFOBIP_APP_ID": "YOUR_APPLICATION_ID"
}
```

Then in the `./token/node` project directory:
 
- install needed dependencies by running:
    ### `npm install`
    
- start the application by running:
    ### `npm start`

You can verify that app is running by executing:

### `curl -X POST http://localhost:8080/token`

## Token Application - Java

In the `./token/java` project directory:

### `mvn spring-boot:run`

Runs the app.

Before that, you should export `INFOBIP_API_KEY` environment variable and set it to your Infobip API key.

You can verify that app is running by executing:

### `curl -X POST http://localhost:8080/token`

## Infobip RTC Showcase - jQuery

You need to have `Node.js` installed on your computer (https://nodejs.org/en/).

In `./js/jquery` project directory:
 
- install needed dependencies by running:
    ### `npm install`
    
- start the application by running:
    ### `npm start`

Open [http://localhost:8010](http://localhost:8010) to view it in the browser.


## Infobip RTC Showcase - React

You need to have `Node.js` installed on your computer (https://nodejs.org/en/).

In `./js/react` project directory:
 
- install needed dependencies by running:
    ### `npm install`
    
- start the application by running:
    ### `npm start`

Open [http://localhost:8020](http://localhost:8020) to view it in the browser.

The page will reload if you make edits.  
You will also see any lint errors in the console.

## Infobip RTC Showcase - Angular

You need to have `Node.js` installed on your computer (https://nodejs.org/en/).

In `./js/angular` project directory:
 
- install needed dependencies by running:
    ### `npm install`
    
- start the application by running:
    ### `npm start`
Runs the app.

Open [http://localhost:8030](http://localhost:8030) to view it in the browser.

The page will reload if you make edits.  
You will also see any lint errors in the console.

## Infobip RTC Showcase - Android Kotlin
Add your `google-services.json` to folder `./android/kotlin/infobip-rtc-showcase-android` so that you could receive notifications about incoming calls.  
Provided that you run token application on your machine, you can run Android app on emulator on the same machine.  
  
There is known issue with receiving push notifications for incoming calls on subsequent runs on emulator, so it is recommended to wipe data on your emulator before running the app again.
  
You can also run Android app on a real device. In that case, the running token application must be accessible from your device.  
Easiest way to do so is use tool like [ngrok](https://ngrok.com/). It allows you to expose your local port on public internet via simple command:  
#### `ngrok http 8080`
Then you can access publicly exposed token app from your physical Android device using the URL provided by ngrok.

## Infobip RTC Showcase - React Native
Add your `google-services.json` to folder `./react_native/android/app` so that you could receive notifications about incoming calls.  
Provided that you run token application on your machine, you can run The android app on the emulator on the same machine.  
  
There is known issue with receiving push notifications for incoming calls on subsequent runs on an emulator, so it is recommended to wipe data on your emulator before running the app again.
  
You can also run Android app on a real device. In that case, the running token application must be accessible from your device.  
The Easiest way to do so is use tool like [ngrok](https://ngrok.com/). It allows you to expose your local port on a public internet via simple command:  
#### `ngrok http 8080`
Then you can access publicly exposed token app from your physical Android device using the URL provided by ngrok.

After that, ensure you have local.properties in folder `./react_native/android` filled with content `sdk.dir=...` with path to Android SDK on your computer.

Then in the `./react_native` project directory:
 
- install needed dependencies by running:
    ### `npm install` or `yarn install` 
    
- start the metro application by running:
    ### `npm start` or  `yarn start` 

- start the Android on emulator or connected phone by running:
    ### `npm run android` or  `yarn run android`     
    
You can use both _yarn_ or _npm_, but please keep in mind that it is advised not to mix package managers in order to avoid resolution inconsistencies.
