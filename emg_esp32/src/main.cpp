#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>


void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);

  BLEDevice::init("EMG-ESP32"); 
  BLEServer *pServer = BLEDevice::createServer();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->start();

  Serial.println("BLE advertising started.");
}

void loop() {
  delay(1000);
}
