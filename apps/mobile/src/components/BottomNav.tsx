import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {colors, fonts, shadow} from '../theme';
import {AppText} from './ui';

export type MainTab = 'home' | 'classes' | 'study' | 'my';

const items: Array<{key: MainTab; icon: string; label: string}> = [
  {key: 'home', icon: '⌂', label: '홈'},
  {key: 'classes', icon: '📖', label: '함께 듣기'},
  {key: 'study', icon: '👥', label: '같이 공부'},
  {key: 'my', icon: '☺', label: '마이'},
];

export function BottomNav({
  active,
  onChange,
}: {
  active: MainTab;
  onChange: (tab: MainTab) => void;
}) {
  return (
    <View style={[styles.wrap, shadow]}>
      {items.map(item => {
        const selected = item.key === active;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{selected}}
            key={item.key}
            onPress={() => onChange(item.key)}
            style={({pressed}) => [styles.item, pressed && styles.pressed]}>
            <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
              <AppText style={[styles.icon, selected && styles.iconActive]}>
                {item.icon}
              </AppText>
            </View>
            <AppText
              numberOfLines={1}
              style={[styles.label, selected && styles.labelActive]}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 50,
    left: 14,
    right: 14,
    bottom: 10,
    height: 75,
    borderRadius: 27,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(229, 213, 216, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    height: 63,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 36,
    height: 32,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.pinkSoft,
  },
  icon: {
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 26,
    color: '#8E888E',
  },
  iconActive: {
    color: colors.pink,
  },
  label: {
    marginTop: 1,
    fontFamily: fonts.display,
    fontSize: 9.5,
    lineHeight: 14,
    color: '#8E888E',
  },
  labelActive: {
    color: colors.pink,
  },
  pressed: {
    opacity: 0.65,
  },
});
