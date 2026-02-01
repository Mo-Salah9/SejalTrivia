import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useAuth, isVerificationRequired} from '../contexts/AuthContext';
import {translations} from '../translations';
import {Colors} from '../theme/colors';
import Logo from '../components/Logo';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {signIn, signInWithGoogle, signInWithApple} = useAuth();
  const t = translations.ar;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigation.replace('Landing');
    } catch (err: any) {
      if (err.requiresVerification) {
        navigation.navigate('VerifyEmail', {email: err.email || email});
      } else {
        setError(err.message || 'Failed to sign in');
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

          <Text style={styles.title}>{t.welcome_back}</Text>
          <Text style={styles.subtitle}>{t.welcome_message}</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t.email}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t.email}
              placeholderTextColor={Colors.slate500}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
            />
          </View>

          {/* Password Input */}
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
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              editable={!loading}
            />
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>{t.forgot_password}</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.slate950} />
            ) : (
              <Text style={styles.submitBtnText}>{t.sign_in}</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign In */}
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={handleGoogleSignIn}
            disabled={loading}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialBtn, styles.appleSocialBtn]}
              onPress={handleAppleSignIn}
              disabled={loading}>
              <Text style={[styles.socialIcon, styles.appleIcon]}>
                {'\uF8FF'}
              </Text>
              <Text style={[styles.socialText, styles.appleText]}>Apple</Text>
            </TouchableOpacity>
          )}

          {/* Switch to Sign Up */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t.dont_have_account} </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.switchLink}>{t.sign_up}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slate900,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    marginTop: 24,
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.slate400,
    marginBottom: 24,
    writingDirection: 'rtl',
  },
  errorText: {
    color: Colors.red500,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    width: '100%',
    overflow: 'hidden',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate400,
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  forgotBtn: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  forgotText: {
    color: Colors.orange400,
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.orange500,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.slate950,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: Colors.slate500,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    gap: 10,
  },
  appleSocialBtn: {
    backgroundColor: Colors.white,
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  appleIcon: {
    color: Colors.black,
  },
  socialText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  appleText: {
    color: Colors.black,
  },
  switchRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  switchText: {
    color: Colors.slate400,
    fontSize: 14,
  },
  switchLink: {
    color: Colors.orange400,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LoginScreen;
