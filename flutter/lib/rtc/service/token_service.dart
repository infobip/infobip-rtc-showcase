import 'dart:convert';
import 'dart:developer' as developer;

import 'package:http/http.dart' as http;

import '../config/config.dart';

class TokenService {
  static Future<String?> fetchToken(String identity) async {
    try {
      final response = await http.post(
        Uri.parse(Config.apiUrl),
        headers: {
          'Authorization': 'App ${Config.apiKey}',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'identity': identity,
        }),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        return responseData['token'];
      } else {
        developer.log('Failed to fetch token: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      developer.log('Error fetching token: $e');
      return null;
    }
  }
}