import mqtt, { MqttClient } from 'mqtt';
import { EquipmentCommand, EquipmentTelemetry } from '@/types/equipment';

export class MQTTService {
  private client: MqttClient | null = null;
  private subscribers: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(
    private brokerUrl: string = import.meta.env.VITE_MQTT_BROKER_URL || 'ws://localhost:9001',
    private options: mqtt.IClientOptions = {}
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(this.brokerUrl, {
          clientId: `automation-ui-${Math.random().toString(16).slice(2, 10)}`,
          clean: true,
          reconnectPeriod: 5000,
          ...this.options,
        });

        this.client.on('connect', () => {
          console.log('MQTT connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.client.on('error', (error) => {
          console.error('MQTT connection error:', error);
          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        });

        this.client.on('reconnect', () => {
          this.reconnectAttempts++;
          if (this.reconnectAttempts > this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.client?.end();
          }
        });

        this.client.on('message', (topic, message) => {
          this.handleMessage(topic, message);
        });

        this.client.on('close', () => {
          console.log('MQTT connection closed');
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.subscribers.clear();
    }
  }

  subscribe(topic: string, callback: (data: unknown) => void): void {
    if (!this.client) {
      console.error('MQTT client not connected');
      return;
    }

    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    }

    this.subscribers.get(topic)?.add(callback);
  }

  unsubscribe(topic: string, callback?: (data: unknown) => void): void {
    if (!this.client) return;

    if (callback) {
      this.subscribers.get(topic)?.delete(callback);
      if (this.subscribers.get(topic)?.size === 0) {
        this.subscribers.delete(topic);
        this.client.unsubscribe(topic);
      }
    } else {
      this.subscribers.delete(topic);
      this.client.unsubscribe(topic);
    }
  }

  publish(topic: string, message: unknown): void {
    if (!this.client) {
      console.error('MQTT client not connected');
      return;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Failed to publish to ${topic}:`, err);
      }
    });
  }

  sendCommand(command: EquipmentCommand): void {
    const topic = `equipment/${command.equipmentId}/commands`;
    this.publish(topic, command);
  }

  subscribeTelemetry(equipmentId: string, callback: (data: EquipmentTelemetry) => void): void {
    const topic = `equipment/${equipmentId}/telemetry`;
    this.subscribe(topic, callback as (data: unknown) => void);
  }

  subscribeStatus(equipmentId: string, callback: (data: unknown) => void): void {
    const topic = `equipment/${equipmentId}/status`;
    this.subscribe(topic, callback);
  }

  private handleMessage(topic: string, message: Buffer): void {
    try {
      const data = JSON.parse(message.toString());
      const callbacks = this.subscribers.get(topic);

      if (callbacks) {
        callbacks.forEach((callback) => callback(data));
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

// Singleton instance
export const mqttService = new MQTTService();
