import { memo, useCallback } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';

import type { AppTheme } from '../theme';
import type { ApiProfile } from '../types';

type ModelPickerCopy = {
  title: string;
  fetchModels: string;
  fetchingModels: string;
  activeApiProfile: string;
  activeModel: string;
  modelsEmpty: string;
};

type Props = {
  profiles: ApiProfile[];
  activeProfileId: string;
  activeModel: string;
  availableModels: string[];
  fetchingModels: boolean;
  theme: AppTheme;
  copy: ModelPickerCopy;
  onFetchModels: () => void;
  onSelectProfile: (profileId: string) => void;
  onLongPressProfile: (profile: ApiProfile) => void;
  onSelectModel: (model: string) => void;
};

function ModelPickerContentComponent({
  profiles,
  activeProfileId,
  activeModel,
  availableModels,
  fetchingModels,
  theme,
  copy,
  onFetchModels,
  onSelectProfile,
  onLongPressProfile,
  onSelectModel,
}: Props) {
  const renderModelOption = useCallback(
    ({ item: model }: { item: string }) => {
      const active = activeModel === model;
      return (
        <Pressable
          style={[
            styles.modelOption,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            active && { backgroundColor: theme.selectedSurface, borderColor: theme.selectedBorder },
          ]}
          onPress={() => onSelectModel(model)}
        >
          <Text
            style={[styles.modelOptionText, { color: active ? theme.selectedText : theme.text }]}
            numberOfLines={1}
          >
            {model}
          </Text>
          {active && (
            <Text style={[styles.modelOptionState, { color: theme.selectedText }]} numberOfLines={1}>
              {copy.activeModel}
            </Text>
          )}
        </Pressable>
      );
    },
    [activeModel, copy.activeModel, onSelectModel, theme]
  );

  // The outer App.tsx still owns sheet animation and provider state; this component only renders picker content.
  return (
    <>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {copy.title}
          </Text>
        </View>
        <Pressable
          style={[styles.fetchButton, fetchingModels && styles.disabled]}
          onPress={onFetchModels}
          disabled={fetchingModels}
        >
          <RefreshCw size={15} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.fetchButtonText} numberOfLines={1}>
            {fetchingModels ? copy.fetchingModels : copy.fetchModels}
          </Text>
        </Pressable>
      </View>

      <View style={styles.profileRail}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.profileScroll}
          contentContainerStyle={styles.profileChipRow}
        >
          {profiles.map((profile) => {
            const active = profile.id === activeProfileId;
            return (
              <Pressable
                key={profile.id}
                style={[
                  styles.profileChip,
                  { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  active && { backgroundColor: theme.selectedSurface, borderColor: theme.selectedBorder },
                ]}
                onPress={() => onSelectProfile(profile.id)}
                onLongPress={() => onLongPressProfile(profile)}
              >
                <Text
                  style={[styles.profileChipTitle, { color: active ? theme.selectedText : theme.text }]}
                  numberOfLines={1}
                >
                  {profile.label}
                </Text>
                <Text
                  style={[styles.profileChipMeta, { color: active ? theme.selectedText : theme.muted }]}
                  numberOfLines={1}
                >
                  {active ? copy.activeApiProfile : profile.model}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        style={styles.modelList}
        contentContainerStyle={styles.modelListContent}
        data={availableModels}
        keyExtractor={(model) => model}
        renderItem={renderModelOption}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.muted }]}>{copy.modelsEmpty}</Text>
        }
      />
    </>
  );
}

export const ModelPickerContent = memo(ModelPickerContentComponent);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  heading: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '800',
  },
  fetchButton: {
    minHeight: 42,
    minWidth: 136,
    maxWidth: 174,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#2563EB',
  },
  fetchButtonText: {
    flexShrink: 1,
    minWidth: 0,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  profileRail: {
    flexShrink: 0,
    minHeight: 76,
    marginBottom: 10,
    zIndex: 1,
  },
  profileScroll: {
    flexGrow: 0,
  },
  profileChipRow: {
    gap: 8,
    paddingTop: 12,
    paddingRight: 2,
    paddingBottom: 10,
    alignItems: 'stretch',
  },
  profileChip: {
    minWidth: 126,
    maxWidth: 158,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 9,
    justifyContent: 'center',
  },
  profileChipTitle: {
    minWidth: 0,
    fontSize: 13,
    fontWeight: '800',
  },
  profileChipMeta: {
    minWidth: 0,
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  modelList: {
    flex: 1,
    minHeight: 0,
  },
  modelListContent: {
    paddingTop: 0,
    paddingBottom: 10,
  },
  modelOption: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modelOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    minWidth: 0,
  },
  modelOptionState: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  disabled: {
    opacity: 0.55,
  },
});
