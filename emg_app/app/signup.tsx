import { ThemedText } from '@/components/themed-text';
import * as db from '@/utils/database';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const router = useRouter();

  // Simple email validation regex
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    console.log('Signup button pressed');
    setFeedbackMessage(null);
    setFeedbackType(null);
    if (!username || !email || !password || !confirmPassword) {
      const msg = 'Please fill in all fields';
      setFeedbackType('error');
      setFeedbackMessage(msg);
      Alert.alert('Error', msg);
      return;
    }

    if (username.length < 3) {
      const msg = 'Username must be at least 3 characters';
      setFeedbackType('error');
      setFeedbackMessage(msg);
      Alert.alert('Error', msg);
      return;
    }

    if (!isValidEmail(email)) {
      const msg = 'Please enter a valid email address';
      setFeedbackType('error');
      setFeedbackMessage(msg);
      Alert.alert('Error', msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters';
      setFeedbackType('error');
      setFeedbackMessage(msg);
      Alert.alert('Error', msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match';
      setFeedbackType('error');
      setFeedbackMessage(msg);
      Alert.alert('Error', msg);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Calling createUser with:', username, email);
      await db.createUser(username, email, password);
      console.log('User created successfully');
      setFeedbackType('success');
      setFeedbackMessage('Successfully signed up! Redirecting to login...');
      Alert.alert('Success', 'Account successfully created! Please log in with your credentials.', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/login');
          },
        },
      ]);
    } catch (error) {
      console.error('Signup error:', error);
      const msg = error instanceof Error ? error.message : 'An error occurred';
      setFeedbackType('error');
      setFeedbackMessage(msg);
      Alert.alert('Signup Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>EMG App</ThemedText>
        <ThemedText style={styles.subtitle}>Create Account</ThemedText>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            editable={!isLoading}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <ThemedText style={styles.eyeIcon}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!isLoading}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <ThemedText style={styles.eyeIcon}>
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
            )}
          </TouchableOpacity>

          {feedbackMessage && (
            <ThemedText style={[styles.feedback, feedbackType === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
              {feedbackMessage}
            </ThemedText>
          )}
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <ThemedText style={styles.linkText}>Sign In</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  feedback: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  feedbackSuccess: {
    color: '#0a7f00',
  },
  feedbackError: {
    color: '#b00020',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
