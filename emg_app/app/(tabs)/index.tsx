import React, { useMemo, useState } from 'react';
import { Button, Dimensions, StyleSheet, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { Picker } from '@react-native-picker/picker';

import { ThemedText } from '@/components/themed-text';
import { useEmgData, type EMGRow } from '@/src/emg/EmgDataContext';

type NoticeType = 'info' | 'error' | 'success';

function parseNumber(v: unknown) {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function setNotice(
  setFn: React.Dispatch<React.SetStateAction<{ type: NoticeType; text: string } | null>>,
  type: NoticeType,
  text: string
) {
  setFn({ type, text });
}

export default function HomeScreen() {
  // ✅ Mock data should still display by default (like before)
  const mockDataPoints = useMemo(() => [20, 45, 28, 80, 99, 43, 50], []);

  // Global persisted dataset (from CSV) — can be empty
  const { data, setDataAndPersist, clearData, isLoaded } = useEmgData();

  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [notice, setNoticeState] = useState<{ type: NoticeType; text: string } | null>({
    type: 'info',
    text: 'Showing mock data. Upload a CSV to graph real readings.',
  });

  const muscles = useMemo(() => {
    const uniq = Array.from(new Set(data.map((d) => d.muscle))).filter(Boolean);
    uniq.sort();
    return uniq;
  }, [data]);

  // ✅ If CSV data exists, graph that; otherwise graph mock data
  const graphValues = useMemo(() => {
    if (data.length === 0) return mockDataPoints;
    const rows = selectedMuscle === 'All' ? data : data.filter((d) => d.muscle === selectedMuscle);
    const vals = rows.map((r) => r.value).filter((v) => Number.isFinite(v));
    return vals.length ? vals : mockDataPoints; // fallback if filter yields nothing
  }, [data, selectedMuscle, mockDataPoints]);

  const pickCSV = async () => {
    try {
      setNotice(setNoticeState, 'info', 'Opening file picker…');

      const result = await DocumentPicker.getDocumentAsync({
        // On iOS, CSV may come through with different MIME types, so allow any and validate later
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        setNotice(setNoticeState, 'info', 'File selection canceled.');
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        setNotice(setNoticeState, 'error', 'No file URI returned from picker.');
        return;
      }

      const name = asset.name ?? 'selected file';
      if (!name.toLowerCase().endsWith('.csv')) {
        setNotice(setNoticeState, 'error', `Selected file is not a CSV: ${name}`);
        return;
      }

      const text = await fetch(asset.uri).then((res) => res.text());
      if (!text || text.trim().length === 0) {
        setNotice(setNoticeState, 'error', 'CSV file is empty.');
        return;
      }

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (res) => {
          try {
            // Expect columns similar to: timestamp, muscle, value
            const rows = (res.data as any[])
              .map((row): EMGRow | null => {
                const timestamp = String(row['date'] ?? '').trim();
                const muscle = String(row['muscle group'] ?? '').trim();
                const value = parseNumber(row['emg output (uv)']);

                if (!timestamp || !muscle || value === null) return null;
                return { timestamp, muscle, value };
              })
              .filter(Boolean) as EMGRow[];


            if (rows.length === 0) {
              setNotice(
                setNoticeState,
                'error',
                'Parsed 0 valid rows. Check your CSV headers/columns (expected timestamp, muscle, value).'
              );
              return;
            }

            await setDataAndPersist(rows);
            setSelectedMuscle('All');

            const m = Array.from(new Set(rows.map((r) => r.muscle))).filter(Boolean);
            setNotice(
              setNoticeState,
              'success',
              `Loaded ${rows.length} rows from ${name}. Muscles detected: ${m.length}.`
            );
          } catch (e: any) {
            setNotice(setNoticeState, 'error', `Failed after parsing: ${e?.message ?? String(e)}`);
          }
        },
        error: (err: unknown) => {
          const message =
            typeof err === 'object' && err !== null && 'message' in err
              ? String((err as any).message)
              : String(err);

          setNotice(setNoticeState, 'error', `CSV parse error: ${message}`);
        },
      });
    } catch (e: any) {
      setNotice(setNoticeState, 'error', `Upload failed: ${e?.message ?? String(e)}`);
    }
  };

  const onClear = async () => {
    await clearData();
    setSelectedMuscle('All');
    setNotice(setNoticeState, 'info', 'Cleared CSV data. Showing mock data again.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedText style={styles.subtitle}>EMG Muscle Sensor Output</ThemedText>

      <View style={styles.row}>
        <Button title="Upload CSV" onPress={pickCSV} />
        <Button title="Clear CSV" onPress={onClear} />
      </View>

      {/* Notice / error banner */}
      {notice && (
        <View
          style={[
            styles.notice,
            notice.type === 'error' && styles.noticeError,
            notice.type === 'success' && styles.noticeSuccess,
          ]}
        >
          <ThemedText style={styles.noticeText}>{notice.text}</ThemedText>
        </View>
      )}

      {/* Muscle dropdown only when we have real CSV data */}
      {isLoaded && data.length > 0 && (
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedMuscle}
            onValueChange={(v) => setSelectedMuscle(v)}
            style={styles.picker}
            dropdownIconColor={Platform.OS === 'web' ? '#fff' : undefined}
          >
            <Picker.Item label="All" value="All" />
            {muscles.map((m) => (
              <Picker.Item key={m} label={m} value={m} />
            ))}
          </Picker>
        </View>
      )}


      <LineChart
        data={{
          labels: graphValues.map((_, i) => String(i + 1)), // scales with point count
          datasets: [{ data: graphValues }],
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
        }}
        bezier
        style={styles.chart}
      />

      <ThemedText style={styles.footer}>
        {data.length > 0
          ? `Graphing ${selectedMuscle === 'All' ? 'all muscles' : selectedMuscle} (${data.length} total rows loaded).`
          : 'Graphing mock data (no CSV loaded).'}
      </ThemedText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, padding: 20 },
  subtitle: { textAlign: 'center', fontSize: 16, opacity: 0.8, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  chart: { borderRadius: 12, marginTop: 16 },

  notice: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  noticeError: { backgroundColor: 'rgba(255,0,0,0.18)' },
  noticeSuccess: { backgroundColor: 'rgba(0,255,120,0.16)' },
  noticeText: { opacity: 0.95 },

  footer: { marginTop: 10, textAlign: 'center', opacity: 0.7 },

  pickerWrapper: {
  marginTop: 12,
  borderRadius: 10,
  overflow: 'hidden',
  ...Platform.select({
    web: {
      backgroundColor: '#2C2C2E',
      borderWidth: 1,
      borderColor: '#555',
    },
    default: {},
  }),
  },
  picker: {
    ...Platform.select({
      web: {
        color: '#fff',
        backgroundColor: '#2C2C2E', // critical for web
        paddingHorizontal: 10,
        height: 44,
      },
      default: {
        color: '#fff',
      },
    }),
  },

});
