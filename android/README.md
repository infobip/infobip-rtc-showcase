## About the Android Infobip RTC Showcase Apps

The Android Infobip RTC Showcase offers code samples demonstrating the implementation of:

- [audio and video calls](https://github.com/infobip/infobip-rtc-showcase/tree/master/android/audio-and-video-calls),
- [application calls](https://github.com/infobip/infobip-rtc-showcase/tree/master/android/application-calls).

Code samples are available in Kotlin for Android, utilizing the
[Infobip RTC SDK](https://github.com/infobip/infobip-rtc-android).

## Getting Started

### Audio and Video Calls Showcase App

Add your `google-services.json` to the folder `./android/audio-and-video-calls/kotlin` so that you could receive
notifications about incoming calls.

### Application Calls Showcase App

Please note that, before running the Application Calls Showcase, it is necessary to consult the instructions on how to
set up and use the
[Calls API Showcase App](https://github.com/infobip/infobip-rtc-showcase/tree/master/calls-api--showcase). Running the
Calls API Showcase App is essential for enabling the full functionality of the Application Calls Showcase and should be
regarded as its prerequisite.

Add your `google-services.json` to the folder `./android/application-calls/kotlin` so that you could receive
notifications about incoming calls.

## Running the Showcase Apps

Provided that you run token application on your machine, you can run the chosen Android Showcase App on emulator on the
same machine.

There is known issue with receiving push notifications for incoming calls on subsequent runs on emulator, so it is
recommended to wipe data on your emulator before running the app again.

You can also run Android Showcase App on a real device. In that case, the running token application must be accessible
from your device.

Easiest way to do so is use tool like [ngrok](https://ngrok.com/). It allows you to expose your local port on public
internet via simple command:

#### `ngrok http 8080`

Then you can access publicly exposed token app from your physical Android device using the URL provided by ngrok.