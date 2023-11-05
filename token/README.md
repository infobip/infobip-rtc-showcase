## Token App - Getting Started

The Token App is a sample application to
[generate the WebRTC Token](https://www.infobip.com/docs/api/channels/webrtc-calls/webrtc/generate-webrtc-token).
Running the Token App is a necessary prerequisite for running the Showcase Apps.

## Token App - Node.js

You need to have `Node.js` installed on your computer (https://nodejs.org/en/).

Create `config.json` file in the `./token/node` project directory, and fill it with data:

```
{  
  "HTTP_PORT": 8080,
  "INFOBIP_API_HOST": "api.infobip.com",
  "INFOBIP_RTC_TOKEN_PATH": "/webrtc/1/token",
  "INFOBIP_API_KEY": "YOUR_API_KEY"
}
```

Then in the `./token/node` project directory:

- install needed dependencies by running:

```shell
npm install
```

- start the application by running:

```shell
npm start
```

You can verify that app is running by executing:

```shell
curl -X POST http://localhost:8080/token
```

## Token App - Java

In the `./token/java` project directory, start the application by running:

```shell
mvn spring-boot:run
```

Before that, you should export `INFOBIP_API_KEY` environment variable and set it to your Infobip API key.

You can verify that app is running by executing:

```shell
curl -X POST http://localhost:8080/token
```