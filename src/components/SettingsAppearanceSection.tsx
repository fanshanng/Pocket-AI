import { memo, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DirectionIcon } from './AppIcons';
import {
  CHAT_BUBBLE_OPACITY_MAX,
  CHAT_BUBBLE_OPACITY_MIN,
  CHAT_BACKGROUND_IMAGE_OPACITY_MAX,
  CHAT_BACKGROUND_IMAGE_OPACITY_MIN,
  getChatBackgroundPresetSwatches,
  getThemePresetSwatches,
  multiplyColorAlpha,
  withColorAlpha,
} from '../theme';
import type { AppTheme, ChatBackgroundImageOpacity, ChatBubbleOpacity } from '../theme';
import type { ChatBackgroundPreset, ThemeMode, ThemePreset } from '../types';

type AppearanceCopy = {
  themeSection: string;
  themeModeLabel: string;
  themePresetLabel: string;
  themePresetClassic: string;
  themePresetGraphite: string;
  themePresetSunset: string;
  themePresetForest: string;
  themePresetRose: string;
  chatBackgroundLabel: string;
  chatBackgroundPlain: string;
  chatBackgroundGrid: string;
  chatBackgroundBands: string;
  chatBackgroundImageLabel: string;
  chatBackgroundImagePick: string;
  chatBackgroundImageRecrop: string;
  chatBackgroundImageClear: string;
  chatBackgroundImageActive: string;
  chatBackgroundImageInactive: string;
  chatBackgroundImageCropHint: string;
  chatBackgroundImageOpacityLabel: string;
  chatBackgroundImageOpacityHint: string;
  chatBackgroundImageOpacityPlaceholder: string;
  chatBubbleOpacityLabel: string;
  chatBubbleOpacityHint: string;
  chatBubbleOpacityPlaceholder: string;
  chatBubblePreviewLabel: string;
  appearanceChooseTitle: string;
  appearanceCollapsedHint: (value: string) => string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
};

type Props = {
  theme: AppTheme;
  copy: AppearanceCopy;
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  chatBackgroundPreset: ChatBackgroundPreset;
  chatBackgroundImageOpacity: ChatBackgroundImageOpacity;
  chatBubbleOpacity: ChatBubbleOpacity;
  chatBackgroundImageUri: string | null;
  hasChatBackgroundImage: boolean;
  onApplyThemeMode: (mode: ThemeMode) => void;
  onApplyThemePreset: (preset: ThemePreset) => void;
  onApplyChatBackgroundImageOpacity: (opacity: ChatBackgroundImageOpacity) => void;
  onApplyChatBubbleOpacity: (opacity: ChatBubbleOpacity) => void;
  onPickChatBackgroundImage: () => void;
  onClearChatBackgroundImage: () => void;
  chatBackgroundImageOpacityInputRef?: React.RefObject<TextInput | null>;
  chatBubbleOpacityInputRef?: React.RefObject<TextInput | null>;
  onFocusChatBackgroundImageOpacityInput?: () => void;
  onFocusChatBubbleOpacityInput?: () => void;
};

type ExpandKey = 'themePreset' | 'background' | 'bubble' | 'themeMode';

const OPACITY_MIN_PERCENT = Math.round(CHAT_BACKGROUND_IMAGE_OPACITY_MIN * 100);
const OPACITY_MAX_PERCENT = Math.round(CHAT_BACKGROUND_IMAGE_OPACITY_MAX * 100);
const BUBBLE_OPACITY_MIN_PERCENT = Math.round(CHAT_BUBBLE_OPACITY_MIN * 100);
const BUBBLE_OPACITY_MAX_PERCENT = Math.round(CHAT_BUBBLE_OPACITY_MAX * 100);
const BACKGROUND_PREVIEW_LAYER_OFFSETS = [
  {
    top: 16,
    left: 18,
    right: 52,
    bottom: 94,
    borderRadius: 22,
  },
  {
    top: 68,
    left: 48,
    right: 18,
    bottom: 46,
    borderRadius: 28,
  },
  {
    top: 124,
    left: 12,
    right: 74,
    bottom: 18,
    borderRadius: 20,
  },
] as const;

function clampPercent(value: number) {
  return Math.max(OPACITY_MIN_PERCENT, Math.min(OPACITY_MAX_PERCENT, value));
}

function clampBubblePercent(value: number) {
  return Math.max(BUBBLE_OPACITY_MIN_PERCENT, Math.min(BUBBLE_OPACITY_MAX_PERCENT, value));
}

function formatOpacityPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatOpacityInput(value: number) {
  return String(clampPercent(Math.round(value * 100)));
}

function parseOpacityPercentInput(value: string): number | null {
  const normalized = value.trim().replace('%', '').replace(',', '.');
  if (normalized.length === 0 || !/^\d{1,3}(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return clampPercent(Math.round(parsed)) / 100;
}

function formatBubbleOpacityInput(value: number) {
  return String(clampBubblePercent(Math.round(value * 100)));
}

function parseBubbleOpacityPercentInput(value: string): number | null {
  const normalized = value.trim().replace('%', '').replace(',', '.');
  if (normalized.length === 0 || !/^\d{1,3}(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return clampBubblePercent(Math.round(parsed)) / 100;
}

function SettingsAppearanceSectionComponent({
  theme,
  copy,
  themeMode,
  themePreset,
  chatBackgroundPreset,
  chatBackgroundImageOpacity,
  chatBubbleOpacity,
  chatBackgroundImageUri,
  hasChatBackgroundImage,
  onApplyThemeMode,
  onApplyThemePreset,
  onApplyChatBackgroundImageOpacity,
  onApplyChatBubbleOpacity,
  onPickChatBackgroundImage,
  onClearChatBackgroundImage,
  chatBackgroundImageOpacityInputRef,
  chatBubbleOpacityInputRef,
  onFocusChatBackgroundImageOpacityInput,
  onFocusChatBubbleOpacityInput,
}: Props) {
  const [expandedKey, setExpandedKey] = useState<ExpandKey | null>(null);
  const [opacityInput, setOpacityInput] = useState(() => formatOpacityInput(chatBackgroundImageOpacity));
  const [bubbleOpacityInput, setBubbleOpacityInput] = useState(() => formatBubbleOpacityInput(chatBubbleOpacity));

  const presetOptions: Array<{ preset: ThemePreset; label: string }> = [
    { preset: 'classic', label: copy.themePresetClassic },
    { preset: 'graphite', label: copy.themePresetGraphite },
    { preset: 'sunset', label: copy.themePresetSunset },
    { preset: 'forest', label: copy.themePresetForest },
    { preset: 'rose', label: copy.themePresetRose },
  ];
  const modeOptions: Array<{ mode: ThemeMode; label: string }> = [
    { mode: 'system', label: copy.themeSystem },
    { mode: 'light', label: copy.themeLight },
    { mode: 'dark', label: copy.themeDark },
  ];

  const themedPanel = { backgroundColor: theme.surfaceAlt, borderColor: theme.border };
  const themedSelected = { backgroundColor: theme.selectedSurface, borderColor: theme.selectedBorder };
  const previewImageOpacity = chatBackgroundImageUri ? chatBackgroundImageOpacity : 1;
  const previewOverlayColor = multiplyColorAlpha(
    theme.chatBackgroundOverlay,
    chatBackgroundImageUri ? 1 - chatBackgroundImageOpacity : 1
  );
  const assistantPreviewBubbleColor = withColorAlpha(theme.assistantBubble, chatBubbleOpacity);
  const assistantPreviewBorderColor = withColorAlpha(theme.assistantBorder, Math.min(1, chatBubbleOpacity + 0.12));
  const userPreviewBubbleColor = withColorAlpha(theme.userBubble, chatBubbleOpacity);
  const userPreviewBorderColor = withColorAlpha(theme.userBorder, Math.min(1, chatBubbleOpacity + 0.12));

  useEffect(() => {
    setOpacityInput(formatOpacityInput(chatBackgroundImageOpacity));
  }, [chatBackgroundImageOpacity]);

  useEffect(() => {
    setBubbleOpacityInput(formatBubbleOpacityInput(chatBubbleOpacity));
  }, [chatBubbleOpacity]);

  function toggleGroup(nextKey: ExpandKey) {
    setExpandedKey((current) => (current === nextKey ? null : nextKey));
  }

  function commitOpacityInput() {
    const nextOpacity = parseOpacityPercentInput(opacityInput);
    if (nextOpacity === null) {
      setOpacityInput(formatOpacityInput(chatBackgroundImageOpacity));
      return;
    }

    setOpacityInput(formatOpacityInput(nextOpacity));
    if (Math.abs(nextOpacity - chatBackgroundImageOpacity) > 0.0001) {
      onApplyChatBackgroundImageOpacity(nextOpacity);
    }
  }

  function commitBubbleOpacityInput() {
    const nextOpacity = parseBubbleOpacityPercentInput(bubbleOpacityInput);
    if (nextOpacity === null) {
      setBubbleOpacityInput(formatBubbleOpacityInput(chatBubbleOpacity));
      return;
    }

    setBubbleOpacityInput(formatBubbleOpacityInput(nextOpacity));
    if (Math.abs(nextOpacity - chatBubbleOpacity) > 0.0001) {
      onApplyChatBubbleOpacity(nextOpacity);
    }
  }

  function renderGroupHeader(title: string, summary: string, groupKey: ExpandKey) {
    const expanded = expandedKey === groupKey;
    return (
      <Pressable
        style={[styles.groupHeader, { borderBottomColor: expanded ? theme.border : 'transparent' }]}
        onPress={() => toggleGroup(groupKey)}
      >
        <View style={styles.groupHeaderText}>
          <Text style={[styles.groupTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.groupSummary, { color: theme.muted }]}>
            {expanded ? copy.appearanceChooseTitle : summary}
          </Text>
        </View>
        <View style={[styles.groupIndicator, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <DirectionIcon direction={expanded ? 'up' : 'down'} color={theme.primary} />
        </View>
      </Pressable>
    );
  }

  const backgroundSummary = hasChatBackgroundImage
    ? `${copy.chatBackgroundImageActive} · ${formatOpacityPercent(chatBackgroundImageOpacity)}`
    : copy.chatBackgroundImageInactive;
  const bubbleSummary = formatOpacityPercent(chatBubbleOpacity);

  function renderRadioRow(active: boolean, label: string, leading?: React.ReactNode) {
    return (
      <>
        {leading}
        <Text style={[styles.settingOptionText, { color: theme.text }]}>{label}</Text>
        <View
          style={[
            styles.settingOptionRadio,
            styles.settingOptionRadioTrailing,
            { backgroundColor: theme.surface, borderColor: theme.border },
            active && [styles.settingOptionRadioSelected, { borderColor: theme.primary }],
          ]}
        >
          {active && <View style={[styles.settingOptionRadioDot, { backgroundColor: theme.primary }]} />}
        </View>
      </>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.settingOptionGroup, themedPanel]}>
        {renderGroupHeader(copy.themePresetLabel, copy.appearanceCollapsedHint(presetOptions.find((option) => option.preset === themePreset)?.label ?? copy.themePresetClassic), 'themePreset')}
        {expandedKey === 'themePreset' && presetOptions.map((option) => {
          const swatches = getThemePresetSwatches(option.preset);
          return (
            <Pressable
              key={option.preset}
              style={[
                styles.settingOption,
                { borderBottomColor: theme.border },
                themePreset === option.preset && [styles.settingOptionSelected, themedSelected],
              ]}
              onPress={() => onApplyThemePreset(option.preset)}
            >
              <View style={styles.themeSwatchRow}>
                {swatches.map((color, index) => (
                  <View
                    key={`${option.preset}-${index}`}
                    style={[styles.themeSwatch, { backgroundColor: color, borderColor: theme.border }]}
                  />
                ))}
              </View>
              {renderRadioRow(themePreset === option.preset, option.label)}
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.settingOptionGroup, themedPanel]}>
        {renderGroupHeader(copy.chatBackgroundLabel, copy.appearanceCollapsedHint(backgroundSummary), 'background')}
        {expandedKey === 'background' && (
          <>
            <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.infoHeader}>
                <Text style={[styles.infoTitle, { color: theme.text }]}>{copy.chatBackgroundImageLabel}</Text>
                <View style={[styles.infoBadge, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[styles.infoBadgeText, { color: hasChatBackgroundImage ? theme.primary : theme.muted }]}>
                    {hasChatBackgroundImage ? copy.chatBackgroundImageActive : copy.chatBackgroundImageInactive}
                  </Text>
                </View>
              </View>
              <View style={[styles.backgroundPreview, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <View style={[styles.backgroundPreviewBase, { backgroundColor: theme.chatBackgroundBase }]}>
                  {getChatBackgroundPresetSwatches(theme, chatBackgroundPreset).map((color, index) => (
                    <View
                      key={`background-layer-${index}`}
                      style={[
                        styles.backgroundPreviewLayer,
                        BACKGROUND_PREVIEW_LAYER_OFFSETS[index],
                        { backgroundColor: color, borderColor: theme.border },
                      ]}
                    />
                  ))}
                </View>
                {chatBackgroundImageUri ? (
                  <>
                    <Image
                      source={{ uri: chatBackgroundImageUri }}
                      style={[styles.backgroundPreviewImage, { opacity: previewImageOpacity }]}
                      resizeMode="cover"
                    />
                    <View style={[styles.backgroundPreviewOverlay, { backgroundColor: previewOverlayColor }]} />
                  </>
                ) : (
                  <View style={styles.backgroundPreviewPlaceholder}>
                    <View style={styles.themeSwatchRow}>
                      {getChatBackgroundPresetSwatches(theme, chatBackgroundPreset).map((color, index) => (
                        <View
                          key={`background-preview-${index}`}
                          style={[styles.previewSwatch, { backgroundColor: color, borderColor: theme.border }]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.backgroundPreviewPlaceholderText, { color: theme.muted }]}>
                      {copy.chatBackgroundImageInactive}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.backgroundImageActions}>
                <Pressable
                  style={[styles.backgroundImageButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                  onPress={onPickChatBackgroundImage}
                >
                  <Text style={[styles.backgroundImageButtonText, { color: theme.primary }]}>
                    {hasChatBackgroundImage ? copy.chatBackgroundImageRecrop : copy.chatBackgroundImagePick}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.backgroundImageButton,
                    { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                    !hasChatBackgroundImage && styles.backgroundImageButtonDisabled,
                  ]}
                  onPress={onClearChatBackgroundImage}
                  disabled={!hasChatBackgroundImage}
                >
                  <Text style={[styles.backgroundImageButtonText, { color: hasChatBackgroundImage ? theme.muted : theme.placeholder }]}>
                    {copy.chatBackgroundImageClear}
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.backgroundImageHint, { color: theme.muted }]}>
                {copy.chatBackgroundImageCropHint}
              </Text>
              <View style={styles.opacityEditor}>
                <View style={[styles.opacityMeter, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[styles.opacityMeterValue, { color: theme.text }]}>
                    {formatOpacityPercent(chatBackgroundImageOpacity)}
                  </Text>
                  <Text style={[styles.opacityMeterLabel, { color: theme.muted }]}>
                    {copy.chatBackgroundImageOpacityLabel}
                  </Text>
                </View>
                <View style={styles.opacityInputColumn}>
                  <Text style={[styles.opacityInputLabel, { color: theme.muted }]}>
                    {copy.chatBackgroundImageOpacityLabel}
                  </Text>
                  <View
                    style={[
                      styles.opacityInputShell,
                      { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                    ]}
                  >
                    <TextInput
                      ref={chatBackgroundImageOpacityInputRef}
                      value={opacityInput}
                      onChangeText={setOpacityInput}
                      onBlur={commitOpacityInput}
                      onSubmitEditing={commitOpacityInput}
                      onFocus={onFocusChatBackgroundImageOpacityInput}
                      keyboardType="numeric"
                      maxLength={3}
                      returnKeyType="done"
                      placeholder={copy.chatBackgroundImageOpacityPlaceholder}
                      placeholderTextColor={theme.placeholder}
                      selectionColor={theme.primary}
                      style={[styles.opacityInput, { color: theme.text }]}
                    />
                    <Text style={[styles.opacityInputSuffix, { color: theme.muted }]}>%</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.opacityHint, { color: theme.muted }]}>
                {copy.chatBackgroundImageOpacityHint}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={[styles.settingOptionGroup, themedPanel]}>
        {renderGroupHeader(copy.chatBubbleOpacityLabel, copy.appearanceCollapsedHint(bubbleSummary), 'bubble')}
        {expandedKey === 'bubble' && (
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.infoHeader}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>{copy.chatBubbleOpacityLabel}</Text>
              <Text style={[styles.infoValue, { color: theme.primary }]}>{formatOpacityPercent(chatBubbleOpacity)}</Text>
            </View>
            <View style={styles.bubblePreviewStack}>
              <View
                style={[
                  styles.bubblePreviewBubble,
                  {
                    backgroundColor: assistantPreviewBubbleColor,
                    borderColor: assistantPreviewBorderColor,
                  },
                ]}
              >
                <Text style={[styles.bubblePreviewLabel, { color: theme.text }]}>{copy.chatBubblePreviewLabel}</Text>
              </View>
              <View
                style={[
                  styles.bubblePreviewBubble,
                  styles.bubblePreviewBubbleUser,
                  {
                    backgroundColor: userPreviewBubbleColor,
                    borderColor: userPreviewBorderColor,
                  },
                ]}
              >
                <Text style={[styles.bubblePreviewLabel, { color: theme.text }]}>{copy.chatBubblePreviewLabel}</Text>
              </View>
            </View>
            <View style={styles.opacityEditor}>
              <View style={[styles.opacityMeter, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Text style={[styles.opacityMeterValue, { color: theme.text }]}>
                  {formatOpacityPercent(chatBubbleOpacity)}
                </Text>
                <Text style={[styles.opacityMeterLabel, { color: theme.muted }]}>
                  {copy.chatBubbleOpacityLabel}
                </Text>
              </View>
              <View style={styles.opacityInputColumn}>
                <Text style={[styles.opacityInputLabel, { color: theme.muted }]}>
                  {copy.chatBubbleOpacityLabel}
                </Text>
                <View
                  style={[
                    styles.opacityInputShell,
                    { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  ]}
                >
                  <TextInput
                    ref={chatBubbleOpacityInputRef}
                    value={bubbleOpacityInput}
                    onChangeText={setBubbleOpacityInput}
                    onBlur={commitBubbleOpacityInput}
                    onSubmitEditing={commitBubbleOpacityInput}
                    onFocus={onFocusChatBubbleOpacityInput}
                    keyboardType="numeric"
                    maxLength={3}
                    returnKeyType="done"
                    placeholder={copy.chatBubbleOpacityPlaceholder}
                    placeholderTextColor={theme.placeholder}
                    selectionColor={theme.primary}
                    style={[styles.opacityInput, { color: theme.text }]}
                  />
                  <Text style={[styles.opacityInputSuffix, { color: theme.muted }]}>%</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.opacityHint, { color: theme.muted }]}>{copy.chatBubbleOpacityHint}</Text>
          </View>
        )}
      </View>

      <View style={[styles.settingOptionGroup, themedPanel]}>
        {renderGroupHeader(copy.themeModeLabel, copy.appearanceCollapsedHint(modeOptions.find((option) => option.mode === themeMode)?.label ?? copy.themeSystem), 'themeMode')}
        {expandedKey === 'themeMode' && modeOptions.map((option) => (
          <Pressable
            key={option.mode}
            style={[
              styles.settingOption,
              { borderBottomColor: theme.border },
              themeMode === option.mode && [styles.settingOptionSelected, themedSelected],
            ]}
            onPress={() => onApplyThemeMode(option.mode)}
          >
            {renderRadioRow(themeMode === option.mode, option.label)}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const SettingsAppearanceSection = memo(SettingsAppearanceSectionComponent);

const styles = StyleSheet.create({
  root: {
    gap: 14,
  },
  settingOptionGroup: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  groupHeader: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  groupHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  groupSummary: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
  },
  groupIndicator: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingOption: {
    minHeight: 56,
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
  settingOptionRadioTrailing: {
    marginLeft: 'auto',
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
    flexShrink: 1,
  },
  themeSwatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 6,
  },
  themeSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8E0EA',
  },
  infoCard: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 2,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  infoBadge: {
    minHeight: 28,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  backgroundImageActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
  },
  backgroundPreview: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    aspectRatio: 9 / 16,
    maxHeight: 208,
  },
  backgroundPreviewImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  backgroundPreviewBase: {
    ...StyleSheet.absoluteFill,
  },
  backgroundPreviewLayer: {
    position: 'absolute',
    borderWidth: 1,
    opacity: 0.94,
  },
  backgroundPreviewOverlay: {
    ...StyleSheet.absoluteFill,
  },
  backgroundPreviewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  backgroundPreviewPlaceholderText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  previewSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },
  backgroundImageButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  backgroundImageButtonDisabled: {
    opacity: 0.48,
  },
  backgroundImageButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  backgroundImageHint: {
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 10,
  },
  bubblePreviewStack: {
    gap: 10,
    paddingTop: 12,
  },
  bubblePreviewBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubblePreviewBubbleUser: {
    alignSelf: 'flex-end',
  },
  bubblePreviewLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  opacityEditor: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 14,
    alignItems: 'stretch',
  },
  opacityMeter: {
    width: 96,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opacityMeterValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  opacityMeterLabel: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  opacityInputColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  opacityInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  opacityInputShell: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  opacityInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: 0,
  },
  opacityInputSuffix: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  opacityHint: {
    fontSize: 12,
    lineHeight: 18,
    paddingTop: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 12,
  },
  chip: {
    minHeight: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: '#EFF6FF',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
