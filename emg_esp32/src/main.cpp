#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

const int EMG_PIN = 34;

const int sampleRate = 5;    // Hz (1 kS/s)
const unsigned long periodMs = 1000 / sampleRate;
unsigned long lastSampleTime = 0;

static BLECharacteristic* txChar;
static bool deviceConnected = false;

class ServerCB : public BLEServerCallbacks {
  void onConnect(BLEServer*) override { deviceConnected = true; }
  void onDisconnect(BLEServer*) override {
    deviceConnected = false;
    BLEDevice::startAdvertising();
  }
};


void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);

  Serial.println("Hello World");

  analogReadResolution(12);        // 0–4095
  analogSetAttenuation(ADC_11db);  // ~0–3.3 V range

  BLEDevice::init("ESP32-EMG");
  BLEServer* server = BLEDevice::createServer();
  server->setCallbacks(new ServerCB());

  BLEService* service = server->createService("1234");

  txChar = service->createCharacteristic(
    "ABCD",
    BLECharacteristic::PROPERTY_NOTIFY
  );
  txChar->addDescriptor(new BLE2902());

  service->start();

  BLEAdvertising* adv = BLEDevice::getAdvertising();
  adv->addServiceUUID("1234");
  adv->start();


  Serial.println("Advertising ESP32-EMG. Connect and enable Notify on ABCD.");
  Serial.println("Starting sampling...");
}


void loop() {
  uint32_t now = millis();
  if (now - lastSampleTime >= periodMs) {
    lastSampleTime += periodMs;

    int raw = analogRead(EMG_PIN);

    // Send as text (easy to view in nRF Connect)
    char msg[16];
    snprintf(msg, sizeof(msg), "%d", raw);

    if (deviceConnected) {
      txChar->setValue((uint8_t*)msg, strlen(msg));
      txChar->notify();
    }

    // optional: still print to serial
    float voltage = raw * (3.3 / 4095.0);
    Serial.print(msg);
    Serial.print(",");
    Serial.println(voltage);
  }
}
