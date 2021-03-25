import httpClient from 'axios';
import {Platform} from 'react-native';

let config = require('../config.json');

export class TokenService {
  static getToken() {
    let url =
      Platform.OS === 'android' ? config.tokenUrl.android : config.tokenUrl.ios;

    return httpClient
      .post(url)
      .then((response: any) => {
        return response.data.token;
      })
      .catch((error: any) => {
        console.error('Error retrieving access token: ' + error);
        throw new Error(
          'Error occurred while retrieving access token: ' + error.message,
        );
      });
  }
}
