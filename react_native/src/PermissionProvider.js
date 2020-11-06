import {Permission, PermissionsAndroid} from 'react-native';

export default class PermissionsProvider {
  static async requestPermission(permissionName: Permission) {
    const doRequest = async (permission: Permission) => {
      console.log('Trying ' + permissionName);
      const granted = await PermissionsAndroid.request(permission);

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log(`Granted permission for ${permissionName}`);
      } else {
        console.warn(`Denied permission for ${permissionName}`);
        throw new Error('Permission denied.');
      }
    };

    if (Array.isArray(permissionName)) {
      for (const name of permissionName) {
        await doRequest(name);
      }
    } else {
      await doRequest(permissionName);
    }
  }
}
