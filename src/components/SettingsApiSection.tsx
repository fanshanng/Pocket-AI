import { memo, type RefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SlideFadePresence } from './SlideFadePresence';
import {
  API_PRESETS,
  API_PROTOCOL_OPTIONS,
  MODEL_SUGGESTIONS,
  apiProtocolLabel,
  getEndpointHint,
  getModelHint,
  getProtocolStorageHint,
  getReasoningEffortHint,
} from '../lib/models';
import { inferReasoningEffortOptions, uniqueStrings } from '../lib/profiles';
import type { AppTheme } from '../theme';
import type { ApiProfile, ApiProtocol, ReasoningEffort, UiLanguage } from '../types';

type ApiCopy = {
  apiProfilesTitle: string;
  newApiProfile: string;
  apiProfilesSubtitle: string;
  activeApiProfile: string;
  basicApiSettings: string;
  profileLabel: string;
  apiPreset: string;
  connectionSettings: string;
  testingApiConnection: string;
  testApiConnection: string;
  deleteApiProfile: string;
  endpointMode: string;
  baseUrl: string;
  baseUrlHint: string;
  insecureHttpWarning: string;
  apiKey: string;
  modelAndReasoning: string;
  model: string;
  fetchingModels: string;
  fetchModels: string;
  reasoningEffort: string;
  currentValue: string;
  fetchReasoningEfforts: string;
  reasoningEffortsReady: string;
  reasoningEffortsUnavailable: string;
  advancedApiSettings: string;
  hideAdvancedSettings: string;
  showAdvancedSettings: string;
  webSearch: string;
  webSearchEnabled: string;
  webSearchDisabled: string;
  webSearchHint: string;
  responseStorage: string;
  storageEnabled: string;
  storageDisabled: string;
  projectId: string;
  organization: string;
  systemPrompt: string;
  advancedConfigHint: string;
};

type Props = {
  theme: AppTheme;
  copy: ApiCopy;
  uiLanguage: UiLanguage;
  profiles: ApiProfile[];
  activeProfileId: string;
  draftProfile: ApiProfile;
  apiKey: string;
  availableModels: string[];
  testingProfile: boolean;
  savingProfile: boolean;
  fetchingModels: boolean;
  usingInsecureHttp: boolean;
  advancedApiSettingsOpen: boolean;
  reasoningEffortOptions: ReasoningEffort[];
  reasoningEffortsFetched: boolean;
  supportsWebSearch: boolean;
  advancedSummary: string;
  profileLabelInputRef: RefObject<TextInput | null>;
  baseUrlInputRef: RefObject<TextInput | null>;
  apiKeyInputRef: RefObject<TextInput | null>;
  modelInputRef: RefObject<TextInput | null>;
  projectIdInputRef: RefObject<TextInput | null>;
  organizationInputRef: RefObject<TextInput | null>;
  systemPromptInputRef: RefObject<TextInput | null>;
  onCreateNewApiProfile: () => void;
  onSelectDraftApiProfile: (profile: ApiProfile) => Promise<void> | void;
  onFocusApiProfileInput: (inputRef: RefObject<TextInput | null>) => void;
  onBlurApiProfileInput: () => void;
  onChangeProfileLabel: (value: string) => void;
  onApplyPreset: (preset: (typeof API_PRESETS)[number]) => void;
  onTestApiProfile: () => void;
  onConfirmDeleteApiProfile: (profileId: string) => void;
  onSelectProtocol: (protocol: ApiProtocol) => void;
  onChangeBaseUrl: (value: string) => void;
  onChangeApiKey: (value: string) => void;
  onChangeModel: (value: string) => void;
  onFetchModels: () => void;
  onSelectModel: (model: string) => void;
  onRefreshReasoningEfforts: () => void;
  onApplyReasoningEffort: (effort: ReasoningEffort) => void;
  onToggleAdvancedApiSettings: () => void;
  onToggleWebSearch: () => void;
  onToggleStoreResponses: () => void;
  onChangeProjectId: (value: string) => void;
  onChangeOrganization: (value: string) => void;
  onChangeSystemPrompt: (value: string) => void;
};

