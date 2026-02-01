import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import {Question, PerkType, Player} from '../types';
import {Colors} from '../theme/colors';

interface QuestionModalProps {
  question: Question;
  onAnswer: (
    teamId: number | null,
    pitActiveForThisQuestion: boolean,
    pitActivatorTeamId: number | null,
  ) => void;
  onClose: () => void;
  currentTeamId: number;
  players: Player[];
  onPerkUsed: (teamId: number, perkType: PerkType) => void;
  solvedQuestionsCount: number;
  t: any;
}

type GamePhase = 'preQuestion' | 'answering' | 'showAnswer' | 'selectTeam';

const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  onAnswer,
  onClose,
  currentTeamId,
  players,
  onPerkUsed,
  solvedQuestionsCount,
  t,
}) => {
  const [timer, setTimer] = useState(30);
  const [currentTeamAnswered, setCurrentTeamAnswered] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [pitUsed, setPitUsed] = useState(false);
  const [twoAnswersModeActive, setTwoAnswersModeActive] = useState(false);
  const hasSubmittedRef = useRef(false);

  const otherTeamId = currentTeamId === 0 ? 1 : 0;
  const currentPlayer = players[currentTeamId];
  const otherPlayer = players[otherTeamId];
  const currentTeamName = currentPlayer.name;
  const correctAnswer = question.options[question.correctIndex];

  // Debug: log question data to verify text field
  useEffect(() => {
    console.log('QuestionModal question:', JSON.stringify({
      id: question.id,
      text: question.text,
      hasText: !!question.text,
      textLength: question.text?.length,
      points: question.points,
      optionsCount: question.options?.length,
    }));
  }, [question]);

  const canUsePit =
    !currentPlayer.perksUsed.the_pit && solvedQuestionsCount >= 4;

  const [phase, setPhase] = useState<GamePhase>(
    canUsePit ? 'preQuestion' : 'answering',
  );

  useEffect(() => {
    if (phase === 'preQuestion' && !canUsePit) {
      setPhase('answering');
    }
  }, [phase, canUsePit]);

  useEffect(() => {
    if (phase !== 'answering') return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            setPhase('showAnswer');
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const handleStartQuestion = () => setPhase('answering');

  const handleUsePit = () => {
    if (canUsePit) {
      setPitUsed(true);
      onPerkUsed(currentTeamId, 'the_pit');
      setPhase('answering');
    }
  };

  const handleUseShowOptions = () => {
    if (!currentPlayer.perksUsed.show_options && phase === 'answering') {
      setShowOptions(true);
      onPerkUsed(currentTeamId, 'show_options');
    }
  };

  const handleUseTwoAnswers = () => {
    if (!currentPlayer.perksUsed.two_answers && phase === 'answering') {
      onPerkUsed(currentTeamId, 'two_answers');
      setTwoAnswersModeActive(true);
    }
  };

  const handleCurrentTeamAnswer = () => {
    setCurrentTeamAnswered(true);
    setPhase('showAnswer');
  };

  const handleShowAnswer = () => setPhase('selectTeam');

  const handleSelectTeam = (teamId: number | null) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSelectedTeam(teamId);
    setTimeout(() => {
      onAnswer(teamId, pitUsed, pitUsed ? currentTeamId : null);
    }, 500);
  };

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {phase === 'answering' && (
                <View
                  style={[
                    styles.timerCircle,
                    timer < 10 && styles.timerCircleDanger,
                  ]}>
                  <Text
                    style={[
                      styles.timerText,
                      timer < 10 && styles.timerTextDanger,
                    ]}>
                    {timer}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.headerLabel}>{t.question_for}</Text>
                <Text style={styles.headerTeamName}>{currentTeamName}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerLabel}>{t.points}</Text>
              <Text style={styles.pointsText}>{question.points}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}>
            {/* Pre-Question Phase - The Pit */}
            {phase === 'preQuestion' && canUsePit && (
              <View style={styles.phaseContainer}>
                <View style={styles.pitAskContainer}>
                  <Text style={styles.pitAskEmoji}>⚠️</Text>
                  <Text style={styles.pitAskTitle}>
                    {t.ask_use_pit_before_question ||
                      'هل تريد استخدام الحفرة قبل السؤال؟'}
                  </Text>
                  <Text style={styles.pitAskDesc}>
                    {t.pit_warning_desc ||
                      'اذا جاوبت صح ، الخصم يخسر نقاط السؤال'}
                  </Text>
                </View>

                <View style={styles.pitButtonsRow}>
                  <TouchableOpacity
                    style={styles.pitYesBtn}
                    onPress={handleUsePit}>
                    <Text style={styles.pitBtnEmoji}>✓</Text>
                    <Text style={styles.pitBtnText}>
                      {t.yes_use_pit || 'نعم، استخدم الحفرة'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pitNoBtn}
                    onPress={handleStartQuestion}>
                    <Text style={styles.pitBtnEmoji}>✗</Text>
                    <Text style={styles.pitBtnText}>
                      {t.no_continue_without_pit || 'لا، ابدأ السؤال'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Answering Phase */}
            {phase === 'answering' && (
              <View style={styles.phaseContainer}>
                {pitUsed && (
                  <View style={styles.pitWarningBanner}>
                    <Text style={styles.pitWarningEmoji}>⚠️</Text>
                    <View style={{flex: 1, alignItems: 'center'}}>
                      <Text style={styles.pitWarningTitle}>
                        {t.pit_warning_title || 'الحفرة مفعلة !'}
                      </Text>
                      <Text style={styles.pitWarningDesc}>
                        {t.pit_warning_desc ||
                          'اذا جاوبت صح ، الخصم يخسر نقاط السؤال'}
                      </Text>
                    </View>
                    <Text style={styles.pitWarningEmoji}>⚠️</Text>
                  </View>
                )}

                <Text style={styles.questionText}>{question.text}</Text>

                {/* Show Options */}
                {showOptions && (
                  <View style={styles.optionsGrid}>
                    {question.options.map((option, idx) => (
                      <View key={idx} style={styles.optionCard}>
                        <Text style={styles.optionText}>{option}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Answer Button */}
                {!currentTeamAnswered ? (
                  <TouchableOpacity
                    style={styles.answerBtn}
                    onPress={handleCurrentTeamAnswer}>
                    <Text style={styles.answerBtnText}>
                      {t.answer_btn || 'جاوب'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.answeredIndicator}>
                    <Text style={styles.answeredText}>
                      ✓ {currentTeamName} {t.team_answered || 'جاوب'}
                    </Text>
                  </View>
                )}

                {/* Perks Section */}
                {!currentPlayer.perksUsed.show_options &&
                  !currentPlayer.perksUsed.two_answers &&
                  !showOptions &&
                  !twoAnswersModeActive && (
                    <View style={styles.perksSection}>
                      <Text style={styles.perksTitle}>
                        ⚡ {t.perks || 'الوسائل المتاحة'} ⚡
                      </Text>
                      <Text style={styles.perksSubtitle}>
                        {t.use_perks_wisely ||
                          'استخدمها بحكمة - مرة واحدة لكل وسيلة'}
                      </Text>

                      <View style={styles.perksRow}>
                        {!currentPlayer.perksUsed.show_options && (
                          <TouchableOpacity
                            style={styles.perkCard}
                            onPress={handleUseShowOptions}>
                            <Text style={styles.perkIcon}>👁️</Text>
                            <View style={{flex: 1}}>
                              <Text style={styles.perkName}>
                                {t.use_show_options || 'اظهر خيارات'}
                              </Text>
                              <Text style={styles.perkDesc}>
                                {t.show_options_desc || 'عرض جميع الخيارات'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}

                        {!currentPlayer.perksUsed.two_answers && (
                          <TouchableOpacity
                            style={[
                              styles.perkCard,
                              {borderColor: 'rgba(168, 85, 247, 0.4)'},
                            ]}
                            onPress={handleUseTwoAnswers}>
                            <Text style={styles.perkIcon}>🎯</Text>
                            <View style={{flex: 1}}>
                              <Text
                                style={[styles.perkName, {color: '#c084fc'}]}>
                                {t.use_two_answers || 'جاوب جوابين'}
                              </Text>
                              <Text style={styles.perkDesc}>
                                {t.two_answers_desc || 'جرب جوابين مختلفين'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                {twoAnswersModeActive && (
                  <View style={styles.twoAnswersActive}>
                    <Text style={{fontSize: 24}}>🎯</Text>
                    <Text style={styles.twoAnswersText}>
                      {t.two_answers_mode_active ||
                        'جاوب جوابين نشط - جاوب جوابين ثم اضغط جاوب'}
                    </Text>
                    <Text style={{fontSize: 24}}>🎯</Text>
                  </View>
                )}
              </View>
            )}

            {/* Show Answer Phase */}
            {phase === 'showAnswer' && (
              <View style={styles.phaseContainer}>
                <Text style={styles.questionText}>{question.text}</Text>

                <View style={styles.correctAnswerBox}>
                  <Text style={styles.correctLabel}>
                    {t.show_answer || 'الإجابة الصحيحة'}
                  </Text>
                  <Text style={styles.correctText}>{correctAnswer}</Text>
                </View>

                {pitUsed && (
                  <View style={styles.pitActiveReminder}>
                    <Text style={styles.pitActiveText}>
                      {t.pit_active ||
                        'الحفرة نشطة! إذا جاوب الفريق الآخر صح، سيتم خصم النقاط منه'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.answerBtn}
                  onPress={handleShowAnswer}>
                  <Text style={styles.answerBtnText}>
                    {t.who_answered || 'مين جاوب'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Select Team Phase */}
            {phase === 'selectTeam' && (
              <View style={styles.phaseContainer}>
                <Text style={styles.selectTitle}>
                  {t.who_answered || 'مين جاوب'}
                </Text>
                <Text style={styles.selectSubtitle}>
                  {t.select_team_who_answered || 'اختر الفريق الذي جاوب'}
                </Text>

                <View style={styles.teamButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.teamBtn,
                      selectedTeam === 0 && styles.teamBtnSelected,
                    ]}
                    onPress={() => handleSelectTeam(0)}>
                    <Text
                      style={[
                        styles.teamBtnText,
                        selectedTeam === 0 && styles.teamBtnTextSelected,
                      ]}>
                      {players[0].name}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.teamBtn,
                      selectedTeam === 1 && styles.teamBtnSelected,
                    ]}
                    onPress={() => handleSelectTeam(1)}>
                    <Text
                      style={[
                        styles.teamBtnText,
                        selectedTeam === 1 && styles.teamBtnTextSelected,
                      ]}>
                      {players[1].name}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.noOneBtn,
                    selectedTeam === null && styles.noOneBtnSelected,
                  ]}
                  onPress={() => handleSelectTeam(null)}>
                  <Text style={styles.noOneBtnText}>
                    {t.no_one_answered || 'ما في أحد جاوب'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    padding: 12,
  },
  modalContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 41, 59, 0.97)',
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.3)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.orange500,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  timerCircleDanger: {
    borderColor: Colors.red500,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  timerText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.orange400,
  },
  timerTextDanger: {
    color: Colors.red500,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerTeamName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.white,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.orange500,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 24,
  },
  phaseContainer: {
    alignItems: 'center',
  },
  // Pre-question (Pit)
  pitAskContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  pitAskEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  pitAskTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  pitAskDesc: {
    fontSize: 14,
    color: Colors.slate400,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  pitButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  pitYesBtn: {
    flex: 1,
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  pitNoBtn: {
    flex: 1,
    backgroundColor: 'rgba(71, 85, 105, 0.6)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.4)',
  },
  pitBtnEmoji: {
    fontSize: 32,
    marginBottom: 8,
    color: Colors.white,
  },
  pitBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  // Answering phase
  pitWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 2,
    borderColor: Colors.red500,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    width: '100%',
    gap: 8,
  },
  pitWarningEmoji: {
    fontSize: 24,
  },
  pitWarningTitle: {
    color: '#f87171',
    fontWeight: '900',
    fontSize: 16,
  },
  pitWarningDesc: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 40,
    writingDirection: 'rtl',
  },
  optionsGrid: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: 'rgba(71, 85, 105, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.4)',
    borderRadius: 12,
    padding: 14,
  },
  optionText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  answerBtn: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: Colors.orange500,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.orange500,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  answerBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
  },
  answeredIndicator: {
    paddingVertical: 14,
    marginBottom: 16,
  },
  answeredText: {
    color: Colors.orange400,
    fontWeight: '700',
    fontSize: 18,
  },
  perksSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.3)',
    paddingTop: 20,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  perksTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  perksSubtitle: {
    fontSize: 11,
    color: Colors.slate500,
    fontWeight: '700',
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  perksRow: {
    width: '100%',
    gap: 10,
  },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  perkIcon: {
    fontSize: 28,
  },
  perkName: {
    color: '#60a5fa',
    fontWeight: '900',
    fontSize: 15,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  perkDesc: {
    color: Colors.slate400,
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  twoAnswersActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    width: '100%',
    justifyContent: 'center',
  },
  twoAnswersText: {
    color: '#c084fc',
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  // Show Answer Phase
  correctAnswerBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  correctLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.emerald400,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  correctText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#6ee7b7',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  pitActiveReminder: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    width: '100%',
  },
  pitActiveText: {
    color: '#f87171',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
    writingDirection: 'rtl',
  },
  // Select Team Phase
  selectTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  selectSubtitle: {
    fontSize: 16,
    color: Colors.slate400,
    marginBottom: 24,
    writingDirection: 'rtl',
  },
  teamButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  teamBtn: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(71, 85, 105, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.4)',
    alignItems: 'center',
  },
  teamBtnSelected: {
    backgroundColor: Colors.orange500,
    borderColor: Colors.orange400,
    shadowColor: Colors.orange500,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  teamBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
  },
  teamBtnTextSelected: {
    color: Colors.white,
  },
  noOneBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    alignItems: 'center',
  },
  noOneBtnSelected: {
    backgroundColor: 'rgba(220, 38, 38, 0.6)',
    borderWidth: 2,
    borderColor: '#f87171',
  },
  noOneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate400,
    writingDirection: 'rtl',
  },
});

export default QuestionModal;
