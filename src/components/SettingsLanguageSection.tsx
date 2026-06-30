import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppTheme } from '../theme';
import type { UiLanguage } from '../types';

type LanguageCopy = {
  chinese: string;
  english: string;
};

type Props = {
  theme: AppTheme;
  copy: LanguageCopy;
  uiLanguage: UiLanguage;
  onApplyUiLanguage: (language: UiLanguage) => void;
};

function SettingsLanguageSectionComponent({
  theme,
  copy,
  uiLanguage,
  onApplyUiLanguage,
}: Props) {
  const themedGroup = { backgroundColor: theme.surfaceAlt, borderColor: theme.border };
  const themedSelected = { backgroundColor: theme.selectedSurface, borderColor: theme.selectedBorder };
  const themedRadio = { backgroundColor: theme.surface, borderColor: theme.border };
  const themedRadioSelected = { borderColor: theme.primary };
  const themedDot = { backgroundColor: theme.primary };

  return (
    <View style={[styles.settingOptionGroup, themedGroup]}>
      <Pressable
        style={[
          styles.settingOption,
          { borderBottomColor: theme.border },
          uiLanguage === 'zh' && [styles.settingOptionSelected, themedSelected],
        ]}
        onPress={() => onApplyUiLanguage('zh')}
      >
        <View
          style={[
            styles.settingOptionRadio,
            themedRadio,
            uiLanguage === 'zh' && [styles.settingOptionRadioSelected, themedRadioSelected],
          ]}
        >
          {uiLanguage === 'zh' && <View style={[styles.settingOptionRadioDot, themedDot]} />}
        </View>
        <Text style={[styles.settingOptionText, { color: theme.text }]}>{copy.chinese}</Text>
      </Pressable>

      <Pressable
        style={[
          styles.settingOption,
          { borderBottomColor: theme.border },
          uiLanguage === 'en' && [styles.settingOptionSelected, themedSelected],
        ]}
        onPress={() => onApplyUiLanguage('en')}
      >
        <View
          style={[
            styles.settingOptionRadio,
            themedRadio,
            uiLanguage === 'en' && [styles.settingOptionRadioSelected, themedRadioSelected],
          ]}
        >
          {uiLanguage === 'en' && <View style={[styles.settingOptionRadioDot, themedDot]} />}
        </View>
        <Text style={[styles.settingOptionText, { color: theme.text }]}>{copy.english}</Text>
      </Pressable>
    </View>
  );
}

export const SettingsLanguageSection = memo(SettingsLanguageSectionComponent);

const styles = StyleSheet.create({
  settingOptionGroup: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  settingOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  settingOptionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  settingOptionRadioSelected: {
    borderColor: '#2563EB',
  },
  settingOptionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  settingOptionText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
});