function SettingsApiSectionComponent({
  theme,
  copy,
  uiLanguage,
  profiles,
  activeProfileId,
  draftProfile,
  apiKey,
  availableModels,
  testingProfile,
  savingProfile,
  fetchingModels,
  usingInsecureHttp,
  advancedApiSettingsOpen,
  reasoningEffortOptions,
  reasoningEffortsFetched,
  supportsWebSearch,
  advancedSummary,
  profileLabelInputRef,
  baseUrlInputRef,
  apiKeyInputRef,
  modelInputRef,
  projectIdInputRef,
  organizationInputRef,
  systemPromptInputRef,
  onCreateNewApiProfile,
  onSelectDraftApiProfile,
  onFocusApiProfileInput,
  onBlurApiProfileInput,
  onChangeProfileLabel,
  onApplyPreset,
  onTestApiProfile,
  onConfirmDeleteApiProfile,
  onSelectProtocol,
  onChangeBaseUrl,
  onChangeApiKey,
  onChangeModel,
  onFetchModels,
  onSelectModel,
  onRefreshReasoningEfforts,
  onApplyReasoningEffort,
  onToggleAdvancedApiSettings,
  onToggleWebSearch,
  onToggleStoreResponses,
  onChangeProjectId,
  onChangeOrganization,
  onChangeSystemPrompt,
}: Props) {
  const themedPanel = { backgroundColor: theme.surfaceAlt, borderColor: theme.border };
  const themedSelected = { backgroundColor: theme.selectedSurface, borderColor: theme.selectedBorder };
  const themedFieldInput = { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text };
  const themedPrimaryAction = { backgroundColor: theme.composerButton };
  const themedPrimaryActionText = { color: theme.composerButtonText };
  const themedSubtleText = { color: theme.subtle };
  const themedMutedText = { color: theme.muted };
  const themedSelectedText = { color: theme.selectedText };
  const modelOptions = uniqueStrings([
    draftProfile.model,
    ...(draftProfile.cachedModels ?? []),
    ...availableModels,
    ...MODEL_SUGGESTIONS,
  ]);
  const reasoningHint =
    reasoningEffortsFetched
      ? inferReasoningEffortOptions(draftProfile).length > 1
        ? copy.reasoningEffortsReady
        : copy.reasoningEffortsUnavailable
      : getReasoningEffortHint(draftProfile.model, draftProfile.reasoningEffort, uiLanguage);

  return (
    <>
      <View style={styles.formSectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.primary }]}>{copy.apiProfilesTitle}</Text>
        <Pressable style={[styles.modalPrimarySmall, themedPrimaryAction]} onPress={onCreateNewApiProfile}>
          <Text style={[styles.modalPrimaryText, themedPrimaryActionText]}>{copy.newApiProfile}</Text>
        </Pressable>
      </View>
      <Text style={[styles.inlineHint, themedMutedText]}>{copy.apiProfilesSubtitle}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileChipRow}>
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;
          const isEditing = profile.id === draftProfile.id;
          return (
            <Pressable
              key={profile.id}
              style={[styles.profileChip, themedPanel, isEditing && [styles.profileChipSelected, themedSelected]]}
              onPress={() => {
                void onSelectDraftApiProfile(profile);
              }}
            >
              <Text style={[styles.profileChipTitle, { color: theme.text }, isEditing && themedSelectedText]}>
                {profile.label}
              </Text>
              <Text
                style={[styles.profileChipMeta, { color: theme.muted }, isEditing && themedSelectedText]}
                numberOfLines={1}
              >
                {isActive ? copy.activeApiProfile : profile.model}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.formSectionHeader}>
        <Text style={[styles.sectionLabel, { color: theme.primary }]}>{copy.basicApiSettings}</Text>
        <Text style={[styles.sectionValue, themedMutedText]} numberOfLines={1}>
          {draftProfile.model}
        </Text>
      </View>
      <View style={[styles.settingsGroupCard, themedPanel]}>
        <Text style={[styles.settingsGroupTitle, { color: theme.text }]}>{copy.basicApiSettings}</Text>
        <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.profileLabel}</Text>
        <TextInput
          ref={profileLabelInputRef}
          value={draftProfile.label}
          onChangeText={onChangeProfileLabel}
          onFocus={() => onFocusApiProfileInput(profileLabelInputRef)}
          onBlur={onBlurApiProfileInput}
          style={[styles.fieldInput, themedFieldInput]}
          placeholder="My API"
          placeholderTextColor={theme.placeholder}
        />

        <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.apiPreset}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
          {API_PRESETS.map((preset) => {
            const selected =
              draftProfile.apiProtocol === preset.apiProtocol &&
              draftProfile.baseUrl === preset.baseUrl &&
              draftProfile.model === preset.model;
            return (
              <Pressable
                key={preset.id}
                style={[styles.suggestionChip, themedPanel, selected && [styles.selectedChip, themedSelected]]}
                onPress={() => onApplyPreset(preset)}
              >
                <Text style={[styles.suggestionChipText, themedSubtleText, selected && themedSelectedText]}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.settingsGroupCard, themedPanel]}>
        <View style={styles.settingsGroupHeader}>
          <Text style={[styles.settingsGroupTitle, { color: theme.text }]}>{copy.connectionSettings}</Text>
          <Text style={[styles.settingsGroupMeta, themedMutedText]} numberOfLines={1}>
            {apiProtocolLabel(draftProfile.apiProtocol, uiLanguage)}
          </Text>
        </View>
        <View style={styles.profileUtilityRow}>
          <Pressable
            style={[styles.secondaryActionCard, themedPanel, testingProfile && styles.disabledAction]}
            onPress={onTestApiProfile}
            disabled={testingProfile || savingProfile}
          >
            <Text style={[styles.secondaryActionLabel, { color: theme.text }]}>
              {testingProfile ? copy.testingApiConnection : copy.testApiConnection}
            </Text>
          </Pressable>
          <Pressable
            style={styles.dangerButtonCompact}
            onPress={() => onConfirmDeleteApiProfile(draftProfile.id)}
            disabled={testingProfile || savingProfile}
          >
            <Text style={styles.dangerButtonText}>{copy.deleteApiProfile}</Text>
          </Pressable>
        </View>

        <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.endpointMode}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
          {API_PROTOCOL_OPTIONS.map((protocol) => (
            <Pressable
              key={protocol}
              style={[
                styles.suggestionChip,
                themedPanel,
                draftProfile.apiProtocol === protocol && [styles.selectedChip, themedSelected],
              ]}
              onPress={() => onSelectProtocol(protocol)}
            >
              <Text
                style={[
                  styles.suggestionChipText,
                  themedSubtleText,
                  draftProfile.apiProtocol === protocol && themedSelectedText,
                ]}
              >
                {apiProtocolLabel(protocol, uiLanguage)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={[styles.inlineHint, themedMutedText]}>{getEndpointHint(draftProfile.apiProtocol, uiLanguage)}</Text>

        <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.baseUrl}</Text>
        <TextInput
          ref={baseUrlInputRef}
          value={draftProfile.baseUrl}
          onChangeText={onChangeBaseUrl}
          onFocus={() => onFocusApiProfileInput(baseUrlInputRef)}
          onBlur={onBlurApiProfileInput}
          style={[styles.fieldInput, themedFieldInput]}
          autoCapitalize="none"
          placeholder="https://api.openai.com/v1"
          placeholderTextColor={theme.placeholder}
        />
        <Text style={[styles.inlineHint, themedMutedText]}>{copy.baseUrlHint}</Text>
        {usingInsecureHttp && <Text style={styles.warningText}>{copy.insecureHttpWarning}</Text>}

        <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.apiKey}</Text>
        <TextInput
          ref={apiKeyInputRef}
          value={apiKey}
          onChangeText={onChangeApiKey}
          onFocus={() => onFocusApiProfileInput(apiKeyInputRef)}
          onBlur={onBlurApiProfileInput}
          style={[styles.fieldInput, themedFieldInput]}
          autoCapitalize="none"
          secureTextEntry
          placeholder="sk-..."
          placeholderTextColor={theme.placeholder}
        />
      </View>

      <View style={[styles.settingsGroupCard, themedPanel]}>
        <View style={styles.settingsGroupHeader}>
          <Text style={[styles.settingsGroupTitle, { color: theme.text }]}>{copy.modelAndReasoning}</Text>
          <Text style={[styles.settingsGroupMeta, themedMutedText]} numberOfLines={1}>
            {draftProfile.model}
          </Text>
        </View>
        <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.model}</Text>
        <TextInput
          ref={modelInputRef}
          value={draftProfile.model}
          onChangeText={onChangeModel}
          onFocus={() => onFocusApiProfileInput(modelInputRef)}
          onBlur={onBlurApiProfileInput}
          style={[styles.fieldInput, themedFieldInput]}
          autoCapitalize="none"
          placeholder="gpt-5.4"
          placeholderTextColor={theme.placeholder}
        />
        <Pressable
          style={[styles.inlineUtilityButton, themedPanel, fetchingModels && styles.disabledAction]}
          onPress={onFetchModels}
          disabled={fetchingModels}
        >
          <Text style={[styles.inlineUtilityButtonText, { color: theme.primary }]}>
            {fetchingModels ? copy.fetchingModels : copy.fetchModels}
          </Text>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
          {modelOptions.map((model) => (
            <Pressable
              key={model}
              style={[
                styles.suggestionChip,
                themedPanel,
                draftProfile.model === model && [styles.selectedChip, themedSelected],
              ]}
              onPress={() => onSelectModel(model)}
            >
              <Text
                style={[
                  styles.suggestionChipText,
                  themedSubtleText,
                  draftProfile.model === model && themedSelectedText,
                ]}
              >
                {model}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={[styles.inlineHint, themedMutedText]}>{getModelHint(draftProfile.model, uiLanguage)}</Text>

        <View style={[styles.compactSettingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.compactSettingHeader}>
            <View style={styles.compactSettingTitleWrap}>
              <Text style={[styles.compactSettingTitle, { color: theme.text }]}>{copy.reasoningEffort}</Text>
              <Text style={[styles.compactSettingSubtitle, themedMutedText]}>
                {copy.currentValue}: {draftProfile.reasoningEffort}
              </Text>
            </View>
            <Pressable
              style={[styles.inlineUtilityButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              onPress={onRefreshReasoningEfforts}
            >
              <Text style={[styles.inlineUtilityButtonText, { color: theme.primary }]}>
                {copy.fetchReasoningEfforts}
              </Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
            {reasoningEffortOptions.map((effort) => (
              <Pressable
                key={effort}
                style={[
                  styles.suggestionChip,
                  { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  draftProfile.reasoningEffort === effort && [styles.selectedChip, themedSelected],
                ]}
                onPress={() => onApplyReasoningEffort(effort)}
              >
                <Text
                  style={[
                    styles.suggestionChipText,
                    themedSubtleText,
                    draftProfile.reasoningEffort === effort && themedSelectedText,
                  ]}
                >
                  {effort}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={[styles.inlineHint, themedMutedText]}>{reasoningHint}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.advancedToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={onToggleAdvancedApiSettings}
      >
        <View style={styles.advancedToggleTextWrap}>
          <Text style={[styles.advancedToggleTitle, { color: theme.text }]}>{copy.advancedApiSettings}</Text>
          <Text style={[styles.advancedToggleSubtitle, themedMutedText]} numberOfLines={1}>
            {advancedSummary}
          </Text>
        </View>
        <Text style={[styles.advancedToggleAction, { color: theme.primary }]}>
          {advancedApiSettingsOpen ? copy.hideAdvancedSettings : copy.showAdvancedSettings}
        </Text>
      </Pressable>

      <SlideFadePresence visible={advancedApiSettingsOpen} from="top" style={[styles.advancedPanel, themedPanel]}>
        {draftProfile.apiProtocol === 'responses' && (
          <>
            {supportsWebSearch && (
              <>
                <View style={styles.switchRow}>
                  <View style={styles.switchTextWrap}>
                    <Text style={[styles.switchTitle, { color: theme.text }]}>{copy.webSearch}</Text>
                    <Text style={[styles.switchSubtitle, themedMutedText]}>
                      {draftProfile.webSearchEnabled ? copy.webSearchEnabled : copy.webSearchDisabled}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.compactSwitch, draftProfile.webSearchEnabled && styles.compactSwitchOn]}
                    onPress={onToggleWebSearch}
                  >
                    <View style={[styles.compactSwitchThumb, draftProfile.webSearchEnabled && styles.compactSwitchThumbOn]} />
                  </Pressable>
                </View>
                <Text style={[styles.inlineHint, themedMutedText]}>{copy.webSearchHint}</Text>
              </>
            )}
            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={[styles.switchTitle, { color: theme.text }]}>{copy.responseStorage}</Text>
                <Text style={[styles.switchSubtitle, themedMutedText]}>
                  {draftProfile.storeResponses ? copy.storageEnabled : copy.storageDisabled}
                </Text>
              </View>
              <Pressable
                style={[styles.compactSwitch, draftProfile.storeResponses && styles.compactSwitchOn]}
                onPress={onToggleStoreResponses}
              >
                <View style={[styles.compactSwitchThumb, draftProfile.storeResponses && styles.compactSwitchThumbOn]} />
              </Pressable>
            </View>
            <Text style={[styles.inlineHint, themedMutedText]}>
              {getProtocolStorageHint(draftProfile.apiProtocol, draftProfile.storeResponses, uiLanguage)}
            </Text>
          </>
        )}

        <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.projectId}</Text>
        <TextInput
          ref={projectIdInputRef}
          value={draftProfile.projectId}
          onChangeText={onChangeProjectId}
          onFocus={() => onFocusApiProfileInput(projectIdInputRef)}
          onBlur={onBlurApiProfileInput}
          style={[styles.fieldInput, themedFieldInput]}
          autoCapitalize="none"
          placeholder="Optional"
          placeholderTextColor={theme.placeholder}
        />

        <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.organization}</Text>
        <TextInput
          ref={organizationInputRef}
          value={draftProfile.organization}
          onChangeText={onChangeOrganization}
          onFocus={() => onFocusApiProfileInput(organizationInputRef)}
          onBlur={onBlurApiProfileInput}
          style={[styles.fieldInput, themedFieldInput]}
          autoCapitalize="none"
          placeholder="Optional"
          placeholderTextColor={theme.placeholder}
        />

        <Text style={[styles.fieldLabel, themedSubtleText]}>{copy.systemPrompt}</Text>
        <TextInput
          ref={systemPromptInputRef}
          value={draftProfile.systemPrompt}
          onChangeText={onChangeSystemPrompt}
          onFocus={() => onFocusApiProfileInput(systemPromptInputRef)}
          onBlur={onBlurApiProfileInput}
          style={[styles.fieldInput, themedFieldInput, styles.fieldInputMultiline]}
          multiline
          placeholder="Optional long-lived instruction"
          placeholderTextColor={theme.placeholder}
        />
        <Text style={[styles.inlineHint, themedMutedText]}>{copy.advancedConfigHint}</Text>
      </SlideFadePresence>
    </>
  );
}

export const SettingsApiSection = memo(SettingsApiSectionComponent);

const styles = StyleSheet.create({
  formSectionHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
  },
  sectionLabel: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionValue: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  inlineHint: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  modalPrimarySmall: {
    borderRadius: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  profileChipRow: {
    gap: 8,
    paddingBottom: 12,
  },
  profileChip: {
    width: 138,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  profileChipSelected: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  profileChipTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },
  profileChipMeta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  settingsGroupCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 14,
  },
  settingsGroupTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  settingsGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  settingsGroupMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 8,
  },
  fieldInput: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  fieldInputMultiline: {
    minHeight: 108,
    textAlignVertical: 'top',
  },
  suggestionRow: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  suggestionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedChip: {
    backgroundColor: '#DBEAFE',
    borderColor: '#60A5FA',
  },
  profileUtilityRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  secondaryActionCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  secondaryActionLabel: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  dangerButtonCompact: {
    flex: 1,
    marginTop: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dangerButtonText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '800',
  },
  inlineUtilityButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  inlineUtilityButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },
  compactSettingCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 14,
  },
  compactSettingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  compactSettingTitleWrap: {
    flex: 1,
  },
  compactSettingTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  compactSettingSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  advancedToggle: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  advancedToggleTextWrap: {
    flex: 1,
  },
  advancedToggleTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  advancedToggleSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  advancedToggleAction: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  advancedPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  switchRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  switchSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  compactSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
    padding: 3,
    justifyContent: 'center',
  },
  compactSwitchOn: {
    backgroundColor: '#2563EB',
  },
  compactSwitchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  compactSwitchThumbOn: {
    alignSelf: 'flex-end',
  },
  warningText: {
    color: '#B45309',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  disabledAction: {
    opacity: 0.45,
  },
});
