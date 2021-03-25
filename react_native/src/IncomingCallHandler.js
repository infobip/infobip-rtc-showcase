import messaging from '@react-native-firebase/messaging';
import VoipPushNotification from 'react-native-voip-push-notification';
import RNCallKeep from 'react-native-callkeep';
import PermissionProvider from './PermissionProvider';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import InfobipRTC from 'infobip-rtc-react-native';
import {IncomingCall} from 'infobip-rtc-react-native/lib/typescript';
import DeviceInfo from 'react-native-device-info';

const GENERIC = 'generic';
const INCOMING_CALL_OPTIONS = {
  ios: {
    appName: 'Incoming call ',
    supportsVideo: true,
  },
  android: {
    alertTitle: '',
    alertDescription: '',
    cancelButton: '',
    okButton: '',
  },
};

export class IncomingCallHandler {
  token;

  constructor(token) {
    this.token = token;
  }

  async startCallKitCall(call) {
    if (await this.isEmulator()) {
      return;
    }
    RNCallKeep.startCall(call.id(), call.source().displayName, call.source().identity, GENERIC, call.hasLocalVideo());
  }

  async endCallKitCall(uuid) {
    if (await this.isEmulator()) {
      return;
    }
    RNCallKeep.endCall(uuid);
  }

  async initializePush(setupIncomingCallHandler) {
    if (Platform.OS === 'android') {
      await this.initializeAndroidPush(setupIncomingCallHandler);
    }

    if (Platform.OS === 'ios') {
      await this.initializeIosPush(setupIncomingCallHandler);
    }

    if (await this.isEmulator()) {
      this.initializeActiveConnectionForSimulator(setupIncomingCallHandler);
    }
  }

  async initializeAndroidPush(setupIncomingCallHandler) {
    this.requestPermissions();

    if (!(await this.isEmulator())) {
      this.enablePushNotifications(null);
    }
    this.setIncomingCallListenersForAndroid(setupIncomingCallHandler);
  }

  async initializeIosPush(setupIncomingCallHandler) {
    if (!(await this.isEmulator())) {
      await this.setIncomingCallListenersForIos(setupIncomingCallHandler);
      VoipPushNotification.registerVoipToken();
    }
  }

  initializeActiveConnectionForSimulator(setupIncomingCallHandler) {
    InfobipRTC.registerForActiveConnection(async (incomingCall) => {
      await setupIncomingCallHandler(incomingCall);
    });
  }

  async initializeCallKit(answerCallHandler, endCallHandler) {
    if (await this.isEmulator()) {
      return;
    }

    await RNCallKeep.setup(INCOMING_CALL_OPTIONS);
    this.setCallKitListeners(answerCallHandler, endCallHandler);
  }

  setCallKitListeners(answerCallHandler, endCallHandler) {
    RNCallKeep.addEventListener('answerCall', () => answerCallHandler());
    RNCallKeep.addEventListener('endCall', () => endCallHandler());
    RNCallKeep.addEventListener('didLoadWithEvents', (events) => {
      if (!events || !Array.isArray(events) || events.length < 1) {
        return;
      }
      for (let callKeepEvent of events) {
        let {name} = callKeepEvent;
        if (name === 'RNCallKeepPerformAnswerCallAction') {
          answerCallHandler();
        }
        if (name === 'RNCallKeepPerformEndCallAction') {
          endCallHandler();
        }
      }
    });
  }

  setIncomingCallListenersForAndroid(setupIncomingCallHandler) {
    messaging().onMessage(async (remoteMessage) => {
      await this.handleNotification(remoteMessage.data, setupIncomingCallHandler);
    });
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      await this.handleNotification(remoteMessage.data, setupIncomingCallHandler);
    });
  }

  async setIncomingCallListenersForIos(setupIncomingCallHandler) {
    VoipPushNotification.addEventListener('register', (deviceToken) => {
      this.enablePushNotifications(deviceToken);
    });
    VoipPushNotification.addEventListener('notification', async (callData) => {
      await this.handleNotification(callData, setupIncomingCallHandler);
    });
    VoipPushNotification.addEventListener('didLoadWithEvents', async (events) => {
      if (!events || !Array.isArray(events) || events.length < 1) {
        return;
      }
      for (let voipPushEvent of events) {
        let {name, data} = voipPushEvent;
        if (name === VoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent) {
          this.enablePushNotifications(data);
        } else if (name === VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent) {
          await this.handleNotification(data, setupIncomingCallHandler);
        }
      }
    });
  }

  async isEmulator() {
    return await DeviceInfo.isEmulator();
  }

  requestPermissions() {
    PermissionProvider.requestPermission([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]).catch((e) => {
      Alert.alert('Error!', e.message);
    });
  }

  enablePushNotifications(deviceToken) {
    InfobipRTC.enablePushNotification(this.token, deviceToken, true)
      .then(console.log(`Enabled push notifications for deviceToken: ${deviceToken}`))
      .catch((e) => {
        console.error('Error occurred while enabling push notifications.', e);
      });
  }

  async handleNotification(data, setupIncomingCallHandler) {
    try {
      let incomingCall: IncomingCall = await InfobipRTC.handleIncomingCall(data);
      if (incomingCall) {
        setupIncomingCallHandler(incomingCall);
      }
    } catch (error) {
      console.error('Error handling incoming call: ', error);
    }
  }
}
