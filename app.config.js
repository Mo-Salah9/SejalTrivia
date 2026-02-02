/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv/config');

module.exports = ({config}) => ({
  ...config,
  name: 'سجال | Sejal',
  slug: 'sejal-trivia',
  version: '2.5',
  orientation: 'default',
  userInterfaceStyle: 'dark',
  scheme: 'sejaltrivia',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'com.falsafa.trivia',
    buildNumber: '9',
    supportsTablet: false,
    infoPlist: {
      UIViewControllerBasedStatusBarAppearance: false,
      UISupportedInterfaceOrientations: [
        'UIInterfaceOrientationPortrait',
        'UIInterfaceOrientationLandscapeLeft',
        'UIInterfaceOrientationLandscapeRight',
      ],
    },
    entitlements: {
      'com.apple.developer.applesignin': ['Default'],
      'com.apple.developer.in-app-payments': ['merchant.com.falsafa.trivia'],
    },
  },
  android: {
    package: 'com.falsafa.trivia',
    versionCode: 9,
    permissions: ['com.android.vending.BILLING'],
  },
  plugins: [
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme:
          'com.googleusercontent.apps.732862624643-b2kk4bi105kmfn4ubecu6k6687e3b37n',
      },
    ],
    'react-native-iap',
    'expo-apple-authentication',
    'expo-screen-orientation',
  ],
  extra: {
    eas: {
      projectId: undefined, // Set after running `eas init`
    },
    API_BASE_URL:
      process.env.API_BASE_URL ||
      'https://trivia-game-react-native-copy-production.up.railway.app/api',
    GOOGLE_WEB_CLIENT_ID:
      process.env.GOOGLE_WEB_CLIENT_ID ||
      '732862624643-3fhlnic3b60b0mara1tbv7klf9978hrn.apps.googleusercontent.com',
    GOOGLE_IOS_CLIENT_ID:
      process.env.GOOGLE_IOS_CLIENT_ID ||
      'com.googleusercontent.apps.732862624643-b2kk4bi105kmfn4ubecu6k6687e3b37n',
    GOOGLE_ANDROID_CLIENT_ID:
      process.env.GOOGLE_ANDROID_CLIENT_ID ||
      '732862624643-4c8njltnaqkrhc41ks39hh6t10lr1tqv.apps.googleusercontent.com',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  },
});
