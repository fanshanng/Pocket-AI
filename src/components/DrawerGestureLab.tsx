import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import DrawerLayout, { type DrawerState, type DrawerType } from 'react-native-gesture-handler/DrawerLayout';
import { Menu, X } from 'lucide-react-native';

import type { AppTheme } from '../theme';
import type { UiLanguage } from '../types';

type DrawerEdgeMode = 'edge' | 'full';

type Props = {
  language: UiLanguage;
  theme: AppTheme;
  visible: boolean;
  onClose: () => void;
};

const ROWS = Array.from({ length: 18 }, (_, index) => index + 1);
const LONG_FORMULA = String.raw`E = \sum_{i=1}^n \alpha_i x_i^2 + \prod_{j=1}^m \frac{a_j+b_j}{c_j+d_j} + \int_0^\infty e^{-t^2} dt`;
const LONG_CODE =
  "const gestureResult = drawerExperiment.withVeryLongIdentifierName.map((sample) => sample.dx > sample.dy * 1.35 ? 'drawer' : 'scroll');";

export function DrawerGestureLab({ language, theme, visible, onClose }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const drawerRef = useRef<DrawerLayout | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerState>('Idle');
  const [drawerType, setDrawerType] = useState<DrawerType>('slide');
  const [edgeMode, setEdgeMode] = useState<DrawerEdgeMode>('edge');

  const copy = language === 'zh' ? ZH_COPY : EN_COPY;
  const drawerWidth = Math.max(280, Math.round(Math.min(windowWidth * 0.82, 380)));
  const edgeWidth = edgeMode === 'full' ? windowWidth : Math.round(Math.min(96, Math.max(72, windowWidth * 0.18)));

  // Keep the lab isolated so drawer experiments cannot mutate the production chat drawer.
  const drawerKey = `${drawerType}-${edgeMode}-${Math.round(windowWidth)}`;
  const tableRows = useMemo(
    () =>
      ROWS.slice(0, 6).map((row) => ({
        id: row,
        cells: [`#${row}`, copy.tableCell, `x_${row}+y_${row}=z_${row}`, `long-column-${row}-abcdefghijklmnopqrstuvwxyz`],
      })),
    [copy.tableCell]
  );

  if (!visible) {
    return null;
  }

  const selectedChipStyle = { backgroundColor: theme.selectedSurface, borderColor: theme.selectedBorder };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.surface }]}>
        <DrawerLayout
          key={drawerKey}
          ref={drawerRef}
          drawerPosition="left"
          drawerType={drawerType}
          drawerWidth={drawerWidth}
          edgeWidth={edgeWidth}
          minSwipeDistance={8}
          overlayColor={theme.scheme === 'dark' ? 'rgba(15, 23, 42, 0.55)' : 'rgba(15, 23, 42, 0.22)'}
          drawerBackgroundColor={theme.surface}
          keyboardDismissMode="none"
          useNativeAnimations
          onDrawerStateChanged={setDrawerState}
          renderNavigationView={() => (
            <View style={[styles.drawer, { backgroundColor: theme.surface, borderRightColor: theme.border }]}>
              <View style={styles.drawerHeader}>
                <Text style={[styles.drawerTitle, { color: theme.text }]}>{copy.drawerTitle}</Text>
                <Pressable
                  style={[styles.iconButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                  onPress={() => drawerRef.current?.closeDrawer()}
                  accessibilityRole="button"
                  accessibilityLabel={copy.closeDrawer}
                >
                  <X size={17} color={theme.text} strokeWidth={2.5} />
                </Pressable>
              </View>
              <Text style={[styles.drawerMeta, { color: theme.muted }]}>{copy.drawerMeta(drawerType, edgeWidth)}</Text>
              <ScrollView contentContainerStyle={styles.drawerList} showsVerticalScrollIndicator={false}>
                {ROWS.map((item) => (
                  <Pressable
                    key={item}
                    style={[styles.drawerItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                  >
                    <Text style={[styles.drawerItemTitle, { color: theme.text }]}>{copy.sessionTitle(item)}</Text>
                    <Text style={[styles.drawerItemMeta, { color: theme.muted }]}>{copy.sessionMeta}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        >
          <View style={[styles.content, { backgroundColor: theme.surface }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <Pressable
                style={[styles.iconButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                onPress={() => drawerRef.current?.openDrawer()}
                accessibilityRole="button"
                accessibilityLabel={copy.openDrawer}
              >
                <Menu size={19} color={theme.text} strokeWidth={2.5} />
              </Pressable>
              <View style={styles.heading}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                  {copy.title}
                </Text>
                <Text style={[styles.subtitle, { color: theme.muted }]} numberOfLines={1}>
                  {copy.state(drawerState)}
                </Text>
              </View>
              <Pressable
                style={[styles.iconButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={copy.closeLab}
              >
                <X size={18} color={theme.text} strokeWidth={2.5} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.panel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text }]}>{copy.modeTitle}</Text>
                <View style={styles.segmentRow}>
                  {(['edge', 'full'] as DrawerEdgeMode[]).map((mode) => (
                    <Pressable
                      key={mode}
                      style={[
                        styles.segment,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        edgeMode === mode && selectedChipStyle,
                      ]}
                      onPress={() => setEdgeMode(mode)}
                    >
                      <Text style={[styles.segmentText, { color: edgeMode === mode ? theme.selectedText : theme.subtle }]}>
                        {copy.edgeMode[mode]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.segmentRow}>
                  {(['slide', 'front'] as DrawerType[]).map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.segment,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        drawerType === type && selectedChipStyle,
                      ]}
                      onPress={() => setDrawerType(type)}
                    >
                      <Text style={[styles.segmentText, { color: drawerType === type ? theme.selectedText : theme.subtle }]}>
                        {copy.drawerType[type]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[styles.messageBubble, { backgroundColor: theme.userBubble, borderColor: theme.userBorder }]}>
                <Text style={[styles.messageText, { color: theme.text }]}>{copy.messageIntro}</Text>
              </View>

              <View style={[styles.panel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text }]}>{copy.tableTitle}</Text>
                <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator>
                  <View style={styles.table}>
                    {tableRows.map((row) => (
                      <View key={row.id} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                        {row.cells.map((cell) => (
                          <Text key={cell} style={[styles.tableCell, { color: theme.text, borderRightColor: theme.border }]}>
                            {cell}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={[styles.panel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text }]}>{copy.formulaTitle}</Text>
                <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator>
                  <Text style={[styles.monoLine, { color: theme.subtle }]}>{LONG_FORMULA}</Text>
                </ScrollView>
              </View>

              <View style={[styles.panel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Text style={[styles.panelTitle, { color: theme.text }]}>{copy.codeTitle}</Text>
                <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator>
                  <Text style={[styles.monoBlock, { color: theme.subtle }]}>{LONG_CODE}</Text>
                </ScrollView>
              </View>

              {ROWS.slice(6).map((item) => (
                <View key={item} style={[styles.feedItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[styles.feedTitle, { color: theme.text }]}>{copy.feedTitle(item)}</Text>
                  <Text style={[styles.feedText, { color: theme.muted }]}>{copy.feedText}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </DrawerLayout>
      </SafeAreaView>
    </Modal>
  );
}

const ZH_COPY = {
  title: 'Drawer Lab',
  closeLab: '关闭 Drawer Lab',
  openDrawer: '打开实验抽屉',
  closeDrawer: '关闭实验抽屉',
  drawerTitle: '实验菜单',
  drawerMeta: (drawerType: DrawerType, edgeWidth: number) => `模式：${drawerType} · 识别宽度：${edgeWidth}px`,
  state: (state: DrawerState) => `状态：${state}`,
  modeTitle: '手势模式',
  edgeMode: {
    edge: '边缘',
    full: '全屏',
  },
  drawerType: {
    front: '覆盖',
    back: '背后',
    slide: '平移',
  },
  messageIntro: '这里是隔离测试页。上下滑动列表、横滑表格/公式/代码，再从左向右慢滑或快滑打开抽屉。',
  tableTitle: '横向表格',
  formulaTitle: '长公式',
  codeTitle: '长代码',
  tableCell: '测试列',
  sessionTitle: (index: number) => `会话 ${index}`,
  sessionMeta: '用于测试抽屉内滚动',
  feedTitle: (index: number) => `纵向滚动段落 ${index}`,
  feedText: '这是一段用于观察抽屉手势是否抢走上下文滚动的模拟内容。',
};

const EN_COPY = {
  title: 'Drawer Lab',
  closeLab: 'Close Drawer Lab',
  openDrawer: 'Open test drawer',
  closeDrawer: 'Close test drawer',
  drawerTitle: 'Test drawer',
  drawerMeta: (drawerType: DrawerType, edgeWidth: number) => `Mode: ${drawerType} · edge: ${edgeWidth}px`,
  state: (state: DrawerState) => `State: ${state}`,
  modeTitle: 'Gesture mode',
  edgeMode: {
    edge: 'Edge',
    full: 'Full',
  },
  drawerType: {
    front: 'Front',
    back: 'Back',
    slide: 'Slide',
  },
  messageIntro: 'This isolated screen lets us compare drawer feel without replacing the real chat drawer.',
  tableTitle: 'Wide table',
  formulaTitle: 'Long formula',
  codeTitle: 'Long code',
  tableCell: 'test column',
  sessionTitle: (index: number) => `Session ${index}`,
  sessionMeta: 'Drawer scroll test item',
  feedTitle: (index: number) => `Vertical scroll block ${index}`,
  feedText: 'Sample content for checking whether drawer gestures steal normal vertical scrolling.',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  drawer: {
    flex: 1,
    borderRightWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  drawerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
  },
  drawerMeta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  drawerList: {
    gap: 10,
    paddingTop: 16,
    paddingBottom: 22,
  },
  drawerItem: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  drawerItemTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  drawerItemMeta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
    padding: 14,
    paddingBottom: 28,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  panelTitle: {
    marginBottom: 9,
    fontSize: 14,
    fontWeight: '900',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  segment: {
    minWidth: 82,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '800',
  },
  messageBubble: {
    alignSelf: 'flex-end',
    maxWidth: '92%',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  table: {
    minWidth: 820,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableCell: {
    width: 205,
    borderRightWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  monoLine: {
    minWidth: 980,
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
  },
  monoBlock: {
    minWidth: 920,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '700',
  },
  feedItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  feedText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
});
