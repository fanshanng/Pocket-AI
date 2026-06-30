import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  MAX_DRAWER_EDGE_WIDTH_PX,
  MIN_DRAWER_EDGE_WIDTH_PX,
  normalizeDrawerEdgeWidthPx,
} from '../lib/interactionSettings';
import type { AppTheme } from '../theme';
import type { DrawerOpenGestureMode } from '../types';

type InteractionCopy = {
  interactionPreviewHint: string;
  drawerGestureTitle: string;
  drawerGestureDescription: string;
  drawerGestureModeLabel: string;
  drawerGestureModeFullscreen: string;
  drawerGestureModeEdge: string;
  drawerGesturePreviewTitle: string;
  drawerGesturePreviewFullscreenHint: string;
  drawerGesturePreviewEdgeHint: (widthPx: number) => string;
  drawerEdgeWidthLabel: string;
  drawerEdgeWidthHint: string;
  drawerLabTitle: string;
  drawerLabDescription: string;
  openDrawerLab: string;
};

type Props = {
  theme: AppTheme;
  copy: InteractionCopy;
  drawerOpenGestureMode: DrawerOpenGestureMode;
  drawerEdgeWidthPx: number;
  drawerEdgeWidthInputRef: React.RefObject<TextInput | null>;
  onApplyDrawerOpenGestureMode: (mode: DrawerOpenGestureMode) => void;
  onApplyDrawerEdgeWidthPx: (value: number) => void;
  onFocusDrawerEdgeWidthInput: () => void;
  onOpenDrawerLab: () => void;
};

