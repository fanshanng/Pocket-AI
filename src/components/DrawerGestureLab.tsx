import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import LegacyDrawerLayout, {
  type DrawerState as LegacyDrawerState,
  type DrawerType as LegacyDrawerType,
} from 'react-native-gesture-handler/DrawerLayout';
import ReanimatedDrawerLayout, {
  DrawerKeyboardDismissMode as ReanimatedDrawerKeyboardDismissMode,
  DrawerPosition as ReanimatedDrawerPosition,
  DrawerState as ReanimatedDrawerState,
  DrawerType as ReanimatedDrawerType,
} from 'react-native-gesture-handler/ReanimatedDrawerLayout';
import { Menu, X } from 'lucide-react-native';

import type { AppTheme } from '../theme';
import type { UiLanguage } from '../types';

type DrawerEdgeMode = 'edge' | 'full';
type DrawerEngine = 'legacy' | 'reanimated';
type DrawerMotionMode = 'front' | 'back' | 'slide';
type DrawerStateLabel = 'Idle' | 'Dragging' | 'Settling';
type DrawerControls = {
  openDrawer: () => void;
  closeDrawer: () => void;
};

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
const LEGACY_DRAWER_TYPES: Record<DrawerMotionMode, LegacyDrawerType> = {
  front: 'front',
  back: 'back',
  slide: 'slide',
};
const REANIMATED_DRAWER_TYPES: Record<DrawerMotionMode, ReanimatedDrawerType> = {
  front: ReanimatedDrawerType.FRONT,
  back: ReanimatedDrawerType.BACK,
  slide: ReanimatedDrawerType.SLIDE,
};
const REANIMATED_STATE_LABELS: Record<ReanimatedDrawerState, DrawerStateLabel> = {
  [ReanimatedDrawerState.IDLE]: 'Idle',
  [ReanimatedDrawerState.DRAGGING]: 'Dragging',
  [ReanimatedDrawerState.SETTLING]: 'Settling',
};

