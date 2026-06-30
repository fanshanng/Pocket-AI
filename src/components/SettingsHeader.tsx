import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DirectionIcon } from './AppIcons';
import type { AppTheme } from '../theme';

type Props = {
  theme: AppTheme;
  title: string;
  subtitle: string;
  showBackButton: boolean;
  onBack: () => void;
};

function SettingsHeaderComponent({
  theme,
  title,
  subtitle,
  showBackButton,
  onBack,
}: Props) {
  return (
    <View style={styles.settingsHeader}>
      {showBackButton && (
        <Pressable
          style={[
            styles.backButton,
            { backgroundColor: theme.controlSurface, borderColor: theme.controlBorder },
          ]}
          onPress={onBack}
        >
          <DirectionIcon direction="left" color={theme.primary} />
        </Pressable>
      )}
      <View style={styles.modalHeading}>
        <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.modalSubtitle, { color: theme.muted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

export const SettingsHeader = memo(SettingsHeaderComponent);

const styles = StyleSheet.create({
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  modalHeading: {
    flex: 1,
    paddingRight: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    marginTop: 8,
    lineHeight: 19,
    color: '#64748B',
  },
});
