import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, shadows } from '../constants/theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  showLogo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Stilix',
  subtitle,
  onMenuPress,
  onNotificationPress,
  showLogo = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left side - Menu or Logo */}
        <View style={styles.leftSection}>
          {onMenuPress ? (
            <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
              <Ionicons name="menu-outline" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : null}
          {showLogo && (
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Ionicons name="shirt" size={20} color={colors.white} />
              </View>
              <View>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
            </View>
          )}
        </View>

        {/* Right side - Actions */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
          >
            <Ionicons name="heart-outline" size={24} color={colors.textPrimary} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.small,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    height: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: -2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
});

export default Header;
