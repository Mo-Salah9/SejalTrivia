import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  I18nManager,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useAuth} from '../contexts/AuthContext';
import {userService, UserGameData} from '../services/backendService';
import {categoriesService} from '../services/backendService';
import {translations} from '../translations';
import {Colors, Spacing, FontSize, BorderRadius} from '../theme/colors';
import {Category, Player, Question} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pick n random elements from an array (Fisher-Yates) */
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/**
 * For each category, pick 2 questions at 200, 2 at 400, 2 at 600 points.
 * If a category doesn't have enough questions per tier, fall back to
 * picking 6 random questions and assigning points by position.
 */
function buildRandomGameBoardCategories(source: Category[]): Category[] {
  return source.map(cat => {
    const resetQs = cat.questions.map(q => ({...q, isSolved: false}));

    const q200 = resetQs.filter(q => q.points === 200);
    const q400 = resetQs.filter(q => q.points === 400);
    const q600 = resetQs.filter(q => q.points === 600);

    let chosen: Question[];
    if (q200.length >= 2 && q400.length >= 2 && q600.length >= 2) {
      chosen = [
        ...pickN(q200, 2),
        ...pickN(q400, 2),
        ...pickN(q600, 2),
      ];
    } else {
      // Fallback: pick 6 random questions and assign points by position
      chosen = pickN(resetQs, 6).map((q, i) => ({
        ...q,
        points: i < 2 ? 200 : i < 4 ? 400 : 600,
      }));
    }

    return {
      ...cat,
      questions: chosen,
    };
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type Step = 'selectCategories' | 'teamNames';

interface MainGroup {
  id: string;
  labelEn: string;
  labelAr: string;
  cats: Category[];
}

interface SectionConfig {
  color: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CATEGORIES = 6;

const SECTION_ORDER: string[] = ['islamic', 'general', 'entertainment', 'culture'];

const SECTION_CONFIGS: Record<string, SectionConfig> = {
  islamic: {color: Colors.emerald500, icon: '\u{1F54C}'}, // mosque
  general: {color: Colors.blue500, icon: '\u{1F9E0}'}, // brain
  entertainment: {color: Colors.red500, icon: '\u{1F3AC}'}, // clapper
  culture: {color: Colors.orange500, icon: '\u{1F4DA}'}, // books
};

const DEFAULT_SECTION_CONFIG: SectionConfig = {
  color: Colors.slate500,
  icon: '\u{1F4C1}', // folder
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple deterministic hash for fallback visuals. */
const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
};

/** Extract main-group metadata from a Category. */
const getMainGroupInfo = (cat: Category) => {
  const rawEn = cat.mainNameEn || (cat.name || '').split(' - ')[0].trim();
  const rawAr = cat.mainNameAr || (cat.nameAr || '').split(' - ')[0].trim();
  const id = (cat.mainKey || rawEn || rawAr || 'other')
    .toLowerCase()
    .replace(/\s+/g, '-');
  const labelEn = rawEn || rawAr || 'Other';
  const labelAr = rawAr || rawEn || '\u0623\u062E\u0631\u0649'; // "other" in Arabic
  return {id, labelEn, labelAr};
};

/** Strip leading "Main - " prefix, keeping only the sub-label. */
const stripMainPrefix = (label: string | undefined): string => {
  if (!label) return '';
  const parts = label
    .split(' - ')
    .map(p => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return label.trim();
  return parts.slice(1).join(' - ').trim();
};

/** Resolve localised sub-label for a category card. */
const getSubLabel = (cat: Category, isArabic: boolean): string => {
  const direct = isArabic
    ? cat.subNameAr || cat.subNameEn
    : cat.subNameEn || cat.subNameAr;
  if (direct && direct.trim().length > 0) return direct.trim();
  const legacy = isArabic ? cat.nameAr || cat.name : cat.name || cat.nameAr;
  return stripMainPrefix(legacy) || legacy || '';
};

/** Map category keywords to an emoji + accent colour. */
const getCategoryVisual = (
  cat: Category,
): {emoji: string; color: string} => {
  const hay = `${cat.name || ''} ${cat.nameAr || ''}`.toLowerCase();

  if (hay.includes('\u0634\u0639\u0627\u0631\u0627\u062A') || hay.includes('logo'))
    return {emoji: '\u{1F3F7}\uFE0F', color: '#f59e0b'};
  if (hay.includes('\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627') || hay.includes('tech'))
    return {emoji: '\u{1F4BB}', color: '#3b82f6'};
  if (hay.includes('\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0639\u0627\u0645\u0629') || hay.includes('general'))
    return {emoji: '\u{1F9E0}', color: '#8b5cf6'};
  if (hay.includes('\u062A\u0627\u0631\u064A\u062E') || hay.includes('history'))
    return {emoji: '\u{1F3DB}\uFE0F', color: '#a855f7'};
  if (
    hay.includes('\u0644\u063A\u0629') ||
    hay.includes('\u0623\u062F\u0628') ||
    hay.includes('language') ||
    hay.includes('literature')
  )
    return {emoji: '\u{1F4DA}', color: '#ec4899'};
  if (hay.includes('\u0631\u064A\u0627\u0636\u0629') || hay.includes('sport'))
    return {emoji: '\u26BD', color: '#22c55e'};
  if (hay.includes('\u062C\u063A\u0631\u0627\u0641\u064A\u0627') || hay.includes('geography'))
    return {emoji: '\u{1F30D}', color: '#14b8a6'};
  if (
    hay.includes('\u0623\u0643\u0644') ||
    hay.includes('\u0645\u0634\u0631\u0648\u0628\u0627\u062A') ||
    hay.includes('food') ||
    hay.includes('drink')
  )
    return {emoji: '\u{1F37D}\uFE0F', color: '#f97316'};
  if (
    hay.includes('\u0623\u0641\u0644\u0627\u0645') ||
    hay.includes('\u062A\u0631\u0641\u064A\u0647') ||
    hay.includes('movie') ||
    hay.includes('entertainment')
  )
    return {emoji: '\u{1F3AC}', color: '#ef4444'};
  if (hay.includes('\u0639\u0644\u0648\u0645') || hay.includes('science'))
    return {emoji: '\u{1F52C}', color: '#06b6d4'};
  if (hay.includes('\u062D\u062F\u064A\u062B') || hay.includes('hadith'))
    return {emoji: '\u{1F4DC}', color: '#84cc16'};
  if (hay.includes('\u0641\u0642\u0647') || hay.includes('fiqh'))
    return {emoji: '\u2696\uFE0F', color: '#eab308'};
  if (hay.includes('\u0639\u0642\u064A\u062F\u0629') || hay.includes('aqeed'))
    return {emoji: '\u{1F54C}', color: '#0ea5e9'};
  if (
    hay.includes('\u0642\u0631\u0622\u0646') ||
    hay.includes('quran') ||
    hay.includes('\u062A\u0641\u0633\u064A\u0631')
  )
    return {emoji: '\u{1F4D6}', color: '#10b981'};
  if (hay.includes('\u0633\u064A\u0631\u0629'))
    return {emoji: '\u{1F3FA}', color: '#d97706'};
  if (hay.includes('\u0627\u0646\u064A\u0645\u064A') || hay.includes('anime'))
    return {emoji: '\u{1F38C}', color: '#f472b6'};
  if (
    hay.includes('\u0628\u0627\u0628 \u0627\u0644\u062D\u0627\u0631\u0629') ||
    hay.includes('bab al-hara')
  )
    return {emoji: '\u{1F3D8}\uFE0F', color: '#f59e0b'};
  if (hay.includes('\u0633\u064A\u0627\u0631\u0627\u062A') || hay.includes('cars'))
    return {emoji: '\u{1F697}', color: '#ef4444'};
  if (hay.includes('\u0628\u0631\u0627\u0646\u062F\u0627\u062A') || hay.includes('brands'))
    return {emoji: '\u{1F3F7}\uFE0F', color: '#8b5cf6'};
  if (hay.includes('\u0633\u064A\u0627\u0633\u0629') || hay.includes('politics'))
    return {emoji: '\u{1F5F3}\uFE0F', color: '#3b82f6'};
  if (
    hay.includes('\u0634\u062E\u0635\u064A\u0627\u062A \u0645\u0634\u0647\u0648\u0631\u0629') ||
    hay.includes('famous personalities')
  )
    return {emoji: '\u2B50', color: '#fbbf24'};

  // Fallback
  const emojis = ['\u{1F3AF}', '\u{1F4A1}', '\u{1F31F}', '\u{1F3A8}', '\u{1F52E}', '\u{1F3AD}'];
  const colors = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb7185'];
  const h = hashString(cat.id || cat.name || '');
  return {emoji: emojis[h % emojis.length], color: colors[h % colors.length]};
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {user} = useAuth();
  const t = translations.ar; // Default Arabic
  const isArabic = I18nManager.isRTL || true; // default RTL

  // ---- State ---------------------------------------------------------------
  const [step, setStep] = useState<Step>('selectCategories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [userGameData, setUserGameData] = useState<UserGameData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // ---- Derived -------------------------------------------------------------
  const remainingGames = userGameData?.gamesRemaining ?? 0;
  const isUnlimited = userGameData?.isUnlimited ?? false;
  const canPlay = isUnlimited || remainingGames > 0;
  const enabledCategories = useMemo(
    () => categories.filter(c => c?.enabled !== false),
    [categories],
  );

  // ---- Data loading --------------------------------------------------------
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const cats = await categoriesService.getCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoadingUser(false);
      return;
    }
    const loadUserData = async () => {
      try {
        setLoadingUser(true);
        const data = await userService.getUserGameData(user.uid);
        setUserGameData(data);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUserData();
  }, [user]);

  // Keep selection valid when categories list changes
  useEffect(() => {
    const enabledIds = new Set(enabledCategories.map(c => c.id));
    setSelectedCategoryIds(prev => prev.filter(id => enabledIds.has(id)));
  }, [enabledCategories]);

  // ---- Grouped categories --------------------------------------------------
  const mainGroups: MainGroup[] = useMemo(() => {
    const map = new Map<
      string,
      {id: string; labelEn: string; labelAr: string; cats: Category[]}
    >();
    enabledCategories.forEach(cat => {
      const g = getMainGroupInfo(cat);
      const existing = map.get(g.id);
      if (existing) {
        existing.cats.push(cat);
      } else {
        map.set(g.id, {...g, cats: [cat]});
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (b.cats.length !== a.cats.length) return b.cats.length - a.cats.length;
      return a.labelEn.localeCompare(b.labelEn);
    });
  }, [enabledCategories]);

  const orderedGroups = useMemo(() => {
    const ordered = SECTION_ORDER.map(key =>
      mainGroups.find(g => g.id === key),
    ).filter(Boolean) as MainGroup[];
    const remaining = mainGroups.filter(g => !SECTION_ORDER.includes(g.id));
    return [...ordered, ...remaining];
  }, [mainGroups]);

  // ---- Handlers ------------------------------------------------------------
  const toggleCategory = useCallback((id: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_CATEGORIES) return prev;
      return [...prev, id];
    });
  }, []);

  const handleContinue = useCallback(() => {
    if (!canPlay) {
      navigation.navigate('Store');
      return;
    }
    if (selectedCategoryIds.length !== MAX_CATEGORIES) return;
    setStep('teamNames');
  }, [canPlay, selectedCategoryIds.length, navigation]);

  const handleBack = useCallback(() => {
    setStep('selectCategories');
  }, []);

  const handleStart = useCallback(() => {
    if (!canPlay) {
      navigation.navigate('Store');
      return;
    }
    const trimmedP1 = p1.trim();
    const trimmedP2 = p2.trim();
    if (!trimmedP1 || !trimmedP2) {
      Alert.alert(
        t.enter_team_names || 'Team Names',
        t.placeholder_name || 'Please enter names for both teams.',
      );
      return;
    }
    if (selectedCategoryIds.length !== MAX_CATEGORIES) return;

    const selectedCats = buildRandomGameBoardCategories(
      categories.filter(c => selectedCategoryIds.includes(c.id)),
    );

    const players: Player[] = [
      {
        id: 1,
        name: trimmedP1,
        score: 0,
        turnsTaken: 0,
        perksUsed: {show_options: false, two_answers: false, the_pit: false},
      },
      {
        id: 2,
        name: trimmedP2,
        score: 0,
        turnsTaken: 0,
        perksUsed: {show_options: false, two_answers: false, the_pit: false},
      },
    ];

    navigation.navigate('GameLoading', {players, categories: selectedCats});
  }, [canPlay, p1, p2, selectedCategoryIds, categories, navigation, t]);

  const handleStore = useCallback(() => {
    navigation.navigate('Store');
  }, [navigation]);

  // ---- Loading state -------------------------------------------------------
  const isLoading = loadingUser || loadingCategories;

  // ---- Render helpers -------------------------------------------------------

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Games Remaining */}
      <View style={styles.headerLeft}>
        <View style={styles.gamesIcon}>
          <Text style={styles.gamesIconText}>{'\u{1F3AE}'}</Text>
        </View>
        <View>
          <Text style={styles.gamesLabel}>{t.games_remaining}</Text>
          <Text style={styles.gamesCount}>
            {isLoading
              ? '...'
              : isUnlimited
                ? '\u221E'
                : String(remainingGames)}
          </Text>
        </View>
      </View>

      {/* Centre badge */}
      <View style={styles.counterBadge}>
        <Text style={styles.counterBadgeText}>
          {step === 'selectCategories'
            ? `${selectedCategoryIds.length}/${MAX_CATEGORIES}`
            : '\u0662/\u0662'}
        </Text>
      </View>

      {/* Store */}
      <TouchableOpacity style={styles.storeBtn} onPress={handleStore}>
        <Text style={styles.storeBtnEmoji}>{'\u{1F6D2}'}</Text>
        <Text style={styles.storeBtnText}>{t.store_short}</Text>
      </TouchableOpacity>
    </View>
  );

  // ---- STEP 1 : Category Selection -----------------------------------------

  const renderCategoryCard = (cat: Category) => {
    const checked = selectedCategoryIds.includes(cat.id);
    const disabledUnchecked = !checked && selectedCategoryIds.length >= MAX_CATEGORIES;
    const {emoji, color} = getCategoryVisual(cat);
    const label = getSubLabel(cat, isArabic);

    return (
      <TouchableOpacity
        key={cat.id}
        style={[
          styles.categoryCard,
          {borderColor: checked ? Colors.orange400 : 'rgba(255,255,255,0.08)'},
          checked && styles.categoryCardSelected,
          disabledUnchecked && styles.categoryCardDisabled,
        ]}
        activeOpacity={disabledUnchecked ? 1 : 0.7}
        onPress={() => !disabledUnchecked && toggleCategory(cat.id)}>
        {/* Accent tint */}
        <View
          style={[
            styles.categoryCardBg,
            {
              backgroundColor: checked
                ? 'rgba(234, 88, 12, 0.15)'
                : `${color}10`,
            },
          ]}
        />

        {/* Emoji */}
        <View style={[styles.categoryEmojiWrap, {backgroundColor: `${color}25`}]}>
          <Text style={styles.categoryEmoji}>{emoji}</Text>
        </View>

        {/* Label */}
        <Text
          style={[styles.categoryLabel, {writingDirection: isArabic ? 'rtl' : 'ltr'}]}
          numberOfLines={2}>
          {label}
        </Text>

        {/* Check mark */}
        {checked && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkMark}>{'\u2713'}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (group: MainGroup) => {
    const config = SECTION_CONFIGS[group.id] || DEFAULT_SECTION_CONFIG;
    return (
      <View
        style={[
          styles.sectionHeader,
          {backgroundColor: `${config.color}18`},
        ]}>
        <View style={[styles.sectionIconWrap, {backgroundColor: `${config.color}20`}]}>
          <Text style={styles.sectionIcon}>{config.icon}</Text>
        </View>
        <View style={styles.sectionTextWrap}>
          <Text style={[styles.sectionTitle, {writingDirection: isArabic ? 'rtl' : 'ltr'}]}>
            {isArabic ? group.labelAr : group.labelEn}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {group.cats.length} {t.categories_count}
          </Text>
        </View>
      </View>
    );
  };

  const renderCategoryGrid = (cats: Category[]) => {
    const rows: Category[][] = [];
    for (let i = 0; i < cats.length; i += 2) {
      rows.push(cats.slice(i, i + 2));
    }
    return (
      <View style={styles.gridContainer}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.gridRow}>
            {row.map(cat => (
              <View key={cat.id} style={styles.gridCell}>
                {renderCategoryCard(cat)}
              </View>
            ))}
            {row.length === 1 && <View style={styles.gridCell} />}
          </View>
        ))}
      </View>
    );
  };

  if (step === 'selectCategories') {
    return (
      <View style={styles.screenContainer}>
        {/* Header */}
        {renderHeader()}

        {/* Title */}
        <View style={styles.pageTitle}>
          <Text style={styles.pageTitleText}>{t.select_categories}</Text>
          <Text style={styles.pageTitleSub}>{t.tap_to_select}</Text>
        </View>

        {/* Loading indicator */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.orange500} />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : (
          /* Scrollable category sections */
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {orderedGroups.map(group => (
              <View key={group.id} style={styles.sectionBlock}>
                {renderSectionHeader(group)}
                {renderCategoryGrid(group.cats)}
              </View>
            ))}
            {/* Bottom spacer for the fixed footer */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}

        {/* Fixed Footer */}
        <View style={styles.footer}>
          {!canPlay && !isLoading ? (
            <TouchableOpacity
              style={styles.buyGamesBtn}
              onPress={handleStore}
              activeOpacity={0.8}>
              <Text style={styles.buyGamesBtnText}>{t.buy_games}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.continueBtn,
                selectedCategoryIds.length === MAX_CATEGORIES && !isLoading
                  ? styles.continueBtnActive
                  : styles.continueBtnDisabled,
              ]}
              onPress={handleContinue}
              disabled={isLoading || selectedCategoryIds.length !== MAX_CATEGORIES}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.continueBtnText,
                  selectedCategoryIds.length === MAX_CATEGORIES && !isLoading
                    ? styles.continueBtnTextActive
                    : styles.continueBtnTextDisabled,
                ]}>
                {isLoading
                  ? t.loading
                  : selectedCategoryIds.length === MAX_CATEGORIES
                    ? t.continue_btn
                    : `${t.select_more} ${MAX_CATEGORIES - selectedCategoryIds.length} ${t.more_categories}`}
              </Text>
            </TouchableOpacity>
          )}

          {enabledCategories.length < MAX_CATEGORIES && !isLoading && (
            <Text style={styles.warningText}>{t.need_more_categories}</Text>
          )}
        </View>
      </View>
    );
  }

  // ---- STEP 2 : Team Names -------------------------------------------------

  /** Render the chips showing which categories were picked. */
  const renderSelectedChips = () => (
    <View style={styles.chipsContainer}>
      <Text style={styles.chipsLabel}>{t.selected_categories}</Text>
      <View style={styles.chipsWrap}>
        {selectedCategoryIds.map(catId => {
          const cat = categories.find(c => c.id === catId);
          if (!cat) return null;
          const {emoji} = getCategoryVisual(cat);
          const label = getSubLabel(cat, isArabic);
          return (
            <View key={catId} style={styles.chip}>
              <Text style={styles.chipEmoji}>{emoji}</Text>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      {renderHeader()}

      {/* Title */}
      <View style={styles.pageTitle}>
        <Text style={styles.pageTitleText}>{t.enter_team_names}</Text>
        <Text style={styles.pageTitleSub}>{t.team_names_subtitle}</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Team 1 */}
        <View style={styles.teamCard}>
          <View style={[styles.teamCardAccent, {backgroundColor: 'rgba(234,88,12,0.12)'}]} />
          <View style={styles.teamCardInner}>
            <View style={styles.teamHeaderRow}>
              <View
                style={[
                  styles.teamIconWrap,
                  {backgroundColor: 'rgba(234,88,12,0.2)'},
                ]}>
                <Text style={styles.teamIcon}>{'\u2694\uFE0F'}</Text>
              </View>
              <View style={styles.teamHeaderText}>
                <Text style={[styles.teamTitle, {color: Colors.orange400}]}>
                  {t.team_one}
                </Text>
                <Text style={styles.teamSubtitle}>{t.p1_name}</Text>
              </View>
            </View>
            <TextInput
              style={[
                styles.teamInput,
                {borderColor: 'rgba(234,88,12,0.3)'},
              ]}
              value={p1}
              onChangeText={setP1}
              placeholder={t.placeholder_name}
              placeholderTextColor={Colors.slate500}
              textAlign={isArabic ? 'right' : 'left'}
              autoCorrect={false}
            />
          </View>
        </View>

        {/* VS divider */}
        <View style={styles.vsDivider}>
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
        </View>

        {/* Team 2 */}
        <View style={styles.teamCard}>
          <View style={[styles.teamCardAccent, {backgroundColor: 'rgba(59,130,246,0.12)'}]} />
          <View style={styles.teamCardInner}>
            <View style={styles.teamHeaderRow}>
              <View
                style={[
                  styles.teamIconWrap,
                  {backgroundColor: 'rgba(59,130,246,0.2)'},
                ]}>
                <Text style={styles.teamIcon}>{'\u{1F6E1}\uFE0F'}</Text>
              </View>
              <View style={styles.teamHeaderText}>
                <Text style={[styles.teamTitle, {color: Colors.blue400}]}>
                  {t.team_two}
                </Text>
                <Text style={styles.teamSubtitle}>{t.p2_name}</Text>
              </View>
            </View>
            <TextInput
              style={[
                styles.teamInput,
                {borderColor: 'rgba(59,130,246,0.3)'},
              ]}
              value={p2}
              onChangeText={setP2}
              placeholder={t.placeholder_name}
              placeholderTextColor={Colors.slate500}
              textAlign={isArabic ? 'right' : 'left'}
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Selected Categories summary */}
        {renderSelectedChips()}

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}>
            <Text style={styles.backBtnText}>{t.back}</Text>
          </TouchableOpacity>

          {!canPlay ? (
            <TouchableOpacity
              style={styles.buyGamesBtnWide}
              onPress={handleStore}
              activeOpacity={0.8}>
              <Text style={styles.buyGamesBtnText}>{t.buy_games}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.startBtn,
                selectedCategoryIds.length === MAX_CATEGORIES && !isLoading
                  ? styles.startBtnActive
                  : styles.startBtnDisabled,
              ]}
              onPress={handleStart}
              disabled={isLoading || selectedCategoryIds.length !== MAX_CATEGORIES}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.startBtnText,
                  selectedCategoryIds.length === MAX_CATEGORIES && !isLoading
                    ? styles.startBtnTextActive
                    : styles.startBtnTextDisabled,
                ]}>
                {isLoading ? t.loading : t.start_btn}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.slate900,
  },

  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51,65,85,0.5)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gamesIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(234,179,8,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(234,179,8,0.3)',
  },
  gamesIconText: {
    fontSize: 14,
  },
  gamesLabel: {
    fontSize: FontSize.xs,
    color: Colors.slate400,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gamesCount: {
    fontSize: FontSize.sm,
    fontWeight: '900',
    color: Colors.yellow500,
  },
  counterBadge: {
    backgroundColor: Colors.orange500,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: Colors.orange500,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  counterBadgeText: {
    color: Colors.white,
    fontWeight: '900',
    fontSize: FontSize.sm,
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.slate800,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.slate700,
  },
  storeBtnEmoji: {
    fontSize: 14,
  },
  storeBtnText: {
    color: Colors.yellow500,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },

  // ---- Page Title ----
  pageTitle: {
    paddingHorizontal: Spacing.md,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  pageTitleText: {
    fontSize: FontSize['2xl'],
    fontWeight: '900',
    color: Colors.orange400,
    textAlign: 'center',
    marginBottom: 4,
  },
  pageTitleSub: {
    fontSize: FontSize.xs,
    color: Colors.slate400,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },

  // ---- Loading ----
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.slate400,
    fontSize: FontSize.md,
    fontWeight: '600',
  },

  // ---- Scroll ----
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 16,
  },
  bottomSpacer: {
    height: 100,
  },

  // ---- Section ----
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: Colors.white,
  },
  sectionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.slate300,
    fontWeight: '600',
    marginTop: 2,
  },

  // ---- Category Grid ----
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCell: {
    flex: 1,
  },

  // ---- Category Card ----
  categoryCard: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 2,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.slate800,
  },
  categoryCardSelected: {
    shadowColor: Colors.orange500,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryCardDisabled: {
    opacity: 0.4,
  },
  categoryCardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryEmojiWrap: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryLabel: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.orange500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  checkMark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },

  // ---- Footer ----
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(51,65,85,0.5)',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // ---- Continue Button (Step 1) ----
  continueBtn: {
    paddingVertical: 16,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
  },
  continueBtnActive: {
    backgroundColor: Colors.orange500,
    shadowColor: Colors.orange500,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  continueBtnDisabled: {
    backgroundColor: Colors.slate700,
  },
  continueBtnText: {
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  continueBtnTextActive: {
    color: Colors.white,
  },
  continueBtnTextDisabled: {
    color: Colors.slate500,
  },

  // ---- Buy Games Button ----
  buyGamesBtn: {
    paddingVertical: 16,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    backgroundColor: Colors.yellow500,
    shadowColor: Colors.yellow500,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buyGamesBtnWide: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    backgroundColor: Colors.yellow500,
    shadowColor: Colors.yellow500,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buyGamesBtnText: {
    color: Colors.slate950,
    fontSize: FontSize.base,
    fontWeight: '900',
  },

  // ---- Warning ----
  warningText: {
    fontSize: FontSize.xs,
    color: Colors.red400,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 8,
  },

  // ---- Team Names Step ----
  teamCard: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: Colors.slate800,
  },
  teamCardAccent: {
    ...StyleSheet.absoluteFillObject,
  },
  teamCardInner: {
    padding: 20,
  },
  teamHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  teamIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamIcon: {
    fontSize: 24,
  },
  teamHeaderText: {
    flex: 1,
  },
  teamTitle: {
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  teamSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.slate400,
    fontWeight: '600',
    marginTop: 2,
  },
  teamInput: {
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.white,
  },

  // ---- VS Divider ----
  vsDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  vsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.slate700,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.slate600,
  },
  vsText: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: Colors.yellow500,
  },

  // ---- Selected Chips ----
  chipsContainer: {
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(51,65,85,0.5)',
  },
  chipsLabel: {
    fontSize: FontSize.xs,
    color: Colors.slate400,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  chipEmoji: {
    fontSize: 12,
  },
  chipText: {
    color: Colors.emerald400,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // ---- Back / Start Buttons (Step 2 footer) ----
  backBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    backgroundColor: Colors.slate800,
    borderWidth: 1,
    borderColor: Colors.slate700,
  },
  backBtnText: {
    color: Colors.slate300,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  startBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
  },
  startBtnActive: {
    backgroundColor: Colors.orange500,
    shadowColor: Colors.orange500,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  startBtnDisabled: {
    backgroundColor: Colors.slate700,
  },
  startBtnText: {
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  startBtnTextActive: {
    color: Colors.white,
  },
  startBtnTextDisabled: {
    color: Colors.slate500,
  },
});

export default HomeScreen;
