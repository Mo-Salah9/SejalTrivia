import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useAuth} from '../contexts/AuthContext';
import {translations} from '../translations';
import {Colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;
type Step = 'email' | 'code' | 'success';

const ForgotPasswordScreen: React.FC<Props> = ({navigation}) => {
  const {resetPassword, confirmResetPassword} = useAuth();
  const t = translations.ar;
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRefs = useRef<(TextInput | null)[]>([]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError(t.enter_email || 'أدخل بريدك الإلكتروني');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setStep('code');
      startCooldown();
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCodeChange = (text: string, index: number) => {
    // Handle paste
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').split('').slice(0, 6);
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (i + index < 6) newCode[i + index] = d;
      });
      setCode(newCode);
      const nextIdx = Math.min(index + digits.length, 5);
      codeRefs.current[nextIdx]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    const codeStr = code.join('');
    if (codeStr.length !== 6) {
      setError(t.enter_code || 'أدخل الرمز المكون من 6 أرقام');
      return;
    }
    if (!newPassword.trim()) {
      setError(t.enter_new_password || 'أدخل كلمة المرور الجديدة');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await confirmResetPassword(email, codeStr, newPassword);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← {t.back || 'رجوع'}</Text>
        </TouchableOpacity>

        {step === 'email' && (
          <View style={styles.content}>
            <Text style={styles.emoji}>🔒</Text>
            <Text style={styles.title}>
              {t.forgot_password || 'نسيت كلمة المرور'}
            </Text>
            <Text style={styles.subtitle}>
              {t.forgot_desc || 'سنرسل لك رمز لإعادة تعيين كلمة المرور'}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t.email}
                placeholderTextColor={Colors.slate500}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.disabled]}
              onPress={handleSendCode}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={Colors.slate950} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {t.send_code || 'أرسل الرمز'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'code' && (
          <View style={styles.content}>
            <Text style={styles.emoji}>📧</Text>
            <Text style={styles.title}>
              {t.enter_code_title || 'أدخل الرمز'}
            </Text>
            <Text style={styles.subtitle}>{email}</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.codeRow}>
              {code.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={ref => (codeRefs.current[idx] = ref)}
                  style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
                  value={digit}
                  onChangeText={text => handleCodeChange(text, idx)}
                  onKeyPress={({nativeEvent}) =>
                    handleCodeKeyPress(nativeEvent.key, idx)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={idx === 0}
                  selectTextOnFocus
                />
              ))}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {t.new_password || 'كلمة المرور الجديدة'}
              </Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t.new_password || 'كلمة المرور الجديدة'}
                placeholderTextColor={Colors.slate500}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.disabled]}
              onPress={handleConfirm}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={Colors.slate950} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {t.reset_password || 'إعادة تعيين'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={resendCooldown > 0}
              onPress={handleSendCode}
              style={styles.resendBtn}>
              <Text
                style={[
                  styles.resendText,
                  resendCooldown > 0 && {color: Colors.slate600},
                ]}>
                {resendCooldown > 0
                  ? `${t.resend_in || 'إعادة الإرسال بعد'} ${resendCooldown}s`
                  : t.resend_code || 'إعادة إرسال الرمز'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'success' && (
          <View style={styles.content}>
            <Text style={styles.emoji}>✅</Text>
            <Text style={styles.title}>
              {t.password_reset_success || 'تم إعادة التعيين'}
            </Text>
            <Text style={styles.subtitle}>
              {t.password_reset_desc || 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة'}
            </Text>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.submitBtnText}>{t.sign_in}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.slate900},
  scrollContent: {flexGrow: 1, padding: 24, paddingTop: 48},
  backBtn: {marginBottom: 24},
  backBtnText: {color: Colors.slate400, fontSize: 15, fontWeight: '700'},
  content: {alignItems: 'center', flex: 1, justifyContent: 'center'},
  emoji: {fontSize: 56, marginBottom: 16},
  title: {fontSize: 26, fontWeight: '900', color: Colors.white, marginBottom: 8, writingDirection: 'rtl', textAlign: 'center'},
  subtitle: {fontSize: 14, color: Colors.slate400, marginBottom: 24, writingDirection: 'rtl', textAlign: 'center'},
  errorText: {color: Colors.red500, fontSize: 13, marginBottom: 12, textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 12, width: '100%'},
  inputContainer: {width: '100%', marginBottom: 16},
  inputLabel: {fontSize: 13, fontWeight: '700', color: Colors.slate400, marginBottom: 6, writingDirection: 'rtl'},
  input: {backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 14, fontSize: 16, color: Colors.white, fontWeight: '600', textAlign: 'right'},
  codeRow: {flexDirection: 'row', gap: 8, marginBottom: 24, justifyContent: 'center'},
  codeInput: {width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)', textAlign: 'center', fontSize: 24, fontWeight: '900', color: Colors.white},
  codeInputFilled: {borderColor: Colors.orange500, backgroundColor: 'rgba(249, 115, 22, 0.1)'},
  submitBtn: {width: '100%', paddingVertical: 16, borderRadius: 16, backgroundColor: Colors.orange500, alignItems: 'center', marginBottom: 16},
  disabled: {opacity: 0.6},
  submitBtnText: {fontSize: 16, fontWeight: '900', color: Colors.slate950},
  resendBtn: {padding: 8},
  resendText: {color: Colors.orange400, fontWeight: '700', fontSize: 14},
});

export default ForgotPasswordScreen;
