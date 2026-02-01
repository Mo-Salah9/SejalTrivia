import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {translations} from '../translations';
import {Colors} from '../theme/colors';
import {unlockOrientation} from '../utils/screenOrientation';

type Props = NativeStackScreenProps<RootStackParamList, 'GameOver'>;

const GameOverScreen: React.FC<Props> = ({navigation, route}) => {
  const {players} = route.params;
  const t = translations.ar;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    unlockOrientation();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const winner =
    players[0].score > players[1].score
      ? players[0]
      : players[1].score > players[0].score
      ? players[1]
      : null;

  const isTie = players[0].score === players[1].score;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
        ]}>
        {/* Trophy / Tie icon */}
        <Text style={styles.trophy}>{isTie ? '🤝' : '🏆'}</Text>

        <Text style={styles.title}>{t.game_over || 'انتهت اللعبة'}</Text>

        {isTie ? (
          <Text style={styles.resultText}>{t.its_a_tie || 'تعادل!'}</Text>
        ) : (
          <Text style={styles.resultText}>
            {winner?.name} {t.wins || 'فاز!'}
          </Text>
        )}

        {/* Score cards */}
        <View style={styles.scoresRow}>
          {players.map((player, idx) => {
            const isWinner = winner?.id === player.id;
            const isFirst = idx === 0;
            return (
              <View
                key={player.id}
                style={[
                  styles.scoreCard,
                  {
                    backgroundColor: isFirst
                      ? 'rgba(251, 146, 60, 0.12)'
                      : 'rgba(34, 211, 238, 0.12)',
                    borderColor: isWinner
                      ? isFirst
                        ? Colors.orange500
                        : Colors.cyan500
                      : 'rgba(255,255,255,0.1)',
                    borderWidth: isWinner ? 2 : 1,
                  },
                ]}>
                {isWinner && <Text style={styles.winnerBadge}>🏆</Text>}
                <Text
                  style={[
                    styles.playerName,
                    {color: isFirst ? Colors.orange400 : Colors.cyan400},
                  ]}>
                  {player.name}
                </Text>
                <Text
                  style={[
                    styles.playerScore,
                    {color: isFirst ? Colors.orange500 : Colors.cyan500},
                  ]}>
                  {player.score}
                </Text>
                <Text style={styles.pointsLabel}>{t.points || 'نقطة'}</Text>
              </View>
            );
          })}
        </View>

        {/* Play Again */}
        <TouchableOpacity
          style={styles.playAgainBtn}
          onPress={() => navigation.replace('Home')}>
          <Text style={styles.playAgainText}>
            {t.play_again || 'العب مرة ثانية'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.replace('Landing')}>
          <Text style={styles.homeBtnText}>
            {t.home || 'الرئيسية'}
          </Text>
        </TouchableOpacity>
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
    padding: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
  },
  trophy: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  resultText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.yellow500,
    marginBottom: 32,
    writingDirection: 'rtl',
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 32,
  },
  scoreCard: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  winnerBadge: {
    fontSize: 28,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  playerScore: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 12,
    color: Colors.slate400,
    fontWeight: '700',
  },
  playAgainBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: Colors.orange500,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.orange500,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.white,
  },
  homeBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  homeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate400,
  },
});

export default GameOverScreen;
