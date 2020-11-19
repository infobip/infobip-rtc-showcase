import {Permission, PermissionsAndroid} from 'react-native';

export default class PermissionsProvider {
  static async requestPermission(permissions: Permission[]) {
    const doRequest = async (permission: Permission) => {
      console.log('Trying ' + permission);
      const granted = await PermissionsAndroid.request(permission);

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log(`Granted permission for ${permission}`);
      } else {
        console.warn(`Denied permission for ${permission}`);
        throw new Error('Permission denied.');
      }
    };

    for (const permission of permissions) {
      await doRequest(permission);
    }
  }
}
