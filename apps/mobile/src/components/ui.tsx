import React, {PropsWithChildren, ReactNode} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {colors, fonts, shadow, softShadow, type} from '../theme';

export function AppText({
  children,
  style,
  numberOfLines,
}: PropsWithChildren<{
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}>) {
  return (
    <Text numberOfLines={numberOfLines} style={[styles.text, style]}>
      {children}
    </Text>
  );
}

export function Card({
  children,
  style,
}: PropsWithChildren<{style?: StyleProp<ViewStyle>}>) {
  return <View style={[styles.card, softShadow, style]}>{children}</View>;
}

export function Pill({
  children,
  color = colors.pinkDark,
  backgroundColor = colors.pinkSoft,
  style,
}: PropsWithChildren<{
  color?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}>) {
  return (
    <View style={[styles.pill, {backgroundColor}, style]}>
      <AppText style={[styles.pillText, {color}]}>{children}</AppText>
    </View>
  );
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  compact = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'mint' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  const background =
    variant === 'primary'
      ? colors.pink
      : variant === 'mint'
        ? colors.mint
        : variant === 'danger'
          ? colors.danger
          : variant === 'secondary'
            ? colors.lavenderSoft
            : colors.paper;
  const foreground =
    variant === 'primary' || variant === 'mint' || variant === 'danger'
      ? colors.white
      : variant === 'secondary'
        ? '#6B5B93'
        : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        !compact && styles.buttonRegular,
        {backgroundColor: background},
        variant === 'primary' && shadow,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <AppText style={[styles.buttonText, {color: foreground}]}>{title}</AppText>
    </Pressable>
  );
}

export function Field({
  label,
  error,
  style,
  ...props
}: TextInputProps & {
  label?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {label ? <AppText style={styles.label}>{label}</AppText> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.pink}
        style={[styles.input, props.multiline && styles.textArea]}
        {...props}
      />
      {error ? <AppText style={styles.error}>{error}</AppText> : null}
    </View>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionTitle}>
      <AppText style={styles.sectionTitleText}>{title}</AppText>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <AppText style={styles.sectionAction}>{action} ›</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ScreenTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.screenTitle}>
      <View style={styles.screenTitleCopy}>
        <AppText style={type.title}>{title}</AppText>
        {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
      </View>
      {action}
    </View>
  );
}

export function BackHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  action?: ReactNode;
}) {
  return (
    <View style={styles.backHeader}>
      <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}>
        <AppText style={styles.backIcon}>‹</AppText>
      </Pressable>
      <View style={styles.backCopy}>
        <AppText style={styles.backTitle} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={styles.backSubtitle} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action ?? <View style={styles.actionPlaceholder} />}
    </View>
  );
}

export function Sheet({
  visible,
  onClose,
  title,
  children,
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title: string;
}>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <AppText style={styles.sheetTitle}>{title}</AppText>
            <Pressable onPress={onClose} hitSlop={10}>
              <AppText style={styles.close}>×</AppText>
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card style={styles.empty}>
      <AppText style={styles.emptyEmoji}>{emoji}</AppText>
      <AppText style={styles.emptyTitle}>{title}</AppText>
      <AppText style={styles.emptyBody}>{body}</AppText>
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  text: {
    ...type.body,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 199, 204, 0.42)',
    padding: 18,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: {
    fontFamily: fonts.display,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    minHeight: 42,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 17,
  },
  buttonRegular: {
    minHeight: 51,
    borderRadius: 20,
  },
  buttonText: {
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.82,
    transform: [{scale: 0.985}],
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    minHeight: 52,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E9DCDD',
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 108,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 12,
    paddingHorizontal: 3,
  },
  sectionTitleText: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  sectionAction: {
    fontSize: 12,
    color: colors.muted,
  },
  screenTitle: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  screenTitleCopy: {
    flex: 1,
  },
  subtitle: {
    fontFamily: fonts.doodle,
    color: '#B7A2B2',
    fontSize: 16,
    lineHeight: 20,
    marginTop: 2,
  },
  backHeader: {
    minHeight: 62,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  backIcon: {
    fontFamily: fonts.body,
    fontSize: 30,
    lineHeight: 33,
    color: colors.ink,
    marginTop: -2,
  },
  backCopy: {
    flex: 1,
  },
  backTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
  },
  backSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
  },
  actionPlaceholder: {
    width: 38,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(72, 55, 65, 0.34)',
  },
  sheet: {
    maxHeight: '90%',
    minHeight: 260,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    backgroundColor: '#D9C9CF',
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  close: {
    fontFamily: fonts.body,
    fontSize: 28,
    lineHeight: 30,
    color: colors.muted,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyEmoji: {
    fontSize: 35,
    lineHeight: 44,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
    marginTop: 8,
  },
  emptyBody: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 15,
  },
});

