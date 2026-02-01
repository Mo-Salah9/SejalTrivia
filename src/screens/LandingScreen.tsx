import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  I18nManager,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useAuth} from '../contexts/AuthContext';
import {translations} from '../translations';
import {Colors} from '../theme/colors';
import Logo from '../components/Logo';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

const LandingScreen: React.FC<Props> = ({navigation}) => {
  const {user, isAdmin} = useAuth();
  const t = translations.ar; // Default to Arabic
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const features = [
    {icon: '🎯', title: t.feat_multiplayer, desc: t.feat_multiplayer_desc},
    {icon: '🤖', title: t.feat_ai, desc: t.feat_ai_desc},
    {icon: '📚', title: t.feat_culture, desc: t.feat_culture_desc},
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      <Animated.View style={[styles.content, {opacity: fadeAnim}]}>
        {/* Header */}
        <View style={styles.header}>
          <Logo size="md" appTitle={t.app_title} />
          <View style={styles.headerButtons}>
            {user ? (
              <>
                <TouchableOpacity
                  style={styles.profileBtn}
                  onPress={() => navigation.navigate('UserProfile')}>
                  <Text style={styles.profileBtnText}>{t.profile}</Text>
                </TouchableOpacity>
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.adminBtn}
                    onPress={() => navigation.navigate('AdminPanel')}>
                    <Text style={styles.adminBtnText}>{t.manage_btn}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginBtnText}>{t.sign_in}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.signupBtn}
                  onPress={() => navigation.navigate('SignUp')}>
                  <Text style={styles.signupBtnText}>{t.sign_up}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>⚔️</Text>
          <Text style={styles.heroTitle}>{t.landing_hero_title}</Text>
          <Text style={styles.heroDesc}>{t.landing_hero_desc}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>٦</Text>
            <Text style={styles.statLabel}>{t.categories_label}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>٢</Text>
            <Text style={styles.statLabel}>{t.players_label}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>٣٦</Text>
            <Text style={styles.statLabel}>{t.questions_count}</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feat, i) => (
            <View key={i} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feat.icon}</Text>
              <Text style={styles.featureTitle}>{feat.title}</Text>
              <Text style={styles.featureDesc}>{feat.desc}</Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => {
            if (!user) {
              navigation.navigate('Login');
            } else {
              navigation.navigate('Home');
            }
          }}>
          <Text style={styles.ctaText}>{t.landing_get_started}</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slate900,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  profileBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  profileBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  adminBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderRadius: 12,
  },
  adminBtnText: {
    color: Colors.orange400,
    fontWeight: '700',
    fontSize: 13,
  },
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  loginBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  signupBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.orange500,
    borderRadius: 12,
  },
  signupBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.orange400,
    textAlign: 'center',
    marginBottom: 12,
    writingDirection: 'rtl',
  },
  heroDesc: {
    fontSize: 16,
    color: Colors.slate400,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.yellow500,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.slate400,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.slate400,
    writingDirection: 'rtl',
  },
  ctaButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: Colors.orange500,
    shadowColor: Colors.orange500,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.white,
  },
});

export default LandingScreen;
