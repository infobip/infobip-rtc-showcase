## Token Application - Node.js
Create `config.json` file in the `./token/node` project directory, and fill it with data:
```
{  
  "HTTP_PORT": 8080,
  "INFOBIP_API_HOST": "api.infobip.com",
  "INFOBIP_RTC_TOKEN_PATH": "/webrtc/1/token",
  "INFOBIP_USERNAME": "YOUR_USERNAME",
  "INFOBIP_PASSWORD": "YOUR_PASSWORD"
}
```

Then in the `./token/node` project directory:

### `npm install`
### `npm start`

Runs the app.  

You can verify that app is running by executing:

### `curl -X POST http://localhost:8080/token`

## Token Application - Java

In the `./token/java` project directory:

### `mvn spring-boot:run`

Runs the app.

Before that, you should export `INFOBIP_USERNAME` and `INFOBIP_PASSWORD` environment variables and set them to your Infobip credentials.  

You can verify that app is running by executing:

### `curl -X POST http://localhost:8080/token`

## Infobip RTC Showcase - jQuery
In `./js/jquery` folder: 

### `npm install`
### `npm start`

Runs the app.  
Open [http://localhost:8010](http://localhost:8010) to view it in the browser.


## Infobip RTC Showcase - React
In `./js/react` folder: 

### `npm install`
### `npm start`

Runs the app.  
Open [http://localhost:8020](http://localhost:8020) to view it in the browser.

The page will reload if you make edits.  
You will also see any lint errors in the console.

## Infobip RTC Showcase - Angular
In `./js/angular` folder: 

### `npm install`
### `npm start`

Runs the app.  
Open [http://localhost:8030](http://localhost:8030) to view it in the browser.

The page will reload if you make edits.  
You will also see any lint errors in the console.

## Infobip RTC Showcase - Android Kotlin
In `./android/kotlin/infobip-rtc-showcase-android` folder add your `google-services.json` so you can receive notifications about incoming calls.  
Provided that you run token application on your machine, you can run Android app on emulator on the same machine.  
  
There is known issue with receiving push notifications for incoming calls on subsequent runs on emulator, so it is recommended to wipe data on your emulator before running app again.
  
You can also run Android app on real device, but then you need access from your device to running token application.  
Easiest way to do so is use tool like [ngrok](https://ngrok.com/). It allows you to expose your local port on public internet via simple command:  
#### `ngrok http 8080`
Then you can access publicly exposed token app from your physical Android device using URL provided by ngrok.
