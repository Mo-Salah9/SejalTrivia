import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useAuth} from '../contexts/AuthContext';
import {translations} from '../translations';
import {Colors} from '../theme/colors';
import Logo from '../components/Logo';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUpScreen: React.FC<Props> = ({navigation}) => {
  const {signUp, signInWithGoogle, signInWithApple} = useAuth();
  const t = translations.ar;
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setError(t.fill_all_fields || 'يرجى ملء جميع الحقول');
      return;
    }
    if (password !== confirmPassword) {
      setError(t.passwords_dont_match || 'كلمات المرور غير متطابقة');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await signUp(email, password, displayName);
      if (result?.requiresVerification) {
        navigation.navigate('VerifyEmail', {email});
      } else {
        navigation.replace('Landing');
      }
    } catch (err: any) {
      if (err.requiresVerification) {
        navigation.navigate('VerifyEmail', {email: err.email || email});
      } else {
        setError(err.message || 'Sign up failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigation.replace('Landing');
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithApple();
      navigation.replace('Landing');
    } catch (err: any) {
      setError(err.message || 'Apple Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Logo size="lg" appTitle={t.app_title} />
          <Text style={styles.title}>{t.create_account || 'إنشاء حساب'}</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t.display_name || 'الاسم'}</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t.display_name || 'الاسم'}
              placeholderTextColor={Colors.slate500}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t.email}</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t.email}
              placeholderTextColor={Colors.slate500}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t.password}</Text>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t.password}
              placeholderTextColor={Colors.slate500}
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {t.confirm_password || 'تأكيد كلمة المرور'}
            </Text>
            <TextInput
              ref={confirmRef}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t.confirm_password || 'تأكيد كلمة المرور'}
              placeholderTextColor={Colors.slate500}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.slate950} />
            ) : (
              <Text style={styles.submitBtnText}>{t.sign_up}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={handleGoogleSignIn}
            disabled={loading}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialBtn, {backgroundColor: Colors.white}]}
              onPress={handleAppleSignIn}
              disabled={loading}>
              <Text style={[styles.socialIcon, {color: Colors.black}]}>
                {'\uF8FF'}
              </Text>
              <Text style={[styles.socialText, {color: Colors.black}]}>
                Apple
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {t.already_have_account || 'لديك حساب؟'}{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchLink}>{t.sign_in}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.slate900},
  scrollContent: {flexGrow: 1, justifyContent: 'center', padding: 24},
  content: {alignItems: 'center'},
  title: {fontSize: 28, fontWeight: '900', color: Colors.white, marginTop: 24, marginBottom: 24, writingDirection: 'rtl'},
  errorText: {color: Colors.red500, fontSize: 13, marginBottom: 12, textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 12, width: '100%', overflow: 'hidden'},
  inputContainer: {width: '100%', marginBottom: 14},
  inputLabel: {fontSize: 13, fontWeight: '700', color: Colors.slate400, marginBottom: 6, writingDirection: 'rtl'},
  input: {backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 14, fontSize: 16, color: Colors.white, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl'},
  submitBtn: {width: '100%', paddingVertical: 16, borderRadius: 16, backgroundColor: Colors.orange500, alignItems: 'center', marginBottom: 20},
  submitBtnDisabled: {opacity: 0.6},
  submitBtnText: {fontSize: 16, fontWeight: '900', color: Colors.slate950},
  divider: {flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20},
  dividerLine: {flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)'},
  dividerText: {color: Colors.slate500, fontSize: 12, fontWeight: '700', paddingHorizontal: 16},
  socialBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12, gap: 10},
  socialIcon: {fontSize: 18, fontWeight: '800', color: Colors.white},
  socialText: {fontSize: 15, fontWeight: '700', color: Colors.white},
  switchRow: {flexDirection: 'row', marginTop: 8},
  switchText: {color: Colors.slate400, fontSize: 14},
  switchLink: {color: Colors.orange400, fontSize: 14, fontWeight: '700'},
});

export default SignUpScreen;
