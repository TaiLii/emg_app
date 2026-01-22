import { AppColors } from '@/constants/styles';
import { useAuth } from '@/context/auth-context-enhanced';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Cross-platform alert
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { signUp } = useAuth();

  // Password requirement checks
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[@$!%*?&]/.test(password),
  };

  const allPasswordRequirementsMet = Object.values(passwordChecks).every(Boolean);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    console.log('[Signup] Button pressed');
    console.log('[Signup] Values:', { username, email, passwordLength: password.length });
    setFeedbackMessage(null);
    setFeedbackType(null);

    if (!username || !email || !password || !confirmPassword) {
      const msg = 'Please fill in all fields';
      console.log('[Signup] Validation failed:', msg);
      setFeedbackMessage(msg);
      setFeedbackType('error');
      return;
    }

    if (username.length < 3) {
      const msg = 'Username must be at least 3 characters';
      setFeedbackMessage(msg);
      setFeedbackType('error');
      return;
    }

    if (!isValidEmail(email)) {
      const msg = 'Please enter a valid email address';
      setFeedbackMessage(msg);
      setFeedbackType('error');
      return;
    }

    if (!allPasswordRequirementsMet) {
      const msg = 'Please meet all password requirements';
      setFeedbackMessage(msg);
      setFeedbackType('error');
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match';
      setFeedbackMessage(msg);
      setFeedbackType('error');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Signup] Calling signUp...');
      await signUp(username, email, password);
      console.log('[Signup] Success!');
      setFeedbackMessage('Account created successfully!');
      setFeedbackType('success');
    } catch (error) {
      console.error('[Signup] Error:', error);
      const message = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      setFeedbackMessage(message);
      setFeedbackType('error');
      showAlert('Signup Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <View style={styles.requirementRow}>
      <Ionicons 
        name={met ? 'checkmark-circle' : 'ellipse-outline'} 
        size={16} 
        color={met ? AppColors.success : AppColors.gray400} 
      />
      <Text style={[styles.requirementText, met && styles.requirementMet]}>{text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#A855F7']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <Ionicons name="pulse" size={40} color={AppColors.white} />
              </View>
              <Text style={styles.appName}>EMG App</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.welcomeText}>Create Account</Text>
              <Text style={styles.subtitleText}>Start tracking your muscle activity</Text>

              {feedbackMessage && (
                <View style={[
                  styles.feedbackBox, 
                  feedbackType === 'error' ? styles.feedbackError : styles.feedbackSuccess
                ]}>
                  <Ionicons 
                    name={feedbackType === 'error' ? 'alert-circle' : 'checkmark-circle'} 
                    size={20} 
                    color={feedbackType === 'error' ? AppColors.error : AppColors.success} 
                  />
                  <Text style={[
                    styles.feedbackText, 
                    feedbackType === 'error' ? styles.feedbackErrorText : styles.feedbackSuccessText
                  ]}>
                    {feedbackMessage}
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'username' && styles.inputFocused
                ]}>
                  <Ionicons name="person-outline" size={20} color={AppColors.gray400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a username"
                    placeholderTextColor={AppColors.gray400}
                    value={username}
                    onChangeText={setUsername}
                    onFocus={() => setFocusedInput('username')}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isLoading}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'email' && styles.inputFocused
                ]}>
                  <Ionicons name="mail-outline" size={20} color={AppColors.gray400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={AppColors.gray400}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isLoading}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'password' && styles.inputFocused
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={AppColors.gray400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor={AppColors.gray400}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color={AppColors.gray400} 
                    />
                  </Pressable>
                </View>
                
                {password.length > 0 && (
                  <View style={styles.requirementsBox}>
                    <PasswordRequirement met={passwordChecks.minLength} text="At least 8 characters" />
                    <PasswordRequirement met={passwordChecks.hasUppercase} text="One uppercase letter" />
                    <PasswordRequirement met={passwordChecks.hasLowercase} text="One lowercase letter" />
                    <PasswordRequirement met={passwordChecks.hasNumber} text="One number" />
                    <PasswordRequirement met={passwordChecks.hasSpecial} text="One special character (@$!%*?&)" />
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={[
                  styles.inputContainer,
                  focusedInput === 'confirmPassword' && styles.inputFocused,
                  confirmPassword.length > 0 && password !== confirmPassword && styles.inputError
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={AppColors.gray400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={AppColors.gray400}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color={AppColors.gray400} 
                    />
                  </Pressable>
                </View>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <Text style={styles.errorHint}>Passwords do not match</Text>
                )}
                {confirmPassword.length > 0 && password === confirmPassword && password.length > 0 && (
                  <View style={styles.matchRow}>
                    <Ionicons name="checkmark-circle" size={16} color={AppColors.success} />
                    <Text style={styles.matchText}>Passwords match</Text>
                  </View>
                )}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.signUpButton,
                  pressed && styles.signUpButtonPressed,
                  isLoading && styles.buttonDisabled
                ]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <>
                    <Text style={styles.signUpButtonText}>Create Account</Text>
                    <Ionicons name="arrow-forward" size={20} color={AppColors.white} style={{ marginLeft: 8 }} />
                  </>
                )}
              </Pressable>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/login" asChild>
                  <Pressable>
                    <Text style={styles.linkText}>Sign In</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.white,
    letterSpacing: -0.5,
  },
  formCard: {
    backgroundColor: AppColors.white,
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.gray900,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: AppColors.gray500,
    marginBottom: 24,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  feedbackError: {
    backgroundColor: AppColors.errorLight,
  },
  feedbackSuccess: {
    backgroundColor: AppColors.successLight,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  feedbackErrorText: {
    color: AppColors.error,
  },
  feedbackSuccessText: {
    color: AppColors.success,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.gray700,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.gray50,
    borderWidth: 1.5,
    borderColor: AppColors.gray200,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.white,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.gray900,
  },
  eyeButton: {
    padding: 8,
  },
  requirementsBox: {
    marginTop: 12,
    backgroundColor: AppColors.gray50,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    color: AppColors.gray500,
  },
  requirementMet: {
    color: AppColors.success,
  },
  errorHint: {
    marginTop: 8,
    fontSize: 13,
    color: AppColors.error,
    marginLeft: 4,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 13,
    color: AppColors.success,
  },
  signUpButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signUpButtonPressed: {
    backgroundColor: AppColors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: AppColors.gray500,
  },
  linkText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '600',
  },
});
