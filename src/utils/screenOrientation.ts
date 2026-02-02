import * as ScreenOrientation from 'expo-screen-orientation';

export const lockToLandscape = async (): Promise<void> => {
  try {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    );
    console.log('Screen locked to landscape');
  } catch (error: any) {
    console.warn('Could not lock orientation:', error.message);
  }
};

export const unlockOrientation = async (): Promise<void> => {
  try {
    await ScreenOrientation.unlockAsync();
    console.log('Screen orientation unlocked');
  } catch (error) {
    // Silent fail
  }
};
