import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  ClipboardList,
  Clock,
  Droplets,
  Eye,
  EyeOff,
  Hourglass,
  Info,
  LayoutDashboard,
  Lock,
  LogOut,
  LucideIcon,
  LucideProps,
  Mail,
  Moon,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  User,
  WifiOff,
  Wind,
  X,
} from 'lucide-react-native';

import { useTheme } from '@/theme';

export const ICON_MAP = {
  Search,
  Car,
  User,
  LayoutDashboard,
  ClipboardList,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Trash2,
  Clock,
  RefreshCw,
  WifiOff,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Camera,
  AlertCircle,
  Info,
  SlidersHorizontal,
  LogOut,
  Plus,
  Check,
  X,
  // Phase icons
  Hourglass,
  Droplets,
  Sparkles,
  Wind,
  CircleCheck,
} as const;

export type AppIconName = keyof typeof ICON_MAP;

export type IconSize = 16 | 20 | 24 | 32;

export interface IconProps extends Omit<LucideProps, 'size' | 'color' | 'style'> {
  name: AppIconName;
  size?: IconSize | number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Icon({
  name,
  size = 24,
  color,
  strokeWidth = 2,
  style,
  accessibilityLabel,
  ...rest
}: IconProps) {
  const { colors } = useTheme();
  const IconComponent: LucideIcon = ICON_MAP[name];

  if (!IconComponent) {
    return null;
  }

  const iconColor = color ?? colors.text;

  return (
    <IconComponent
      size={size}
      color={iconColor}
      strokeWidth={strokeWidth}
      style={style}
      aria-label={accessibilityLabel}
      {...rest}
    />
  );
}
