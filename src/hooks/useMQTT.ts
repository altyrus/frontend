import { useEffect, useRef, useState } from 'react';
import { mqttService } from '@/services/mqttService';

export function useMQTT() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const connectionAttempted = useRef(false);

  useEffect(() => {
    if (connectionAttempted.current) return;
    connectionAttempted.current = true;

    mqttService
      .connect()
      .then(() => setIsConnected(true))
      .catch((err) => {
        setError(err);
        setIsConnected(false);
      });

    return () => {
      mqttService.disconnect();
    };
  }, []);

  return { isConnected, error, mqttService };
}

export function useMQTTSubscription<T>(
  topic: string,
  callback: (data: T) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (data: unknown) => callback(data as T);
    mqttService.subscribe(topic, handler);

    return () => {
      mqttService.unsubscribe(topic, handler);
    };
  }, [topic, callback, enabled]);
}
