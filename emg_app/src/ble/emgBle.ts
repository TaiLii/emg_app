import { BleManager, Device } from "react-native-ble-plx";

// Use FULL UUIDs for iOS reliability
export const EMG_SERVICE_UUID = "00001234-0000-1000-8000-00805f9b34fb";
export const EMG_CHAR_UUID = "0000abcd-0000-1000-8000-00805f9b34fb";

const DEVICE_NAME = "ESP32-EMG";

export const ble = new BleManager();

function decodeAsciiFromBase64(b64: string): string {
  // No extra dependency needed
  return globalThis.atob(b64);
}

function normalize(s?: string | null) {
  return (s ?? "").trim();
}

export async function connectAndStreamEmg(
  onValue: (v: number) => void,
  onStatus?: (s: string) => void
): Promise<{ device: Device; disconnect: () => void }> {
  // --- Bluetooth state ---
  onStatus?.("Checking Bluetooth state…");
  const current = await ble.state();
  onStatus?.(`Bluetooth state: ${current}`);

  if (current !== "PoweredOn") {
    await new Promise<void>((resolve, reject) => {
      const sub = ble.onStateChange((state) => {
        onStatus?.(`Bluetooth state: ${state}`);
        if (state === "PoweredOn") {
          sub.remove();
          resolve();
        } else if (state === "Unauthorized") {
          sub.remove();
          reject(new Error("Bluetooth permission not granted (iOS Settings → Privacy → Bluetooth)."));
        }
      }, true);
    });
  }

  // --- Scan ---
  onStatus?.("Scanning for ESP32-EMG…");

  const device = await new Promise<Device>((resolve, reject) => {
    const timeoutMs = 25000;
    const timeout = setTimeout(() => {
      ble.stopDeviceScan();
      reject(new Error(`Scan timeout (${timeoutMs / 1000}s): ESP32-EMG not found.`));
    }, timeoutMs);

    let seen = 0;

    ble.startDeviceScan(null, { allowDuplicates: false }, (error, scanned) => {
      if (error) {
        clearTimeout(timeout);
        ble.stopDeviceScan();
        reject(error);
        return;
      }
      if (!scanned) return;

      const name = normalize(scanned.name);
      const localName = normalize((scanned as any).localName); // sometimes present
      const id = scanned.id;

      // Debug a few discoveries so you can see what the phone is seeing
      if (seen < 8 && (name || localName)) {
        seen += 1;
        onStatus?.(`Found: ${name || localName} (${id.slice(0, 8)}…)`);
      }

      // Match by name OR localName
      if (name === DEVICE_NAME || localName === DEVICE_NAME) {
        clearTimeout(timeout);
        ble.stopDeviceScan();
        resolve(scanned);
      }
    });
  });

  // --- Connect & Discover ---
  onStatus?.(`Connecting to ${DEVICE_NAME}…`);
  const connected = await device.connect({ autoConnect: false });

  onStatus?.("Discovering services…");
  await connected.discoverAllServicesAndCharacteristics();

  // --- Subscribe ---
  onStatus?.("Subscribing to EMG notifications…");

  const subscription = connected.monitorCharacteristicForService(
    EMG_SERVICE_UUID,
    EMG_CHAR_UUID,
    (error, char) => {
      if (error) {
        onStatus?.(`Stream error: ${error.message}`);
        return;
      }
      if (!char?.value) return;

      const ascii = decodeAsciiFromBase64(char.value).trim();
      const num = parseFloat(ascii);
      if (!Number.isNaN(num)) onValue(num);
    }
  );

  const disconnect = () => {
    try {
      subscription.remove();
    } catch {}
    connected.cancelConnection().catch(() => {});
  };

  onStatus?.("Connected ✅ Streaming…");
  return { device: connected, disconnect };
}