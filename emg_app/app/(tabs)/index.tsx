import { AppColors } from '@/constants/styles';
import { useAuth } from '@/context/auth-context-enhanced';
import { useEMGManager } from '@/hooks/use-emg-manager';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

// Cross-platform alert
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function HomeScreen() {
  const [dataPoints, setDataPoint] = useState([20, 45, 28, 80, 99, 43, 50]);
  const [newData, setNewData] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('General');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { user, signOut, isSignedIn } = useAuth();
  const { sessions, isLoading } = useEMGManager(user?.id || null);
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      router.replace('/login');
    }
  }, [isSignedIn, router]);

  const handleAddData = async () => {
    const numbers = newData
      .split(',')
      .map((n) => parseFloat(n.trim()))
      .filter((n) => !isNaN(n));
    
    if (!numbers.length) {
      showAlert('Error', 'Please enter valid numbers separated by commas');
      return;
    }

    try {
      setDataPoint(numbers);
      setNewData('');
      showAlert('Success', 'EMG data recorded successfully!');
    } catch (error) {
      showAlert('Error', 'Failed to record data');
      console.error('Error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (e) {
      console.error('Logout error:', e);
      showAlert('Error', 'Failed to logout. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={24} color={AppColors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greetingText}>Welcome back,</Text>
              <Text style={styles.usernameText}>{user?.username || 'User'}</Text>
            </View>
          </View>
          <Pressable 
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={AppColors.error} />
          </Pressable>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="pulse" size={28} color={AppColors.white} />
              <Text style={styles.statNumber}>{dataPoints.length}</Text>
              <Text style={styles.statLabel}>Data Points</Text>
            </LinearGradient>
          </View>
          <View style={[styles.statCard, styles.statCardSecondary]}>
            <LinearGradient
              colors={['#06B6D4', '#3B82F6']}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="fitness" size={28} color={AppColors.white} />
              <Text style={styles.statNumber}>{sessions.length}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="analytics" size={22} color={AppColors.gray700} />
              <Text style={styles.sectionTitle}>EMG Output</Text>
            </View>
            <View style={styles.muscleGroupBadge}>
              <Text style={styles.muscleGroupBadgeText}>{muscleGroup}</Text>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: dataPoints.map((_, i) => String(i + 1)),
                datasets: [{ data: dataPoints }],
              }}
              width={Dimensions.get('window').width - 72}
              height={200}
              yAxisSuffix="µV"
              chartConfig={{
                backgroundColor: AppColors.white,
                backgroundGradientFrom: AppColors.white,
                backgroundGradientTo: AppColors.white,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                labelColor: () => AppColors.gray500,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: AppColors.primaryDark,
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: AppColors.gray200,
                  strokeWidth: 1,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Record New Data</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Muscle Group</Text>
            <View style={[
              styles.inputContainer,
              focusedInput === 'muscle' && styles.inputFocused
            ]}>
              <Ionicons name="body-outline" size={20} color={AppColors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Biceps, Triceps"
                placeholderTextColor={AppColors.gray400}
                value={muscleGroup}
                onChangeText={setMuscleGroup}
                onFocus={() => setFocusedInput('muscle')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMG Values</Text>
            <View style={[
              styles.inputContainer,
              focusedInput === 'data' && styles.inputFocused
            ]}>
              <Ionicons name="pulse-outline" size={20} color={AppColors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 30, 50, 60, 70, 90"
                placeholderTextColor={AppColors.gray400}
                value={newData}
                onChangeText={setNewData}
                onFocus={() => setFocusedInput('data')}
                onBlur={() => setFocusedInput(null)}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed
            ]}
            onPress={handleAddData}
          >
            <Ionicons name="add-circle-outline" size={22} color={AppColors.white} />
            <Text style={styles.saveButtonText}>Save & Graph</Text>
          </Pressable>
        </View>

        {/* Muscle Diagram */}
        <View style={styles.diagramSection}>
          <Text style={styles.sectionTitle}>Muscle Reference</Text>
          <View style={styles.diagramCard}>
            <Image
              source={require('@/assets/images/musclegroup.png')}
              style={styles.muscleImage}
              contentFit="contain"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundLight,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.gray500,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    gap: 2,
  },
  greetingText: {
    fontSize: 14,
    color: AppColors.gray500,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.gray900,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonPressed: {
    backgroundColor: '#FCA5A5',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardPrimary: {},
  statCardSecondary: {},
  statGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.white,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  chartSection: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.gray800,
  },
  muscleGroupBadge: {
    backgroundColor: AppColors.primaryLight + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  muscleGroupBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.primary,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  inputSection: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginTop: 16,
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
  saveButton: {
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  saveButtonPressed: {
    backgroundColor: AppColors.primaryDark,
  },
  saveButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  diagramSection: {
    marginBottom: 16,
  },
  diagramCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  muscleImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
});
