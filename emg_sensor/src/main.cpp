#include <Arduino.h>

// put function declarations here:

const int emgPin = A0;          // AD2 W1 connected here
const int sampleRate = 1000;    // Hz (1 kS/s)
const unsigned long periodUs = 1000000UL / sampleRate;

unsigned long lastSampleTime = 0;

void setup() {
  Serial.begin(115200);
  // small delay to let serial come up
  Serial.println("Hello World");
  delay(15000);
  Serial.println("Starting in 15 Seconds");
  delay(15000);
}

void loop() {
  unsigned long now = micros();

  if (now - lastSampleTime >= periodUs) {
    lastSampleTime += periodUs;   // keep it regular, not drift

    int raw = analogRead(emgPin); // 0..1023
    float voltage = raw * (5.0 / 1023.0);

    // CSV-style output: time_us,raw,voltage
    Serial.print(now);
    Serial.print(',');
    Serial.print(raw);
    Serial.print(',');
    Serial.println(voltage, 3);
  }
}


