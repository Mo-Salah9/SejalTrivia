import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {Player, Category, Question, PerkType} from '../types';
import {translations} from '../translations';
import {Colors} from '../theme/colors';
import {lockToLandscape, unlockOrientation} from '../utils/screenOrientation';
import {useAuth} from '../contexts/AuthContext';
import {gameSessionsService} from '../services/backendService';
import GameBoard from '../components/GameBoard';
import ScoreBoard from '../components/ScoreBoard';
import QuestionModal from '../components/QuestionModal';
import Logo from '../components/Logo';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const GameScreen: React.FC<Props> = ({navigation, route}) => {
  const {user} = useAuth();
  const t = translations.ar;
  const initialPlayers = route.params.players;
  const initialCategories = route.params.categories;

  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<{
    categoryId: string;
    questionId: string;
  } | null>(null);
  const [pitNotificationShown, setPitNotificationShown] = useState(false);
  const [scoreAnimText, setScoreAnimText] = useState<string | null>(null);

  // Lock to landscape
  useEffect(() => {
    lockToLandscape();
    return () => unlockOrientation();
  }, []);

  // Save game session
  useEffect(() => {
    if (user) {
      gameSessionsService
        .saveGameSession({
          players,
          currentTurn,
          categories,
          activeQuestion: null,
          view: 'game',
          language: 'ar',
        })
        .catch(err => console.error('Error saving session:', err));
    }
  }, [user, players, currentTurn, categories]);

  // Check if pit becomes available
  const solvedCount = categories.reduce(
    (acc, cat) => acc + cat.questions.filter(q => q.isSolved).length,
    0,
  );

  useEffect(() => {
    if (solvedCount >= 4 && !pitNotificationShown && !activeQuestion) {
      setPitNotificationShown(true);
      Alert.alert(
        '⚠️ ' + (t.pit_available_title || 'الحفرة أصبحت متاحة!'),
        t.pit_available_desc ||
          'يمكنك الآن استخدام الحفرة عند دورك. إذا جاوبت صح، الخصم يخسر نقاط السؤال!',
        [{text: t.ok || 'فهمت', style: 'default'}],
      );
    }
  }, [solvedCount, pitNotificationShown, activeQuestion, t]);

  const handleSelectQuestion = useCallback(
    (categoryId: string, questionId: string) => {
      setActiveQuestion({categoryId, questionId});
    },
    [],
  );

  const handlePerkUsed = useCallback(
    (teamId: number, perkType: PerkType) => {
      setPlayers(prev =>
        prev.map((p, idx) =>
          idx === teamId
            ? {
                ...p,
                perksUsed: {...p.perksUsed, [perkType]: true},
              }
            : p,
        ),
      );
    },
    [],
  );

  const handleAnswer = useCallback(
    (
      teamId: number | null,
      pitActiveForThisQuestion: boolean = false,
      pitActivatorTeamId: number | null = null,
    ) => {
      if (!activeQuestion) return;

      const {categoryId, questionId} = activeQuestion;
      const category = categories.find(c => c.id === categoryId);
      const question = category?.questions.find(q => q.id === questionId);
      if (!question) return;

      // Show score animation
      if (teamId !== null && teamId >= 0 && teamId < players.length) {
        const player = players[teamId];
        setScoreAnimText(`${player.name}: +${question.points}`);

        if (
          pitActiveForThisQuestion &&
          pitActivatorTeamId !== null &&
          teamId === pitActivatorTeamId
        ) {
          const otherIdx = pitActivatorTeamId === 0 ? 1 : 0;
          setTimeout(() => {
            setScoreAnimText(
              `${players[otherIdx].name}: -${question.points} 🕳️`,
            );
          }, 2000);
        }

        setTimeout(() => setScoreAnimText(null), 3500);
      }

      // Update state after animation
      const delay =
        teamId !== null
          ? pitActiveForThisQuestion &&
            pitActivatorTeamId !== null &&
            teamId === pitActivatorTeamId
            ? 4000
            : 2000
          : 500;

      setTimeout(() => {
        // Update players
        setPlayers(prev => {
          const newPlayers = prev.map(p => ({...p}));
          if (teamId !== null && teamId >= 0 && teamId < newPlayers.length) {
            newPlayers[teamId].score += question.points;
          }
          // Pit: deduct from other team
          if (
            pitActiveForThisQuestion &&
            pitActivatorTeamId !== null &&
            teamId === pitActivatorTeamId
          ) {
            const otherIdx = pitActivatorTeamId === 0 ? 1 : 0;
            newPlayers[otherIdx].score -= question.points;
          }
          return newPlayers;
        });

        // Update categories (mark solved)
        setCategories(prev => {
          const newCats = prev.map(cat => {
            if (cat.id === categoryId) {
              return {
                ...cat,
                questions: cat.questions.map(q =>
                  q.id === questionId ? {...q, isSolved: true} : q,
                ),
              };
            }
            return cat;
          });

          // Check if all solved
          const allSolved = newCats.every(cat =>
            cat.questions.every(q => q.isSolved),
          );
          if (allSolved) {
            setTimeout(() => {
              setPlayers(currentPlayers => {
                navigation.replace('GameOver', {players: currentPlayers});
                return currentPlayers;
              });
            }, 500);
          }

          return newCats;
        });

        // Switch turn
        setCurrentTurn(prev => (prev + 1) % 2);
        setActiveQuestion(null);
      }, delay);
    },
    [activeQuestion, categories, players, navigation],
  );

  const currentQuestion = activeQuestion
    ? categories
        .find(c => c.id === activeQuestion.categoryId)
        ?.questions.find(q => q.id === activeQuestion.questionId) || null
    : null;

  const handleExit = () => {
    Alert.alert(
      t.exit_game || 'الخروج من اللعبة',
      t.exit_game_confirm || 'هل أنت متأكد أنك تريد الخروج من اللعبة؟',
      [
        {text: t.cancel || 'إلغاء', style: 'cancel'},
        {
          text: t.exit || 'خروج',
          style: 'destructive',
          onPress: () => navigation.replace('Home'),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Logo size="sm" />
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
          <Text style={styles.exitBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Score Board */}
      <ScoreBoard players={players} currentTurn={currentTurn} t={t} />

      {/* Game Board */}
      <GameBoard
        categories={categories}
        onSelect={handleSelectQuestion}
        language="ar"
      />

      {/* Question Modal */}
      {currentQuestion && activeQuestion && (
        <QuestionModal
          question={currentQuestion}
          onAnswer={handleAnswer}
          onClose={() => setActiveQuestion(null)}
          currentTeamId={currentTurn}
          players={players}
          onPerkUsed={handlePerkUsed}
          solvedQuestionsCount={solvedCount}
          t={t}
        />
      )}

      {/* Score Animation Overlay */}
      {scoreAnimText && (
        <View style={styles.scoreAnimOverlay} pointerEvents="none">
          <Text style={styles.scoreAnimText}>{scoreAnimText}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slate900,
    padding: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 4,
  },
  exitBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitBtnText: {
    color: Colors.slate400,
    fontSize: 16,
    fontWeight: '700',
  },
  scoreAnimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scoreAnimText: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.yellow500,
    textShadowColor: 'rgba(234, 179, 8, 0.5)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 20,
  },
});

export default GameScreen;
