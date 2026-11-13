import {colors} from '@/theme';
import {Image} from 'expo-image';
import {useTranslation} from 'react-i18next';
import {StyleSheet, Text, View} from 'react-native';

const mark = require('../../../assets/images/corelia-mark.png');

export function BrandLogo({size = 44}: {size?: number}) {
  const {t} = useTranslation();
  const textSize = Math.round(size * 0.72);

  return (
    <View style={[styles.root, {gap: Math.round(size * 0.2)}]}>
      <Image
        accessibilityIgnoresInvertColors
        contentFit="contain"
        source={mark}
        style={{height: size, width: size}}
      />
      <Text
        style={[
          styles.wordmark,
          {fontSize: textSize, lineHeight: Math.round(textSize * 1.1)},
        ]}>
        {t('Common.title')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {alignItems: 'center', flexDirection: 'row'},
  wordmark: {
    color: colors.text,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
});
