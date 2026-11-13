import * as Haptics from 'expo-haptics';
import {Platform} from 'react-native';

function run(action: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  action().catch(() => {
    // Haptics are a progressive enhancement; ignore unsupported devices.
  });
}

export const haptics = {
  tap: () => run(() => Haptics.selectionAsync()),
  success: () =>
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () =>
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
