import {Platform, TextStyle, ViewStyle} from 'react-native';

export const colors = {
  canvas: '#FCF4EF',
  paper: '#FFFDFC',
  white: '#FFFFFF',
  ink: '#544E59',
  text: '#6B6470',
  muted: '#A99FA8',
  line: '#F0E5E4',
  pink: '#EE5E86',
  pinkDark: '#D9527A',
  pinkSoft: '#FBDCE6',
  blush: '#FDE4EC',
  peach: '#FBEAD9',
  lavender: '#B49CE0',
  lavenderSoft: '#F1E9FB',
  mint: '#5FC08D',
  mintDark: '#3F8A62',
  mintSoft: '#E1F3E9',
  blue: '#7CB3E8',
  yellow: '#FBD46B',
  danger: '#D85D67',
} as const;

export const fonts = {
  display: Platform.select({ios: 'Jua', android: 'Jua', default: 'sans-serif'}),
  body: Platform.select({
    ios: 'GowunDodum',
    android: 'GowunDodum',
    default: 'sans-serif',
  }),
  doodle: Platform.select({
    ios: 'Gaegu',
    android: 'Gaegu',
    default: 'sans-serif',
  }),
  doodleBold: Platform.select({
    ios: 'Gaegu-Bold',
    android: 'Gaegu-Bold',
    default: 'sans-serif',
  }),
} as const;

export const shadow: ViewStyle = {
  shadowColor: '#9A6879',
  shadowOffset: {width: 0, height: 7},
  shadowOpacity: 0.13,
  shadowRadius: 14,
  elevation: 4,
};

export const softShadow: ViewStyle = {
  shadowColor: '#9A6879',
  shadowOffset: {width: 0, height: 3},
  shadowOpacity: 0.09,
  shadowRadius: 9,
  elevation: 2,
};

export const type = {
  hero: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 42,
    color: colors.ink,
  } satisfies TextStyle,
  title: {
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 32,
    color: colors.ink,
  } satisfies TextStyle,
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  } satisfies TextStyle,
  small: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  } satisfies TextStyle,
} as const;

