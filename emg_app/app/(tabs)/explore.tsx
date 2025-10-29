import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Weekly EMG Stats
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Your performance summary for the past 7 days
        </ThemedText>

        <View style={styles.card}>
          <ThemedText type="subtitle">Avg Muscle Activation</ThemedText>
          <ThemedText style={styles.stat}>72%</ThemedText>
          <ThemedText style={styles.detail}>↑ 5% from last week</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">Total Sessions</ThemedText>
          <ThemedText style={styles.stat}>14</ThemedText>
          <ThemedText style={styles.detail}>~2 sessions per day</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">Peak Output</ThemedText>
          <ThemedText style={styles.stat}>98 µV</ThemedText>
          <ThemedText style={styles.detail}>Recorded on Sunday</ThemedText>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 26,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 25,
    opacity: 0.7,
  },
  card: {
    backgroundColor: '#2C2C2E',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stat: {
    fontSize: 22,
    marginTop: 4,
  },
  detail: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
});