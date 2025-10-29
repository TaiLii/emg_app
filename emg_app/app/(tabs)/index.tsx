import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">EMG Monitor</ThemedText>
      </ThemedView>

      <ThemedText style={styles.subtitle}>
        EMG Muscle Sensor Output.
      </ThemedText>

      <Image
        source={require('@/assets/images/graph.png')}
        style={styles.graph}
        contentFit="contain"
      />

      <ThemedText style={styles.description}>
        Current muscle group being tracked
      </ThemedText>

      <Image
        source={require('@/assets/images/musclegroup.png')}
        style={styles.muscle}
        contentFit="contain"
      />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
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
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 20,
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
});