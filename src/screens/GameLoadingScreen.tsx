import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {translations} from '../translations';
import {Colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'GameLoading'>;

const GameLoadingScreen: React.FC<Props> = ({navigation, route}) => {
  const {players, categories} = route.params;
  const insets = useSafeAreaInsets();
  const t = translations.ar;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.replace('Game', {players, categories});
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, players, categories, fadeAnim]);

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right}]}>
      <Animated.View style={[styles.content, {opacity: fadeAnim}]}>
        <Text style={styles.emoji}>⚔️</Text>
        <ActivityIndicator size="large" color={Colors.orange500} style={styles.spinner} />
        <Text style={styles.title}>{t.loading_game || 'جاري تحضير اللعبة'}</Text>
        <Text style={styles.tip}>{t.loading_tip || 'استعد للتحدي!'}</Text>

        <View style={styles.playersRow}>
          <View style={[styles.playerChip, styles.playerChip1]}>
            <Text style={styles.playerChipText}>{players[0]?.name}</Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={[styles.playerChip, styles.playerChip2]}>
            <Text style={styles.playerChipText}>{players[1]?.name}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  tip: {
    fontSize: 14,
    color: Colors.slate400,
    marginBottom: 32,
    writingDirection: 'rtl',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playerChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
  },
  playerChip1: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  playerChip2: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  playerChipText: {
    fontWeight: '800',
    color: Colors.white,
    fontSize: 16,
  },
  vsText: {
    fontWeight: '900',
    color: Colors.yellow500,
    fontSize: 18,
  },
});

export default GameLoadingScreen;
