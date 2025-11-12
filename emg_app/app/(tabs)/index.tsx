import { Image } from 'expo-image';
import { useState } from 'react';
import { Button, Dimensions, StyleSheet, TextInput, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';

export default function HomeScreen()  {
  const [dataPoints, setDataPoint] = useState([20, 45, 28, 80, 99, 43, 50]);
  const [newData, setNewData] = useState("");

  const handleAddData = () => {
    const numbers = newData
    .split(',')
    .map((n) => parseFloat(n))
    .filter((n) => !isNaN(n));
    if (numbers.length) setDataPoint(numbers);
    setNewData('');
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedText style={styles.subtitle}>
        EMG Muscle Sensor Output.
      </ThemedText>

      <LineChart
        data={{
          labels: ['1', '2', '3', '4', '5', '6', '7','8','9','10'],
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
        Enter new values separated by commas.
      </ThemedText>

      <View style={styles.inputContainer}>
        <TextInput
          value={newData}
          onChangeText={setNewData}
          placeholder="e.g. 30,50,60,70,90"
          placeholderTextColor="#999"
          style={styles.input}
        />
        <Button title="Graph It" onPress={handleAddData} />
      </View>

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
    scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
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
   chart: {
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 20,
  },
    inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
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
});