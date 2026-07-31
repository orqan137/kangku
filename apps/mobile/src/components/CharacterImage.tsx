import React from 'react';
import {Image, ImageStyle, StyleProp} from 'react-native';

const sources = {
  mongle: require('../assets/characters/ganggu-01-mongle-pencil.png'),
  tori: require('../assets/characters/ganggu-02-tori-question.png'),
  kong: require('../assets/characters/ganggu-03-kong-focus.png'),
  nuri: require('../assets/characters/ganggu-04-nuri-share.png'),
  moa: require('../assets/characters/ganggu-05-moa-group.png'),
} as const;

export type CharacterName = keyof typeof sources;

export function CharacterImage({
  name,
  style,
}: {
  name: CharacterName;
  style?: StyleProp<ImageStyle>;
}) {
  return <Image source={sources[name]} resizeMode="contain" style={style} />;
}