function SettingsInteractionSectionComponent({
  theme,
  copy,
  drawerOpenGestureMode,
  drawerEdgeWidthPx,
  drawerEdgeWidthInputRef,
  onApplyDrawerOpenGestureMode,
  onApplyDrawerEdgeWidthPx,
  onFocusDrawerEdgeWidthInput,
  onOpenDrawerLab,
}: Props) {
  const [edgeWidthText, setEdgeWidthText] = useState(String(drawerEdgeWidthPx));
  const themedPanel = { backgroundColor: theme.surfaceAlt, borderColor: theme.border };
  const themedSelected = { backgroundColor: theme.selectedSurface, borderColor: theme.selectedBorder };
  const themedFieldInput = { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text };
  const zoneTint = theme.scheme === 'dark' ? 'rgba(96, 165, 250, 0.16)' : 'rgba(37, 99, 235, 0.10)';
  const zoneTrackTint = theme.scheme === 'dark' ? 'rgba(96, 165, 250, 0.08)' : 'rgba(37, 99, 235, 0.06)';
  const modeOptions: Array<{ mode: DrawerOpenGestureMode; label: string }> = [
    { mode: 'fullscreen', label: copy.drawerGestureModeFullscreen },
    { mode: 'edge', label: copy.drawerGestureModeEdge },
  ];
  const livePreviewEdgeWidth =
    edgeWidthText.trim().length > 0
      ? normalizeDrawerEdgeWidthPx(Number.parseInt(edgeWidthText, 10))
      : drawerEdgeWidthPx;
  const zoneLabel =
    drawerOpenGestureMode === 'fullscreen'
      ? copy.drawerGestureModeFullscreen
      : `${copy.drawerGestureModeEdge} · ${livePreviewEdgeWidth}px`;
  const zoneFillWidth = drawerOpenGestureMode === 'fullscreen' ? '100%' : livePreviewEdgeWidth;

  useEffect(() => {
    setEdgeWidthText(String(drawerEdgeWidthPx));
  }, [drawerEdgeWidthPx]);

  // Keep a local text draft so users can clear and retype the px value without numeric coercion
  // rewriting the field on every keypress.
  function commitEdgeWidth(value: string) {
    const parsed = Number.parseInt(value, 10);
    const normalized = normalizeDrawerEdgeWidthPx(Number.isFinite(parsed) ? parsed : drawerEdgeWidthPx);
    setEdgeWidthText(String(normalized));
    if (normalized !== drawerEdgeWidthPx) {
      onApplyDrawerEdgeWidthPx(normalized);
    }
  }

  return (
    <>
      <View style={[styles.infoPanel, themedPanel]}>
        <Text style={[styles.infoPanelText, { color: theme.muted }]}>{copy.interactionPreviewHint}</Text>
      </View>

      <View style={[styles.settingOptionGroup, themedPanel]}>
        <Text style={[styles.sectionLabel, { color: theme.primary }]}>{copy.drawerGestureTitle}</Text>
        <Text style={[styles.sectionDescription, { color: theme.muted }]}>{copy.drawerGestureDescription}</Text>
        <Text style={[styles.fieldLabel, { color: theme.subtle }]}>{copy.drawerGestureModeLabel}</Text>
        {modeOptions.map((option, index) => (
          <Pressable
            key={option.mode}
            style={[
              styles.settingOption,
              { borderBottomColor: index === modeOptions.length - 1 && drawerOpenGestureMode !== 'edge' ? 'transparent' : theme.border },
              drawerOpenGestureMode === option.mode && [styles.settingOptionSelected, themedSelected],
            ]}
            onPress={() => onApplyDrawerOpenGestureMode(option.mode)}
          >
            <View
              style={[
                styles.settingOptionRadio,
                { backgroundColor: theme.surface, borderColor: theme.border },
                drawerOpenGestureMode === option.mode && [styles.settingOptionRadioSelected, { borderColor: theme.primary }],
              ]}
            >
              {drawerOpenGestureMode === option.mode && (
                <View style={[styles.settingOptionRadioDot, { backgroundColor: theme.primary }]} />
              )}
            </View>
            <Text style={[styles.settingOptionText, { color: theme.text }]}>{option.label}</Text>
          </Pressable>
        ))}

        <View style={styles.previewPanel}>
          <Text style={[styles.fieldLabel, { color: theme.subtle }]}>{copy.drawerGesturePreviewTitle}</Text>
          <View style={[styles.zoneTrack, { backgroundColor: zoneTrackTint, borderColor: theme.border }]}>
            <View
              style={[
                styles.zoneFill,
                {
                  width: zoneFillWidth,
                  backgroundColor: zoneTint,
                  borderRightColor: theme.primary,
                },
              ]}
            >
              <Text style={[styles.zoneFillText, { color: theme.primary }]} numberOfLines={1}>
                {zoneLabel}
              </Text>
            </View>
          </View>
          <Text style={[styles.inlineHint, { color: theme.muted }]}>
            {drawerOpenGestureMode === 'fullscreen'
              ? copy.drawerGesturePreviewFullscreenHint
              : copy.drawerGesturePreviewEdgeHint(livePreviewEdgeWidth)}
          </Text>
        </View>

        {drawerOpenGestureMode === 'edge' && (
          <View style={[styles.edgeWidthPanel, { borderTopColor: theme.border }]}>
            <Text style={[styles.fieldLabel, { color: theme.subtle }]}>{copy.drawerEdgeWidthLabel}</Text>
            <TextInput
              ref={drawerEdgeWidthInputRef}
              value={edgeWidthText}
              onChangeText={(value) => setEdgeWidthText(value.replace(/[^0-9]/g, ''))}
              onFocus={onFocusDrawerEdgeWidthInput}
              onBlur={() => commitEdgeWidth(edgeWidthText)}
              style={[styles.fieldInput, themedFieldInput]}
              keyboardType="number-pad"
              placeholder={String(drawerEdgeWidthPx)}
              placeholderTextColor={theme.placeholder}
              maxLength={3}
            />
            <Text style={[styles.inlineHint, { color: theme.muted }]}>
              {copy.drawerEdgeWidthHint} {MIN_DRAWER_EDGE_WIDTH_PX}-{MAX_DRAWER_EDGE_WIDTH_PX}px
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.infoPanel, themedPanel]}>
        <Text style={[styles.infoPanelTitle, { color: theme.text }]}>{copy.drawerLabTitle}</Text>
        <Text style={[styles.infoPanelText, { color: theme.muted }]}>{copy.drawerLabDescription}</Text>
        <Pressable style={[styles.utilityButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={onOpenDrawerLab}>
          <Text style={[styles.utilityButtonText, { color: theme.primary }]}>{copy.openDrawerLab}</Text>
        </Pressable>
      </View>
    </>
  );
}

export const SettingsInteractionSection = memo(SettingsInteractionSectionComponent);

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
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
  },
  settingOptionGroup: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingTop: 13,
    overflow: 'hidden',
    marginTop: 10,
  },
  settingOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 14,
    borderBottomWidth: 1,
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
  previewPanel: {
    paddingTop: 14,
    paddingBottom: 14,
  },
  zoneTrack: {
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  zoneFill: {
    minWidth: 52,
    height: '100%',
    borderRightWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  zoneFillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  edgeWidthPanel: {
    paddingTop: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  fieldInput: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
  },
  inlineHint: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  utilityButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  utilityButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },
});
