# Flutter Infobip RTC Showcase

This repository provides a minimalistic showcase demonstrating the utilization of Infobip's RTC SDKs for Flutter-based 
Android and iOS applications. The implementation highlights the integration of WebRTC and phone calling functionalities 
using the native Infobip RTC SDKs:

- [Infobip RTC iOS SDK](https://github.com/infobip/infobip-rtc-ios)
- [Infobip RTC Android SDK](https://github.com/infobip/infobip-rtc-android)

## Features
This project showcases the following basic features:
- Making phone and WebRTC calls with customizable call options
- Muting and unmuting audio during calls
- Enabling and disabling camera video during WebRTC calls
- Handling phone and WebRTC call events
- Displaying remote camera video during WebRTC calls
- Receiving and accepting or declining incoming WebRTC calls (Android only)

## Implementation Notes
- The current call model can be extended to include additional data and methods available in the native SDKs.
- Incoming calls can currently be received only on Android due to its implementation of an active connection. In a 
  production environment, it is recommended to use push notifications, which are supported by both native SDKs.
- **Note**: This project is not a showcase of a Flutter SDK but rather a sample, minimalistic project that utilizes the 
  native Android and iOS SDKs to demonstrate integration within a Flutter application.

## Getting Started
### Prerequisites
- Ensure your Flutter environment is set up. Follow the ([Flutter installation guide](https://flutter.dev/docs/get-started/install)) for detailed instructions.
- Set up your Android and iOS development environments.
- Obtain access to Infobip RTC services.
    - In `config.dart`, replace the placeholder with your API key.

### Installation
To install Flutter dependencies, run the following command:

```sh
flutter pub get
```

### Running the Project
To launch the application on an Android emulator, iOS simulator, or a physical device, execute:

```sh
flutter run
```
