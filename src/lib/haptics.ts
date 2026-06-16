import { Vibration } from 'react-native';

export function triggerLongPressHaptic() {
  try {
    Vibration.vibrate(18);
  } catch {
    // Haptics are optional feedback.
  }
}