export function DrawerGestureLab({ language, theme, visible, onClose }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const drawerRef = useRef<DrawerControls | null>(null);
  const [drawerEngine, setDrawerEngine] = useState<DrawerEngine>('legacy');
  const [drawerState, setDrawerState] = useState<DrawerStateLabel>('Idle');
  const [drawerProgress, setDrawerProgress] = useState(0);
  const [drawerType, setDrawerType] = useState<DrawerMotionMode>('slide');
  const [edgeMode, setEdgeMode] = useState<DrawerEdgeMode>('edge');

  const copy = language === 'zh' ? ZH_COPY : EN_COPY;
  const drawerWidth = Math.max(280, Math.round(Math.min(windowWidth * 0.82, 380)));
  const edgeWidth = edgeMode === 'full' ? windowWidth : Math.round(Math.min(72, Math.max(48, windowWidth * 0.12)));

  // Keep both drawer engines behind the same lab content so only the engine changes.
  const drawerKey = `${drawerEngine}-${drawerType}-${edgeMode}-${Math.round(windowWidth)}`;
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
  const zoneTint = theme.scheme === 'dark' ? 'rgba(96, 165, 250, 0.16)' : 'rgba(37, 99, 235, 0.10)';
  const zoneTrackTint = theme.scheme === 'dark' ? 'rgba(96, 165, 250, 0.08)' : 'rgba(37, 99, 235, 0.06)';
  const zoneMarkerWidth = edgeMode === 'full' ? '100%' : edgeWidth;
  const zoneTrackWidth = edgeMode === 'full' ? '100%' : Math.max(edgeWidth, 56);
  const progressText = `${Math.round(drawerProgress * 100)}%`;

  // Reset derived lab telemetry whenever we swap engines or gesture presets.
  const resetDrawerTelemetry = () => {
    setDrawerProgress(0);
    setDrawerState('Idle');
  };

  const handleDrawerSlide = (position: number) => {
    const rounded = Math.max(0, Math.min(1, Math.round(position * 100) / 100));
    setDrawerProgress((current) => (Math.abs(current - rounded) >= 0.03 ? rounded : current));
  };

  const handleEngineChange = (engine: DrawerEngine) => {
    resetDrawerTelemetry();
    setDrawerEngine(engine);
  };

  const handleEdgeModeChange = (mode: DrawerEdgeMode) => {
    resetDrawerTelemetry();
    setEdgeMode(mode);
  };

  const handleDrawerTypeChange = (type: DrawerMotionMode) => {
    resetDrawerTelemetry();
    setDrawerType(type);
  };

  // Both drawer implementations expose the same open/close surface for the lab controls.
  const setDrawerInstance = (instance: unknown) => {
    drawerRef.current = instance as DrawerControls | null;
  };

  const handleLegacyStateChange = (state: LegacyDrawerState) => {
    setDrawerState(state);
  };

  const handleReanimatedStateChange = (state: ReanimatedDrawerState) => {
    setDrawerState(REANIMATED_STATE_LABELS[state] ?? 'Idle');
  };

  const renderNavigationView = () => (
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
      <Text style={[styles.drawerMeta, { color: theme.muted }]}>
        {copy.drawerMeta(drawerEngine, drawerType, edgeWidth)}
      </Text>
      <ScrollView contentContainerStyle={styles.drawerList} showsVerticalScrollIndicator={false}>
        {ROWS.map((item) => (
          <Pressable key={item} style={[styles.drawerItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Text style={[styles.drawerItemTitle, { color: theme.text }]}>{copy.sessionTitle(item)}</Text>
            <Text style={[styles.drawerItemMeta, { color: theme.muted }]}>{copy.sessionMeta}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderLabContent = () => (
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
            {copy.state(drawerState, progressText)}
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

      <View
        pointerEvents="none"
        style={[
          styles.gestureZoneMarker,
          { width: zoneMarkerWidth, backgroundColor: zoneTint, borderRightColor: theme.primary },
        ]}
      >
        <Text style={[styles.gestureZoneText, { color: theme.primary }]} numberOfLines={1}>
          {copy.zoneLabel(edgeMode, edgeWidth)}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        <View style={[styles.panel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[styles.panelTitle, { color: theme.text }]}>{copy.modeTitle}</Text>
          <Text style={[styles.helpText, { color: theme.muted }]}>{copy.modeIntro}</Text>
          <View style={[styles.zoneTrack, { backgroundColor: zoneTrackTint, borderColor: theme.border }]}>
            <View style={[styles.zoneFill, { width: zoneTrackWidth, backgroundColor: zoneTint, borderRightColor: theme.primary }]}>
              <Text style={[styles.zoneFillText, { color: theme.primary }]} numberOfLines={1}>
                {copy.zoneLabel(edgeMode, edgeWidth)}
              </Text>
            </View>
          </View>
          <View style={styles.metricRow}>
            <View style={[styles.metricPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.metricLabel, { color: theme.muted }]}>{copy.engineMetric}</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{copy.engineMode[drawerEngine]}</Text>
            </View>
            <View style={[styles.metricPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.metricLabel, { color: theme.muted }]}>{copy.edgeMetric}</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{edgeWidth}px</Text>
            </View>
            <View style={[styles.metricPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.metricLabel, { color: theme.muted }]}>{copy.motionMetric}</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{copy.drawerType[drawerType]}</Text>
            </View>
            <View style={[styles.metricPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.metricLabel, { color: theme.muted }]}>{copy.progressMetric}</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{progressText}</Text>
            </View>
          </View>
          <View style={styles.segmentRow}>
            {(['legacy', 'reanimated'] as DrawerEngine[]).map((engine) => (
              <Pressable
                key={engine}
                style={[
                  styles.segment,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  drawerEngine === engine && selectedChipStyle,
                ]}
                onPress={() => handleEngineChange(engine)}
              >
                <Text style={[styles.segmentText, { color: drawerEngine === engine ? theme.selectedText : theme.subtle }]}>
                  {copy.engineMode[engine]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.helpText, { color: theme.muted }]}>{copy.engineHint(drawerEngine)}</Text>
          <View style={styles.segmentRow}>
            {(['edge', 'full'] as DrawerEdgeMode[]).map((mode) => (
              <Pressable
                key={mode}
                style={[
                  styles.segment,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  edgeMode === mode && selectedChipStyle,
                ]}
                onPress={() => handleEdgeModeChange(mode)}
              >
                <Text style={[styles.segmentText, { color: edgeMode === mode ? theme.selectedText : theme.subtle }]}>
                  {copy.edgeMode[mode]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.helpText, { color: theme.muted }]}>{copy.edgeHint(edgeMode, edgeWidth)}</Text>
          <View style={styles.segmentRow}>
            {(['front', 'back', 'slide'] as DrawerMotionMode[]).map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.segment,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  drawerType === type && selectedChipStyle,
                ]}
                onPress={() => handleDrawerTypeChange(type)}
              >
                <Text style={[styles.segmentText, { color: drawerType === type ? theme.selectedText : theme.subtle }]}>
                  {copy.drawerType[type]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.helpText, { color: theme.muted }]}>{copy.motionHint(drawerType)}</Text>
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
  );

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.surface }]}>
        {drawerEngine === 'legacy' ? (
          <LegacyDrawerLayout
            key={drawerKey}
            ref={setDrawerInstance}
            drawerPosition="left"
            drawerType={LEGACY_DRAWER_TYPES[drawerType]}
            drawerWidth={drawerWidth}
            edgeWidth={edgeWidth}
            minSwipeDistance={8}
            overlayColor={theme.scheme === 'dark' ? 'rgba(15, 23, 42, 0.55)' : 'rgba(15, 23, 42, 0.22)'}
            drawerBackgroundColor={theme.surface}
            keyboardDismissMode="none"
            useNativeAnimations
            onDrawerStateChanged={handleLegacyStateChange}
            onDrawerSlide={handleDrawerSlide}
            onDrawerOpen={() => setDrawerProgress(1)}
            onDrawerClose={() => setDrawerProgress(0)}
            renderNavigationView={renderNavigationView}
          >
            {renderLabContent()}
          </LegacyDrawerLayout>
        ) : (
          <ReanimatedDrawerLayout
            key={drawerKey}
            ref={setDrawerInstance}
            drawerPosition={ReanimatedDrawerPosition.LEFT}
            drawerType={REANIMATED_DRAWER_TYPES[drawerType]}
            drawerWidth={drawerWidth}
            edgeWidth={edgeWidth}
            minSwipeDistance={8}
            overlayColor={theme.scheme === 'dark' ? 'rgba(15, 23, 42, 0.55)' : 'rgba(15, 23, 42, 0.22)'}
            drawerBackgroundColor={theme.surface}
            keyboardDismissMode={ReanimatedDrawerKeyboardDismissMode.NONE}
            animationSpeed={16}
            onDrawerStateChanged={handleReanimatedStateChange}
            onDrawerSlide={handleDrawerSlide}
            onDrawerOpen={() => setDrawerProgress(1)}
            onDrawerClose={() => setDrawerProgress(0)}
            renderNavigationView={renderNavigationView}
          >
            {renderLabContent()}
          </ReanimatedDrawerLayout>
        )}
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
  drawerMeta: (drawerEngine: DrawerEngine, drawerType: DrawerMotionMode, edgeWidth: number) =>
    `引擎：${drawerEngine === 'legacy' ? '旧版' : 'Reanimated'} · 运动：${drawerType} · 识别宽度：${edgeWidth}px`,
  state: (state: DrawerStateLabel, progress: string) => `状态：${state} · ${progress}`,
  modeTitle: '手势模式',
  modeIntro: '顶部菜单按钮只测试打开动画；真正的差异请用手指从不同起点右滑，并切换不同抽屉引擎测试。',
  engineMetric: '引擎',
  edgeMetric: '起点',
  motionMetric: '运动',
  progressMetric: '进度',
  engineMode: {
    legacy: '旧版',
    reanimated: 'Reanimated',
  },
  edgeMode: {
    edge: '边缘',
    full: '全屏',
  },
  drawerType: {
    front: '覆盖',
    back: '推开',
    slide: '联动',
  },
  engineHint: (drawerEngine: DrawerEngine) =>
    drawerEngine === 'legacy'
      ? '旧版引擎：更接近实验室最初的 DrawerLayout 行为，用来和新引擎直接对照。'
      : 'Reanimated 引擎：更接近后面可能评估的现代抽屉实现，重点观察慢滑跟手和收尾动画。',
  zoneLabel: (edgeMode: DrawerEdgeMode, edgeWidth: number) => (edgeMode === 'full' ? '全屏可起滑' : `左侧 ${edgeWidth}px`),
  edgeHint: (edgeMode: DrawerEdgeMode, edgeWidth: number) =>
    edgeMode === 'full'
      ? '全屏模式：从屏幕中部或右侧右滑，也应该能触发实验抽屉。'
      : `边缘模式：只有左侧约 ${edgeWidth}px 可起滑，中部右滑应继续留给页面滚动。`,
  motionHint: (drawerType: DrawerMotionMode) =>
    ({
      front: '覆盖：聊天内容基本不动，抽屉覆盖到内容上方。',
      back: '推开：抽屉在背后，聊天内容被推向右侧。',
      slide: '联动：抽屉和聊天内容一起移动，最接近我们想比较的手感。',
    })[drawerType],
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
  drawerMeta: (drawerEngine: DrawerEngine, drawerType: DrawerMotionMode, edgeWidth: number) =>
    `Engine: ${drawerEngine === 'legacy' ? 'Legacy' : 'Reanimated'} · motion: ${drawerType} · edge: ${edgeWidth}px`,
  state: (state: DrawerStateLabel, progress: string) => `State: ${state} · ${progress}`,
  modeTitle: 'Gesture mode',
  modeIntro: 'The menu button only tests open animation; real differences should be checked by changing the drawer engine and swiping from different start points.',
  engineMetric: 'Engine',
  edgeMetric: 'Start',
  motionMetric: 'Motion',
  progressMetric: 'Progress',
  engineMode: {
    legacy: 'Legacy',
    reanimated: 'Reanimated',
  },
  edgeMode: {
    edge: 'Edge',
    full: 'Full',
  },
  drawerType: {
    front: 'Front',
    back: 'Back',
    slide: 'Slide',
  },
  engineHint: (drawerEngine: DrawerEngine) =>
    drawerEngine === 'legacy'
      ? 'Legacy engine: closer to the first DrawerLayout behavior that the lab started with.'
      : 'Reanimated engine: closer to the modern drawer implementation we may evaluate later; watch slow drag feel and settle animation.',
  zoneLabel: (edgeMode: DrawerEdgeMode, edgeWidth: number) => (edgeMode === 'full' ? 'Full-width start' : `Left ${edgeWidth}px`),
  edgeHint: (edgeMode: DrawerEdgeMode, edgeWidth: number) =>
    edgeMode === 'full'
      ? 'Full mode: right swipes from the middle or right side should also open the test drawer.'
      : `Edge mode: only the left ${edgeWidth}px should start the drawer; middle swipes should stay with page scrolling.`,
  motionHint: (drawerType: DrawerMotionMode) =>
    ({
      front: 'Front: content stays mostly still while the drawer covers it.',
      back: 'Back: the drawer stays behind while content is pushed aside.',
      slide: 'Slide: drawer and content move together, closest to the feel we want to compare.',
    })[drawerType],
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
    position: 'relative',
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
  gestureZoneMarker: {
    position: 'absolute',
    top: 58,
    bottom: 0,
    left: 0,
    zIndex: 2,
    borderRightWidth: 2,
    paddingTop: 8,
    paddingLeft: 6,
  },
  gestureZoneText: {
    fontSize: 10,
    fontWeight: '900',
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
  helpText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  zoneTrack: {
    height: 34,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  zoneFill: {
    height: '100%',
    minWidth: 56,
    borderRightWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  zoneFillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  metricPill: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '900',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  segment: {
    flex: 1,
    minWidth: 0,
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
