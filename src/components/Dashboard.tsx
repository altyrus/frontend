import { useEffect, useState } from 'react';
import { useEquipmentStore } from '@/store/equipmentStore';
import { EquipmentCard } from './EquipmentCard';
import { EquipmentControl } from './EquipmentControl';
import { useMQTT, useMQTTSubscription } from '@/hooks/useMQTT';
import { EquipmentTelemetry } from '@/types/equipment';
import { Loader2, Wifi, WifiOff } from 'lucide-react';

export function Dashboard() {
  const { isConnected } = useMQTT();
  const {
    getAllEquipment,
    fetchAllEquipment,
    loading,
    error,
    selectedEquipmentId,
    selectEquipment,
    getEquipment,
    updateEquipmentParameter,
  } = useEquipmentStore();

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      fetchAllEquipment();
      setInitialized(true);
    }
  }, [initialized, fetchAllEquipment]);

  // Subscribe to telemetry updates for all equipment
  useMQTTSubscription<EquipmentTelemetry>(
    'equipment/+/telemetry',
    (data) => {
      Object.entries(data.data).forEach(([key, value]) => {
        updateEquipmentParameter(data.equipmentId, key, value);
      });
    },
    isConnected
  );

  const equipment = getAllEquipment();
  const selectedEquipment = selectedEquipmentId ? getEquipment(selectedEquipmentId) : null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Industrial Automation Control
            </h1>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600">MQTT Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-600">MQTT Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equipment List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Equipment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipment.map((eq) => (
                <EquipmentCard
                  key={eq.id}
                  equipment={eq}
                  onClick={() => selectEquipment(eq.id)}
                />
              ))}
            </div>
          </div>

          {/* Control Panel */}
          <div className="lg:col-span-1">
            {selectedEquipment ? (
              <EquipmentControl equipment={selectedEquipment} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                Select equipment to view controls
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
