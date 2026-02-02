import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useAuth} from '../contexts/AuthContext';
import {userService, UserGameData} from '../services/backendService';
import {translations} from '../translations';
import {Colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC<Props> = ({navigation}) => {
  const {user, signOut} = useAuth();
  const t = translations.ar;
  const [userData, setUserData] = useState<UserGameData | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [data, purchaseData] = await Promise.all([
        userService.getUserGameData(user.uid),
        userService.getUserPurchases?.(user.uid).catch(() => []) ?? [],
      ]);
      setUserData(data);
      setPurchases(purchaseData || []);
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUid = async () => {
    if (user?.uid) {
      await Clipboard.setStringAsync(user.uid);
      Alert.alert((t as any).copied || 'تم النسخ', 'UID copied to clipboard');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t.sign_out || 'تسجيل الخروج',
      t.sign_out_confirm || 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
      [
        {text: t.cancel || 'إلغاء', style: 'cancel'},
        {
          text: t.sign_out || 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.replace('Landing');
          },
        },
      ],
    );
  };

  const initials = (user?.displayName || user?.email || '?')
    .substring(0, 2)
    .toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t.back || 'رجوع'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.profile}</Text>
        <View style={{width: 60}} />
      </View>

      {/* Avatar + Info */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.displayName}>
          {user?.displayName || t.no_name || 'بدون اسم'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity style={styles.copyUidBtn} onPress={handleCopyUid}>
          <Text style={styles.copyUidText}>
            UID: {user?.uid?.substring(0, 12)}... 📋
          </Text>
        </TouchableOpacity>
      </View>

      {/* Game Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>{t.game_stats || 'إحصائيات'}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {loading
                ? '...'
                : userData?.isUnlimited
                ? '∞'
                : userData?.gamesRemaining ?? 0}
            </Text>
            <Text style={styles.statLabel}>
              {t.games_remaining || 'ألعاب متبقية'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {loading ? '...' : userData?.totalGamesPlayed ?? 0}
            </Text>
            <Text style={styles.statLabel}>
              {t.total_played || 'ألعاب لعبتها'}
            </Text>
          </View>
        </View>
      </View>

      {/* Purchase History */}
      {purchases.length > 0 && (
        <View style={styles.purchasesCard}>
          <Text style={styles.sectionTitle}>
            {t.purchase_history || 'سجل المشتريات'}
          </Text>
          {purchases.map((p, idx) => (
            <View key={idx} style={styles.purchaseItem}>
              <View style={{flex: 1}}>
                <Text style={styles.purchaseName}>
                  {p.productName || p.productId}
                </Text>
                <Text style={styles.purchaseDate}>
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString('ar')
                    : ''}
                </Text>
              </View>
              <Text style={styles.purchaseBadge}>
                {p.isUnlimited ? '♾️' : `+${p.gamesAdded}`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>{t.sign_out || 'تسجيل الخروج'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.slate900},
  contentContainer: {padding: 20, paddingBottom: 40},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24},
  backText: {color: Colors.slate400, fontSize: 15, fontWeight: '700'},
  headerTitle: {fontSize: 22, fontWeight: '900', color: Colors.white},
  profileSection: {alignItems: 'center', marginBottom: 24},
  avatar: {width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(249, 115, 22, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: Colors.orange500},
  avatarText: {fontSize: 28, fontWeight: '900', color: Colors.orange400},
  displayName: {fontSize: 22, fontWeight: '900', color: Colors.white, marginBottom: 4},
  email: {fontSize: 14, color: Colors.slate400, marginBottom: 8},
  copyUidBtn: {paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8},
  copyUidText: {fontSize: 11, color: Colors.slate500, fontFamily: 'monospace'},
  statsCard: {backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  sectionTitle: {fontSize: 16, fontWeight: '900', color: Colors.white, marginBottom: 16, writingDirection: 'rtl'},
  statsGrid: {flexDirection: 'row', gap: 12},
  statItem: {flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16},
  statValue: {fontSize: 28, fontWeight: '900', color: Colors.yellow500, marginBottom: 4},
  statLabel: {fontSize: 11, fontWeight: '700', color: Colors.slate400, writingDirection: 'rtl'},
  purchasesCard: {backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  purchaseItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'},
  purchaseName: {fontSize: 14, fontWeight: '700', color: Colors.white, writingDirection: 'rtl'},
  purchaseDate: {fontSize: 11, color: Colors.slate500, marginTop: 2},
  purchaseBadge: {fontSize: 16, fontWeight: '900', color: Colors.emerald400},
  signOutBtn: {width: '100%', paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', marginTop: 8},
  signOutText: {fontSize: 16, fontWeight: '900', color: Colors.red500},
});

export default UserProfileScreen;
