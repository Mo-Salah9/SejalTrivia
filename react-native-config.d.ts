declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    GOOGLE_WEB_CLIENT_ID?: string;
    GOOGLE_IOS_CLIENT_ID?: string;
    GOOGLE_ANDROID_CLIENT_ID?: string;
    GEMINI_API_KEY?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
