import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useAuth} from '../contexts/AuthContext';
import {categoriesService, adminService} from '../services/backendService';
import {Category} from '../types';
import {translations} from '../translations';
import {Colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminPanel'>;
type Tab = 'categories' | 'admins';

const AdminPanelScreen: React.FC<Props> = ({navigation}) => {
  const {user, isAdmin} = useAuth();
  const t = translations.ar;
  const [tab, setTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdminUid, setNewAdminUid] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, adminList] = await Promise.all([
        categoriesService.getCategories(),
        adminService.getAdmins().catch(() => []),
      ]);
      setCategories(cats || []);
      setAdmins(adminList || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = (catId: string) => {
    setCategories(prev =>
      prev.map(c =>
        c.id === catId ? {...c, enabled: !(c.enabled ?? true)} : c,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await categoriesService.saveCategories(categories);
      Alert.alert(t.success || 'نجاح', t.categories_saved || 'تم حفظ الفئات');
    } catch (err: any) {
      Alert.alert(t.error || 'خطأ', err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminUid.trim()) return;
    try {
      await adminService.addAdmin(newAdminUid.trim());
      setAdmins(prev => [...prev, newAdminUid.trim()]);
      setNewAdminUid('');
      Alert.alert(t.success || 'نجاح', t.admin_added || 'تمت إضافة المشرف');
    } catch (err: any) {
      Alert.alert(t.error || 'خطأ', err.message || 'Failed to add admin');
    }
  };

  const handleRemoveAdmin = (uid: string) => {
    Alert.alert(
      t.confirm || 'تأكيد',
      t.remove_admin_confirm || 'هل تريد إزالة هذا المشرف؟',
      [
        {text: t.cancel || 'إلغاء', style: 'cancel'},
        {
          text: t.remove || 'إزالة',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.removeAdmin(uid);
              setAdmins(prev => prev.filter(a => a !== uid));
            } catch (err: any) {
              Alert.alert(t.error || 'خطأ', err.message);
            }
          },
        },
      ],
    );
  };

  if (!isAdmin) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={{color: Colors.red500, fontSize: 18, fontWeight: '700'}}>
          {t.no_access || 'لا يوجد صلاحية'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t.back || 'رجوع'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.admin_panel || 'لوحة الإدارة'}</Text>
        <View style={{width: 60}} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'categories' && styles.tabActive]}
          onPress={() => setTab('categories')}>
          <Text style={[styles.tabText, tab === 'categories' && styles.tabTextActive]}>
            {t.categories || 'الفئات'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'admins' && styles.tabActive]}
          onPress={() => setTab('admins')}>
          <Text style={[styles.tabText, tab === 'admins' && styles.tabTextActive]}>
            {t.admins || 'المشرفون'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.orange500} size="large" style={{marginTop: 40}} />
      ) : tab === 'categories' ? (
        <View>
          {categories.map(cat => (
            <View key={cat.id} style={styles.catCard}>
              <TouchableOpacity
                style={styles.catHeader}
                onPress={() =>
                  setExpandedCat(expandedCat === cat.id ? null : cat.id)
                }>
                <View style={{flex: 1}}>
                  <Text style={styles.catName}>{cat.nameAr || cat.name}</Text>
                  <Text style={styles.catInfo}>
                    {cat.questions?.length || 0} {t.questions || 'أسئلة'}
                  </Text>
                </View>
                <Switch
                  value={cat.enabled !== false}
                  onValueChange={() => handleToggleCategory(cat.id)}
                  trackColor={{false: Colors.slate700, true: 'rgba(249, 115, 22, 0.4)'}}
                  thumbColor={cat.enabled !== false ? Colors.orange500 : Colors.slate500}
                />
              </TouchableOpacity>

              {expandedCat === cat.id && (
                <View style={styles.catQuestions}>
                  {cat.questions?.map((q, idx) => (
                    <View key={q.id || idx} style={styles.questionItem}>
                      <Text style={styles.questionText}>{q.text}</Text>
                      <Text style={styles.questionPoints}>{q.points} pts</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveBtn, saving && {opacity: 0.6}]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.slate950} />
            ) : (
              <Text style={styles.saveBtnText}>{t.save || 'حفظ'}</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {/* Add Admin */}
          <View style={styles.addAdminRow}>
            <TextInput
              style={styles.adminInput}
              value={newAdminUid}
              onChangeText={setNewAdminUid}
              placeholder="User UID"
              placeholderTextColor={Colors.slate500}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.addAdminBtn} onPress={handleAddAdmin}>
              <Text style={styles.addAdminBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Admin List */}
          {admins.map((uid, idx) => (
            <View key={idx} style={styles.adminItem}>
              <Text style={styles.adminUid} numberOfLines={1}>
                {uid}
              </Text>
              <TouchableOpacity onPress={() => handleRemoveAdmin(uid)}>
                <Text style={styles.removeAdminText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.slate900},
  contentContainer: {padding: 20, paddingBottom: 40},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20},
  backText: {color: Colors.slate400, fontSize: 15, fontWeight: '700'},
  headerTitle: {fontSize: 22, fontWeight: '900', color: Colors.white, writingDirection: 'rtl'},
  tabRow: {flexDirection: 'row', gap: 8, marginBottom: 20},
  tab: {flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center'},
  tabActive: {backgroundColor: Colors.orange500},
  tabText: {fontSize: 14, fontWeight: '800', color: Colors.slate400},
  tabTextActive: {color: Colors.white},
  catCard: {backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  catHeader: {flexDirection: 'row', alignItems: 'center', padding: 14},
  catName: {fontSize: 15, fontWeight: '800', color: Colors.white, writingDirection: 'rtl'},
  catInfo: {fontSize: 11, color: Colors.slate400, marginTop: 2},
  catQuestions: {paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)'},
  questionItem: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)'},
  questionText: {flex: 1, fontSize: 13, color: Colors.slate300, writingDirection: 'rtl'},
  questionPoints: {fontSize: 12, fontWeight: '700', color: Colors.yellow500, marginLeft: 8},
  saveBtn: {width: '100%', paddingVertical: 16, borderRadius: 16, backgroundColor: Colors.orange500, alignItems: 'center', marginTop: 16},
  saveBtnText: {fontSize: 16, fontWeight: '900', color: Colors.slate950},
  addAdminRow: {flexDirection: 'row', gap: 8, marginBottom: 16},
  adminInput: {flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, fontSize: 14, color: Colors.white},
  addAdminBtn: {width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.orange500, justifyContent: 'center', alignItems: 'center'},
  addAdminBtnText: {fontSize: 24, fontWeight: '700', color: Colors.white},
  adminItem: {flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, marginBottom: 8},
  adminUid: {flex: 1, fontSize: 13, color: Colors.slate300, fontFamily: 'monospace'},
  removeAdminText: {color: Colors.red500, fontSize: 18, fontWeight: '700', paddingLeft: 12},
});

export default AdminPanelScreen;
