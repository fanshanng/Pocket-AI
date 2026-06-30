import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DirectionIcon } from './AppIcons';
import type { AppTheme } from '../theme';

type Item = {
  key: string;
  title: string;
  subtitle: string;
  action: 'api' | 'navigate';
};

type Props = {
  theme: AppTheme;
  items: Item[];
  onOpenApiProfiles: () => void;
  onNavigate: (sectionKey: string) => void;
};

function SettingsRootSectionComponent({
  theme,
  items,
  onOpenApiProfiles,
  onNavigate,
}: Props) {
  return (
    <>
      {items.map((item) => (
        <Pressable
          key={item.key}
          style={[styles.settingsNavItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          onPress={() => {
            if (item.action === 'api') {
              onOpenApiProfiles();
              return;
            }
            onNavigate(item.key);
          }}
        >
          <View style={styles.settingsNavText}>
            <Text style={[styles.settingsNavTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.settingsNavSubtitle, { color: theme.muted }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
          <DirectionIcon direction="right" color={theme.muted} />
        </Pressable>
      ))}
    </>
  );
}

export const SettingsRootSection = memo(SettingsRootSectionComponent);

const styles = StyleSheet.create({
  settingsNavItem: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsNavText: {
    flex: 1,
  },
  settingsNavTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  settingsNavSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
  },
});
