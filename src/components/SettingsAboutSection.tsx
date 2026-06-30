import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GitHubIcon } from './AppIcons';
import type { AppTheme } from '../theme';

type AboutCopy = {
  createdBy: string;
  maintainerLabel: string;
  earlyContributorLabel: string;
  versionLabel: string;
  checkLatestVersion: string;
  checkingLatestVersion: string;
};

type Props = {
  theme: AppTheme;
  copy: AboutCopy;
  appVersion: string;
  checkingVersion: boolean;
  onOpenUrl: (url: string) => void;
  onCheckLatestVersion: () => void;
};

const MAINTAINER_URL = 'https://github.com/fanshanng';
const EARLY_CONTRIBUTOR_URL = 'https://github.com/HDdssX';

function SettingsAboutSectionComponent({
  theme,
  copy,
  appVersion,
  checkingVersion,
  onOpenUrl,
  onCheckLatestVersion,
}: Props) {
  const themedPanel = { backgroundColor: theme.surfaceAlt, borderColor: theme.border };
  const themedChip = { backgroundColor: theme.surface, borderColor: theme.border };

  // Keep this section presentational so App.tsx can shrink without changing settings actions.
  return (
    <>
      <View style={[styles.infoPanel, themedPanel]}>
        <Text style={[styles.infoPanelTitle, { color: theme.text }]}>{copy.createdBy}</Text>
        <View style={styles.contactRow}>
          <Pressable
            style={[styles.contactChip, themedChip]}
            onPress={() => onOpenUrl(MAINTAINER_URL)}
          >
            <GitHubIcon color={theme.text} />
            <View style={styles.contactTextBlock}>
              <Text style={[styles.contactText, { color: theme.subtle }]}>fanshanng</Text>
              <Text style={[styles.contactRoleText, { color: theme.muted }]}>
                {copy.maintainerLabel}
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.contactChip, themedChip]}
            onPress={() => onOpenUrl(EARLY_CONTRIBUTOR_URL)}
          >
            <GitHubIcon color={theme.text} />
            <View style={styles.contactTextBlock}>
              <Text style={[styles.contactText, { color: theme.subtle }]}>HDdssX</Text>
              <Text style={[styles.contactRoleText, { color: theme.muted }]}>
                {copy.earlyContributorLabel}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={[styles.infoPanel, themedPanel]}>
        <Text style={[styles.infoPanelTitle, { color: theme.text }]}>{copy.versionLabel}</Text>
        <Text style={[styles.infoPanelText, { color: theme.muted }]}>v{appVersion}</Text>
        <Pressable
          style={[
            styles.utilityButton,
            themedPanel,
            styles.versionButton,
            checkingVersion && styles.disabledAction,
          ]}
          onPress={onCheckLatestVersion}
          disabled={checkingVersion}
        >
          <Text style={[styles.utilityButtonText, { color: theme.primary }]}>
            {checkingVersion ? copy.checkingLatestVersion : copy.checkLatestVersion}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

export const SettingsAboutSection = memo(SettingsAboutSectionComponent);

const styles = StyleSheet.create({
  infoPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 10,
  },
  infoPanelTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  infoPanelText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  contactChip: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  contactTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  contactText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  contactRoleText: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  utilityButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  versionButton: {
    marginTop: 12,
  },
  utilityButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },
  disabledAction: {
    opacity: 0.6,
  },
});
