import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Player} from '../types';
import {Colors} from '../theme/colors';

interface ScoreBoardProps {
  players: Player[];
  currentTurn: number;
  t: any;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({players, currentTurn, t}) => {
  return (
    <View style={styles.container}>
      {players.map((player, idx) => {
        const isActive = currentTurn === idx;
        const isFirst = idx === 0;
        const accentColor = isFirst ? Colors.orange500 : Colors.cyan500;
        const accentColorLight = isFirst ? Colors.orange400 : Colors.cyan400;

        return (
          <View
            key={player.id}
            style={[
              styles.playerCard,
              {
                backgroundColor: isFirst
                  ? 'rgba(251, 146, 60, 0.12)'
                  : 'rgba(34, 211, 238, 0.12)',
              },
              isActive && {borderWidth: 2, borderColor: accentColor},
            ]}>
            {/* Active indicator bar */}
            {isActive && (
              <View
                style={[styles.activeBar, {backgroundColor: accentColor}]}
              />
            )}

            <View style={styles.cardContent}>
              {/* Player Name */}
              <View style={styles.nameRow}>
                <Text
                  style={[styles.playerName, {color: accentColorLight}]}
                  numberOfLines={1}>
                  {player.name}
                </Text>
                {isActive && (
                  <View
                    style={[styles.activeDot, {backgroundColor: accentColor}]}
                  />
                )}
              </View>

              {/* Score */}
              <Text style={[styles.score, {color: accentColor}]}>
                {player.score}
              </Text>

              {/* Perks */}
              <View style={styles.perksRow}>
                <View
                  style={[
                    styles.perkBadge,
                    player.perksUsed.show_options
                      ? styles.perkUsed
                      : {
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          borderColor: 'rgba(59, 130, 246, 0.3)',
                        },
                  ]}>
                  <Text
                    style={[
                      styles.perkText,
                      player.perksUsed.show_options
                        ? styles.perkTextUsed
                        : {color: '#60a5fa'},
                    ]}>
                    {t.perk_show_options || 'خيارات'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.perkBadge,
                    player.perksUsed.two_answers
                      ? styles.perkUsed
                      : {
                          backgroundColor: 'rgba(168, 85, 247, 0.2)',
                          borderColor: 'rgba(168, 85, 247, 0.3)',
                        },
                  ]}>
                  <Text
                    style={[
                      styles.perkText,
                      player.perksUsed.two_answers
                        ? styles.perkTextUsed
                        : {color: '#c084fc'},
                    ]}>
                    {t.perk_two_answers || 'جوابين'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.perkBadge,
                    player.perksUsed.the_pit
                      ? styles.perkUsed
                      : {
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          borderColor: 'rgba(239, 68, 68, 0.3)',
                        },
                  ]}>
                  <Text
                    style={[
                      styles.perkText,
                      player.perksUsed.the_pit
                        ? styles.perkTextUsed
                        : {color: '#f87171'},
                    ]}>
                    {t.perk_the_pit || 'الحفرة'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  playerCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeBar: {
    height: 2,
    width: '100%',
  },
  cardContent: {
    padding: 10,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  playerName: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  score: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
  },
  perksRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  perkBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  perkUsed: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderColor: 'transparent',
  },
  perkText: {
    fontSize: 9,
    fontWeight: '700',
  },
  perkTextUsed: {
    color: Colors.slate600,
    textDecorationLine: 'line-through',
  },
});

export default ScoreBoard;
