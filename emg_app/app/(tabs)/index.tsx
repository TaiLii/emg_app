import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Dimensions, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import * as db from '@/utils/database';

export default function HomeScreen()  {
  const [dataPoints, setDataPoint] = useState([20, 45, 28, 80, 99, 43, 50]);
  const [newData, setNewData] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [muscleGroup, setMuscleGroup] = useState("General");
  const { user, signOut, isSignedIn } = useAuth();
  const router = useRouter();

  // Load user's EMG data from database on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (user?.id) {
          const userEMGData = await db.getLatestEMGData(user.id, 1);
          if (userEMGData && userEMGData.length > 0) {
            setDataPoint(userEMGData[0].values);
            setMuscleGroup(userEMGData[0].muscleGroup);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user?.id]);

  // Immediately redirect if signed out
  useEffect(() => {
    if (!isSignedIn) {
      console.log('Home: detected signed out, redirecting to login');
      router.replace('/login');
    }
  }, [isSignedIn, router]);

  // Belt-and-suspenders: if auth state flips to signed out, navigate to login
  useEffect(() => {
    if (!isSignedIn) {
      router.replace('/login');
    }
  }, [isSignedIn]);

  const handleAddData = async () => {
    const numbers = newData
      .split(',')
      .map((n) => parseFloat(n))
      .filter((n) => !isNaN(n));
    
    if (!numbers.length) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    try {
      if (user?.id) {
        await db.addEMGData(user.id, numbers, muscleGroup);
        setDataPoint(numbers);
        setNewData('');
        Alert.alert('Success', 'EMG data saved to database');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save data');
      console.error('Error saving data:', error);
    }
  };

  const handleLogout = async () => {
    console.log('Logout button pressed');
    try {
      console.log('Starting signOut...');
      await signOut();
      console.log('SignOut complete');
      console.log('Navigating to login...');
      router.replace('/login');
      console.log('Router.replace called');
    } catch (e) {
      console.error('Logout error:', e);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <ThemedText style={styles.welcomeText}>
            Welcome, {user?.username}!
          </ThemedText>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.subtitle}>
          EMG Muscle Sensor Output
        </ThemedText>

        <LineChart
          data={{
            labels: dataPoints.map((_, i) => String(i + 1)),
            datasets: [{ data: dataPoints }],
          }}
          width={Dimensions.get('window').width - 40}
          height={220}
          yAxisSuffix="µV"
          chartConfig={{
            backgroundColor: '#1D3D47',
            backgroundGradientFrom: '#1D3D47',
            backgroundGradientTo: '#3F7182',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#00BFFF',
            },
          }}
          bezier
          style={styles.chart}
        />

        <ThemedText style={styles.description}>
          Enter new values separated by commas
        </ThemedText>

        <TextInput
          value={muscleGroup}
          onChangeText={setMuscleGroup}
          placeholder="e.g., Biceps, Triceps"
          placeholderTextColor="#999"
          style={styles.muscleInput}
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={newData}
            onChangeText={setNewData}
            placeholder="e.g. 30,50,60,70,90"
            placeholderTextColor="#999"
            style={styles.input}
          />
          <Button title="Save & Graph" onPress={handleAddData} />
        </View>

        <ThemedText style={styles.description}>
          Muscle group: {muscleGroup}
        </ThemedText>

        <Image
          source={require('@/assets/images/musclegroup.png')}
          style={styles.muscle}
          contentFit="contain"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 20,
  },
  graphHeader: {
    height: 200,
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  graph: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  muscle: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
    lineHeight: 20,
  },
  chart: {
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 25,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 10,
    paddingHorizontal: 10,
    color: '#fff',
    height: 40,
  },
  muscleInput: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 10,
    paddingHorizontal: 10,
    color: '#fff',
    height: 40,
    marginBottom: 15,
  },
});
