import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useAuth} from '../contexts/AuthContext';
import {userService, UserGameData} from '../services/backendService';
import {nativePaymentService, NATIVE_PRODUCT_IDS, PRODUCT_ID_MAP} from '../services/nativePaymentService';
import {translations} from '../translations';
import {Colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Store'>;

const PRODUCTS = [
  {id: 'pack_3', name: '٣ ألعاب', games: 3, price: '$0.99', popular: false},
  {id: 'pack_7', name: '٧ ألعاب', games: 7, price: '$1.99', popular: false},
  {id: 'pack_10', name: '١٠ ألعاب', games: 10, price: '$2.99', popular: true},
  {id: 'unlimited', name: 'غير محدود', games: -1, price: '$4.99', popular: false},
];

const StoreScreen: React.FC<Props> = ({navigation}) => {
  const {user} = useAuth();
  const t = translations.ar;
  const [userData, setUserData] = useState<UserGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadData();
    nativePaymentService.initialize();
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await userService.getUserGameData(user.uid);
      setUserData(data);
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    if (!user) {
      Alert.alert(t.error || 'خطأ', t.sign_in_to_purchase || 'سجل دخولك أولاً');
      return;
    }
    setPurchasing(productId);
    try {
      nativePaymentService.setPurchaseCallback({
        onSuccess: async (pId, transactionId, receipt) => {
          await nativePaymentService.grantGames(pId, transactionId, user.uid);
          await loadData();
          setPurchasing(null);
          Alert.alert(
            t.success || 'نجاح',
            t.purchase_success || 'تمت عملية الشراء بنجاح!',
          );
        },
        onError: (error) => {
          setPurchasing(null);
          if (!error.includes('cancelled')) {
            Alert.alert(t.error || 'خطأ', error);
          }
        },
      });
      await nativePaymentService.purchaseProduct(productId, user.uid);
    } catch (err: any) {
      setPurchasing(null);
      Alert.alert(t.error || 'خطأ', err.message || 'Purchase failed');
    }
  };

  const handleRestore = async () => {
    if (!user) return;
    setRestoring(true);
    try {
      const result = await nativePaymentService.restorePurchases(user.uid);
      await loadData();
      Alert.alert(
        result.restored ? (t.success || 'نجاح') : (t.info || 'معلومة'),
        result.message,
      );
    } catch (err: any) {
      Alert.alert(t.error || 'خطأ', err.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const remainingGames = userData?.gamesRemaining ?? 0;
  const isUnlimited = userData?.isUnlimited ?? false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t.back || 'رجوع'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.store || 'المتجر'}</Text>
        <View style={{width: 60}} />
      </View>

      {/* Games Counter */}
      <View style={styles.gamesCounter}>
        <Text style={styles.gamesIcon}>🎮</Text>
        <View>
          <Text style={styles.gamesLabel}>{t.games_remaining || 'الألعاب المتبقية'}</Text>
          <Text style={styles.gamesNumber}>
            {loading ? '...' : isUnlimited ? '∞' : remainingGames}
          </Text>
        </View>
      </View>

      {/* Products Grid */}
      <View style={styles.productsGrid}>
        {PRODUCTS.map(product => (
          <View
            key={product.id}
            style={[styles.productCard, product.popular && styles.productCardPopular]}>
            {product.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>{t.best_value || 'أفضل قيمة'}</Text>
              </View>
            )}
            <Text style={styles.productEmoji}>
              {product.games === -1 ? '♾️' : '🎮'}
            </Text>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productGames}>
              {product.games === -1
                ? t.unlimited_games || 'ألعاب غير محدودة'
                : `${product.games} ${t.games || 'ألعاب'}`}
            </Text>
            <Text style={styles.productPrice}>{product.price}</Text>
            <TouchableOpacity
              style={[
                styles.buyBtn,
                product.popular && styles.buyBtnPopular,
                purchasing === product.id && styles.buyBtnDisabled,
              ]}
              onPress={() => handlePurchase(product.id)}
              disabled={!!purchasing}>
              {purchasing === product.id ? (
                <ActivityIndicator color={Colors.slate950} size="small" />
              ) : (
                <Text style={styles.buyBtnText}>{t.buy || 'شراء'}</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Restore Purchases */}
      <TouchableOpacity
        style={styles.restoreBtn}
        onPress={handleRestore}
        disabled={restoring}>
        {restoring ? (
          <ActivityIndicator color={Colors.orange400} />
        ) : (
          <Text style={styles.restoreText}>
            {t.restore_purchases || 'استعادة المشتريات'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.slate900},
  contentContainer: {padding: 20, paddingBottom: 40},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24},
  backText: {color: Colors.slate400, fontSize: 15, fontWeight: '700'},
  headerTitle: {fontSize: 22, fontWeight: '900', color: Colors.white, writingDirection: 'rtl'},
  gamesCounter: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  gamesIcon: {fontSize: 32},
  gamesLabel: {fontSize: 12, fontWeight: '700', color: Colors.slate400, writingDirection: 'rtl'},
  gamesNumber: {fontSize: 24, fontWeight: '900', color: Colors.yellow500},
  productsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24},
  productCard: {width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  productCardPopular: {borderColor: Colors.orange500, borderWidth: 2, backgroundColor: 'rgba(249, 115, 22, 0.08)'},
  popularBadge: {position: 'absolute', top: -10, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: Colors.orange500, borderRadius: 10},
  popularText: {fontSize: 10, fontWeight: '900', color: Colors.white},
  productEmoji: {fontSize: 36, marginBottom: 8},
  productName: {fontSize: 18, fontWeight: '900', color: Colors.white, marginBottom: 4, writingDirection: 'rtl'},
  productGames: {fontSize: 12, color: Colors.slate400, marginBottom: 8, writingDirection: 'rtl'},
  productPrice: {fontSize: 22, fontWeight: '900', color: Colors.yellow500, marginBottom: 12},
  buyBtn: {width: '100%', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center'},
  buyBtnPopular: {backgroundColor: Colors.orange500},
  buyBtnDisabled: {opacity: 0.5},
  buyBtnText: {fontSize: 14, fontWeight: '900', color: Colors.white},
  restoreBtn: {alignItems: 'center', paddingVertical: 16},
  restoreText: {color: Colors.orange400, fontWeight: '700', fontSize: 15},
});

export default StoreScreen;
