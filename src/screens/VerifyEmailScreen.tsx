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

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

const VerifyEmailScreen: React.FC<Props> = ({navigation, route}) => {
  const {verifyEmail, resendVerification} = useAuth();
  const t = translations.ar;
  const email = route.params.email;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRefs = useRef<(TextInput | null)[]>([]);

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

  const handleVerify = async () => {
    const codeStr = code.join('');
    if (codeStr.length !== 6) {
      setError(t.enter_code || 'أدخل الرمز المكون من 6 أرقام');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyEmail(email, codeStr);
      navigation.replace('Landing');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendVerification(email);
      startCooldown();
    } catch (err: any) {
      setError(err.message || 'Failed to resend');
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

        <View style={styles.content}>
          <Text style={styles.emoji}>📧</Text>
          <Text style={styles.title}>{t.verify_email || 'تأكيد البريد'}</Text>
          <Text style={styles.subtitle}>
            {t.verify_desc || 'أدخل الرمز المرسل إلى'} {email}
          </Text>

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

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.disabled]}
            onPress={handleVerify}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.slate950} />
            ) : (
              <Text style={styles.submitBtnText}>
                {t.verify || 'تأكيد'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={resendCooldown > 0}
            onPress={handleResend}
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
  codeRow: {flexDirection: 'row', gap: 8, marginBottom: 24, justifyContent: 'center'},
  codeInput: {width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)', textAlign: 'center', fontSize: 24, fontWeight: '900', color: Colors.white},
  codeInputFilled: {borderColor: Colors.orange500, backgroundColor: 'rgba(249, 115, 22, 0.1)'},
  submitBtn: {width: '100%', paddingVertical: 16, borderRadius: 16, backgroundColor: Colors.orange500, alignItems: 'center', marginBottom: 16},
  disabled: {opacity: 0.6},
  submitBtnText: {fontSize: 16, fontWeight: '900', color: Colors.slate950},
  resendBtn: {padding: 8},
  resendText: {color: Colors.orange400, fontWeight: '700', fontSize: 14},
});

export default VerifyEmailScreen;
