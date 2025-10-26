import { useState } from 'react';
import { Equipment, EquipmentCommand } from '@/types/equipment';
import { mqttService } from '@/services/mqttService';
import { Play, Square, RotateCcw, AlertTriangle } from 'lucide-react';

interface EquipmentControlProps {
  equipment: Equipment;
}

export function EquipmentControl({ equipment }: EquipmentControlProps) {
  const [loading, setLoading] = useState(false);

  const sendCommand = async (command: string, parameters?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const cmd: EquipmentCommand = {
        equipmentId: equipment.id,
        command,
        parameters,
        timestamp: new Date(),
      };
      mqttService.sendCommand(cmd);
      console.log('Command sent:', cmd);
    } catch (error) {
      console.error('Failed to send command:', error);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Equipment Control</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => sendCommand('start')}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          <Play className="w-5 h-5" />
          Start
        </button>

        <button
          onClick={() => sendCommand('stop')}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
        >
          <Square className="w-5 h-5" />
          Stop
        </button>

        <button
          onClick={() => sendCommand('reset')}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>

        <button
          onClick={() => sendCommand('emergency_stop')}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
        >
          <AlertTriangle className="w-5 h-5" />
          E-Stop
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700">Parameters</h3>
        {Object.entries(equipment.parameters).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-600 capitalize">{key}</label>
            <input
              type="number"
              defaultValue={value as number}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                if (!isNaN(newValue)) {
                  sendCommand('set_parameter', { [key]: newValue });
                }
              }}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
