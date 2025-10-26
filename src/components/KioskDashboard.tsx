import { useEffect, useState } from 'react';
import { useEquipmentStore } from '@/store/equipmentStore';
import { KioskEquipmentCard } from './KioskEquipmentCard';
import { KioskControlPanel } from './KioskControlPanel';
import { useMQTT, useMQTTSubscription } from '@/hooks/useMQTT';
import { EquipmentTelemetry, EquipmentType } from '@/types/equipment';
import { Loader2, Wifi, WifiOff, Home } from 'lucide-react';

export function KioskDashboard() {
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
  const [filterType, setFilterType] = useState<EquipmentType | 'ALL'>('ALL');

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

  const allEquipment = getAllEquipment();
  const filteredEquipment =
    filterType === 'ALL'
      ? allEquipment
      : allEquipment.filter((eq) => eq.type === filterType);
  const selectedEquipment = selectedEquipmentId ? getEquipment(selectedEquipmentId) : null;

  // If equipment is selected, show control panel
  if (selectedEquipment) {
    return (
      <KioskControlPanel
        equipment={selectedEquipment}
        onBack={() => selectEquipment(null)}
      />
    );
  }

  // Get unique equipment types
  const equipmentTypes = Array.from(new Set(allEquipment.map((eq) => eq.type)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-2xl border-b-8 border-blue-900">
        <div className="max-w-[1920px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Home className="w-16 h-16 text-white" />
              <h1 className="text-6xl font-bold text-white">
                EQUIPMENT CONTROL
              </h1>
            </div>
            <div className="flex items-center gap-6 bg-white bg-opacity-20 rounded-2xl px-8 py-4">
              {isConnected ? (
                <>
                  <Wifi className="w-12 h-12 text-green-300" />
                  <span className="text-3xl font-bold text-white">CONNECTED</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-12 h-12 text-red-300" />
                  <span className="text-3xl font-bold text-white">DISCONNECTED</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-32 h-32 animate-spin text-blue-500" />
          </div>
        )}

        {error && (
          <div className="bg-red-500 text-white px-12 py-8 rounded-3xl mb-8 text-4xl font-bold border-8 border-red-700 shadow-2xl">
            ERROR: {error}
          </div>
        )}

        {!loading && (
          <>
            {/* Filter Buttons */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-6 text-gray-800">SELECT EQUIPMENT TYPE</h2>
              <div className="flex gap-6 flex-wrap">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-12 py-6 text-3xl font-bold rounded-2xl transition-all active:scale-95 shadow-lg ${
                    filterType === 'ALL'
                      ? 'bg-blue-600 text-white border-4 border-blue-800'
                      : 'bg-white text-gray-700 border-4 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  ALL ({allEquipment.length})
                </button>
                {equipmentTypes.map((type) => {
                  const count = allEquipment.filter((eq) => eq.type === type).length;
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-12 py-6 text-3xl font-bold rounded-2xl transition-all active:scale-95 shadow-lg ${
                        filterType === type
                          ? 'bg-blue-600 text-white border-4 border-blue-800'
                          : 'bg-white text-gray-700 border-4 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {type} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Equipment Grid */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-6 text-gray-800">
                TAP EQUIPMENT TO CONTROL
              </h2>
              {filteredEquipment.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-xl p-16 text-center border-4 border-gray-300">
                  <p className="text-4xl text-gray-500 font-bold">
                    NO EQUIPMENT FOUND
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {filteredEquipment.map((eq) => (
                    <KioskEquipmentCard
                      key={eq.id}
                      equipment={eq}
                      onClick={() => selectEquipment(eq.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-[1920px] mx-auto px-8 text-center">
          <p className="text-2xl">
            Last Update: {new Date().toLocaleString()}
          </p>
        </div>
      </footer>
    </div>
  );
}
