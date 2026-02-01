import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Category, Language} from '../types';
import {Colors} from '../theme/colors';

interface GameBoardProps {
  categories: Category[];
  onSelect: (categoryId: string, questionId: string) => void;
  language: Language;
}

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
};

const getCategoryIcon = (cat: Category): string => {
  const hay = `${cat.name || ''} ${cat.nameAr || ''}`.toLowerCase();
  if (hay.includes('شعارات') || hay.includes('logo')) return '🏷️';
  if (hay.includes('تكنولوجيا') || hay.includes('tech')) return '💻';
  if (hay.includes('معلومات عامة') || hay.includes('general')) return '🧠';
  if (hay.includes('تاريخ') || hay.includes('history')) return '🏛️';
  if (hay.includes('لغة') || hay.includes('أدب') || hay.includes('language') || hay.includes('literature')) return '📚';
  if (hay.includes('رياضة') || hay.includes('sport')) return '⚽';
  if (hay.includes('جغرافيا') || hay.includes('geography')) return '🌍';
  if (hay.includes('أكل') || hay.includes('مشروبات') || hay.includes('food') || hay.includes('drink')) return '🍽️';
  if (hay.includes('أفلام') || hay.includes('ترفيه') || hay.includes('movie') || hay.includes('entertainment')) return '🎬';
  if (hay.includes('علوم') || hay.includes('science')) return '🔬';
  if (hay.includes('حديث') || hay.includes('hadith')) return '📜';
  if (hay.includes('فقه') || hay.includes('fiqh')) return '⚖️';
  if (hay.includes('عقيدة') || hay.includes('aqeed')) return '🕌';
  if (hay.includes('قرآن') || hay.includes('quran') || hay.includes('تفسير')) return '📖';
  if (hay.includes('سيرة')) return '🏺';
  if (hay.includes('انيمي') || hay.includes('anime')) return '🎌';
  if (hay.includes('باب الحارة') || hay.includes('bab al-hara')) return '🏘️';
  if (hay.includes('سيارات') || hay.includes('cars')) return '🚗';
  if (hay.includes('براندات') || hay.includes('brands')) return '🏷️';
  if (hay.includes('سياسة') || hay.includes('politics')) return '🗳️';
  if (hay.includes('شخصيات مشهورة') || hay.includes('famous personalities')) return '⭐';
  const emojis = ['🎯', '💡', '🌟', '🎨', '🔮', '🎭'];
  const h = hashString(cat.id || cat.name || '');
  return emojis[h % emojis.length];
};

const GameBoard: React.FC<GameBoardProps> = ({categories, onSelect, language}) => {
  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const displayName = category.nameAr || category.name;
        const icon = getCategoryIcon(category);

        return (
          <View key={category.id} style={styles.column}>
            {/* Category Header */}
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryIcon}>{icon}</Text>
              <Text style={styles.categoryName} numberOfLines={2}>
                {displayName}
              </Text>
            </View>

            {/* Question Buttons */}
            {category.questions.map((q) => {
              const isSolved = q.isSolved;

              return (
                <TouchableOpacity
                  key={q.id}
                  disabled={isSolved}
                  onPress={() => onSelect(category.id, q.id)}
                  style={[
                    styles.pointButton,
                    isSolved && styles.pointButtonSolved,
                  ]}
                  activeOpacity={0.6}>
                  <Text
                    style={[
                      styles.pointText,
                      isSolved && styles.pointTextSolved,
                    ]}>
                    {isSolved ? '—' : q.points}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  column: {
    flex: 1,
    gap: 4,
  },
  categoryHeader: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  pointButton: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  pointButtonSolved: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pointText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.yellow500,
  },
  pointTextSolved: {
    color: Colors.slate600,
    fontSize: 14,
  },
});

export default GameBoard;
