import Orientation from 'react-native-orientation-locker';

export const lockToLandscape = (): void => {
  try {
    Orientation.lockToLandscape();
    console.log('Screen locked to landscape');
  } catch (error: any) {
    console.warn('Could not lock orientation:', error.message);
  }
};

export const unlockOrientation = (): void => {
  try {
    Orientation.unlockAllOrientations();
    console.log('Screen orientation unlocked');
  } catch (error) {
    // Silent fail
  }
};
