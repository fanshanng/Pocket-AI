import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit3,
  Menu,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  Send,
  Settings,
  Square,
  Trash2,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

const rotateDownStyle = {
  transform: [{ rotate: '180deg' as const }],
};

export function MenuIcon({ color = '#1F2937' }: { color?: string }) {
  return <Menu size={20} color={color} strokeWidth={2.3} />;
}

export function PlusIcon({ light = false, color }: { light?: boolean; color?: string }) {
  return <Plus size={20} color={color ?? (light ? '#FFFFFF' : '#1F2937')} strokeWidth={2.4} />;
}

export function MoreIcon({ color = '#1F2937' }: { color?: string }) {
  return <MoreHorizontal size={21} color={color} strokeWidth={2.4} />;
}

export function SearchIcon({ color = '#111827' }: { color?: string }) {
  return <Search size={20} color={color} strokeWidth={2.3} />;
}

export function SettingsIcon({ color = '#111827' }: { color?: string }) {
  return <Settings size={20} color={color} strokeWidth={2.3} />;
}

export function DirectionIcon({
  direction,
  light = false,
  color: iconColor,
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  light?: boolean;
  color?: string;
}) {
  const color = iconColor ?? (light ? '#FFFFFF' : '#334155');
  if (direction === 'left') return <ChevronLeft size={18} color={color} strokeWidth={2.5} />;
  if (direction === 'right') return <ChevronRight size={18} color={color} strokeWidth={2.5} />;
  return <ChevronUp size={18} color={color} strokeWidth={2.5} style={direction === 'down' ? rotateDownStyle : undefined} />;
}

export function SendIcon({ light = true }: { light?: boolean }) {
  return <Send size={16} color={light ? '#FFFFFF' : '#2563EB'} strokeWidth={2.4} />;
}

export function StopIcon() {
  return <Square size={13} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2.2} />;
}

export function CheckIcon() {
  return <Check size={15} color="#FFFFFF" strokeWidth={3} />;
}

export function PinIcon({ light = false }: { light?: boolean }) {
  return <Pin size={16} color={light ? '#E5E7EB' : '#2563EB'} strokeWidth={2.4} />;
}

export function EditIcon() {
  return <Edit3 size={17} color="#E5E7EB" strokeWidth={2.3} />;
}

export function TrashIcon() {
  return <Trash2 size={17} color="#FCA5A5" strokeWidth={2.3} />;
}

export function GitHubIcon({ color = '#24292F' }: { color?: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 98 96" fill="none">
      <Path
        fill={color}
        d="M48.9 0C21.9 0 0 22 0 49.1c0 21.7 14 40 33.4 46.5 2.4.5 3.3-1.1 3.3-2.4v-8.4c-13.6 3-16.5-6.6-16.5-6.6-2.2-5.7-5.4-7.2-5.4-7.2-4.4-3 .3-2.9.3-2.9 4.9.3 7.5 5.1 7.5 5.1 4.3 7.5 11.4 5.3 14.2 4.1.4-3.2 1.7-5.3 3.1-6.6-10.9-1.2-22.3-5.5-22.3-24.3 0-5.4 1.9-9.8 5-13.2-.5-1.2-2.2-6.2.5-13 0 0 4.1-1.3 13.4 5 3.9-1.1 8.1-1.6 12.3-1.6s8.4.6 12.3 1.6c9.3-6.3 13.4-5 13.4-5 2.7 6.8 1 11.8.5 13 3.1 3.4 5 7.8 5 13.2 0 18.9-11.5 23.1-22.4 24.3 1.8 1.5 3.3 4.5 3.3 9.1v13.4c0 1.3.9 2.9 3.4 2.4C84 89.1 98 70.7 98 49.1 97.9 22 75.9 0 48.9 0Z"
      />
    </Svg>
  );
}
