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

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    setFeedbackMessage(null);
    setFeedbackType(null);
    
    if (!username || !password) {
      const msg = 'Please fill in all fields';
      setFeedbackMessage(msg);
      setFeedbackType('error');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(username, password);
      setFeedbackMessage('Login successful!');
      setFeedbackType('success');
    } catch (error) {
      let message = 'Login failed. Please try again.';
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('not found') || errorMsg.includes('invalid') || errorMsg.includes('credentials')) {
          message = 'Invalid username or password.';
        } else if (errorMsg.includes('password')) {
          message = 'Incorrect password. Please try again.';
        } else {
          message = error.message || 'Login failed. Please try again.';
        }
      }
      setFeedbackMessage(message);
      setFeedbackType('error');
      showAlert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

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
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="pulse" size={48} color={AppColors.white} />
            </View>
            <Text style={styles.appName}>EMG App</Text>
            <Text style={styles.tagline}>Track your muscle activity</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subtitleText}>Sign in to continue</Text>

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
                  placeholder="Enter your username"
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
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'password' && styles.inputFocused
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={AppColors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
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
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.signInButton,
                pressed && styles.signInButtonPressed,
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <>
                  <Text style={styles.signInButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color={AppColors.white} style={{ marginLeft: 8 }} />
                </>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/signup" asChild>
                <Pressable>
                  <Text style={styles.linkText}>Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
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
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: AppColors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
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
  signInButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signInButtonPressed: {
    backgroundColor: AppColors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
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
