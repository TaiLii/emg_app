import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEmgData } from '../../src/emg/EmgDataContext'; // use relative to avoid alias issues

function parseCsvDate(s: string): Date | null {
  // Your CSV uses M/D/YYYY (e.g., 1/28/2026). JS usually parses it, but we’ll be safe.
  const parts = s.split('/').map(p => p.trim());
  if (parts.length !== 3) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  const [mStr, dStr, yStr] = parts;
  const m = Number(mStr);
  const dNum = Number(dStr);
  const y = Number(yStr);
  if (!Number.isFinite(m) || !Number.isFinite(dNum) || !Number.isFinite(y)) return null;
  const dt = new Date(y, m - 1, dNum);
  return isNaN(dt.getTime()) ? null : dt;
}

function dayKey(dt: Date) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function ExploreScreen() {
  const { data, isLoaded } = useEmgData();

  const { avgUv, peakUv, totalSessions, hasLast7 } = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const last7 = data.filter((r) => {
      const dt = parseCsvDate(r.timestamp);
      return dt ? dt >= sevenDaysAgo && dt <= now : false;
    });

    const values = last7.map(r => r.value).filter(v => Number.isFinite(v));
    const avgUv = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const peakUv = values.length ? Math.max(...values) : 0;

    // Sessions: unique days in last 7 days (since your CSV is daily)
    const sessionDays = new Set<string>();
    for (const r of last7) {
      const dt = parseCsvDate(r.timestamp);
      if (dt) sessionDays.add(dayKey(dt));
    }

    return {
      avgUv,
      peakUv,
      totalSessions: sessionDays.size,
      hasLast7: last7.length > 0,
    };
  }, [data]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Weekly EMG Stats
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Your performance summary for the past 7 days
        </ThemedText>

        <ThemedText style={{ textAlign: 'center', opacity: 0.7, marginBottom: 10 }}>
          {`Rows loaded: ${data.length}`}
        </ThemedText>

        {!isLoaded ? (
          <ThemedText style={styles.subtitle}>Loading saved data…</ThemedText>
        ) : data.length === 0 ? (
          <ThemedText style={styles.subtitle}>No CSV loaded yet. Upload one on the Home tab.</ThemedText>
        ) : !hasLast7 ? (
          <ThemedText style={styles.subtitle}>No EMG entries found in the last 7 days.</ThemedText>
        ) : (
          <>
            <View style={styles.card}>
              <ThemedText type="subtitle">Avg Muscle Activation</ThemedText>
              <ThemedText style={styles.stat}>{avgUv.toFixed(1)} µV</ThemedText>
            </View>

            <View style={styles.card}>
              <ThemedText type="subtitle">Total Sessions</ThemedText>
              <ThemedText style={styles.stat}>{totalSessions}</ThemedText>
            </View>

            <View style={styles.card}>
              <ThemedText type="subtitle">Peak Output</ThemedText>
              <ThemedText style={styles.stat}>{peakUv.toFixed(1)} µV</ThemedText>
            </View>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, padding: 20 },
  title: { textAlign: 'center', marginBottom: 8, fontSize: 26 },
  subtitle: { textAlign: 'center', marginBottom: 25, opacity: 0.7 },
  card: { backgroundColor: '#2C2C2E', padding: 20, borderRadius: 16, marginBottom: 15 },
  stat: { fontSize: 22, marginTop: 4 },
});
