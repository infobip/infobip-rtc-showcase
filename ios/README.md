## About the iOS Infobip RTC Showcase Apps

The iOS Infobip RTC Showcase offers code samples demonstrating the implementation of:

- [audio and video calls](https://github.com/infobip/infobip-rtc-showcase/tree/master/ios/audio-and-video-calls/swift),
- [application calls](https://github.com/infobip/infobip-rtc-showcase/tree/master/ios/application-calls/swift).
- [data channels](https://github.com/infobip/infobip-rtc-showcase/tree/master/ios/data-channels/swift).

Code samples are available in Swift, utilizing the [Infobip RTC SDK](https://github.com/infobip/infobip-rtc-ios).

## Getting Started

### Audio and Video Calls Showcase App

In order to enable push notifications, it is necessary to create a WebRTC push configuration. For more information on
the creation of a push configuration, please refer to the
corresponding [documentation](https://www.infobip.com/docs/voice-and-video/webrtc#declare-a-webrtc-application-getstartedwith-rtc-sdk).

Before running the Application Calls Showcase App, make sure to edit the `Config.swift` file and populate it with the 
following data:

```swift
struct Config {
    static let pushConfigId = "your_push_config_id"
}
```

### Application Calls Showcase App

Please note that, before running the Application Calls Showcase App, it is necessary to consult the instructions on how
to set up and use the
[Calls API Showcase App](https://github.com/infobip/infobip-rtc-showcase/tree/master/calls-api-showcase). Running the
Calls Showcase App is essential for enabling the full functionality of the Application Calls Showcase App and should be
regarded as its prerequisite.

In order to enable push notifications, it is necessary to create a WebRTC push configuration. For more information on
the creation of an application, and association of push configurations to that application, please refer to the
corresponding [documentation](https://www.infobip.com/docs/voice-and-video/webrtc#declare-a-webrtc-application-getstartedwith-rtc-sdk).

Before running the Application Calls Showcase App, make sure to edit the `Config.swift` file and populate it with the 
following data:

```swift
struct Config {
    static let applicationId = "your_application_id"
    static let pushConfigId = "your_push_config_id"
}
```
