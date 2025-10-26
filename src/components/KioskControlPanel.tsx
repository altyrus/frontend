import { useState } from 'react';
import { Equipment, EquipmentCommand } from '@/types/equipment';
import { mqttService } from '@/services/mqttService';
import { Play, Square, RotateCcw, AlertTriangle, ArrowLeft, Plus, Minus } from 'lucide-react';
import { Button } from './Button';

interface KioskControlPanelProps {
  equipment: Equipment;
  onBack: () => void;
}

export function KioskControlPanel({ equipment, onBack }: KioskControlPanelProps) {
  const [loading, setLoading] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');

  const sendCommand = async (command: string, parameters?: Record<string, unknown>) => {
    setLoading(true);
    setLastCommand(command.toUpperCase());
    try {
      const cmd: EquipmentCommand = {
        equipmentId: equipment.id,
        command,
        parameters,
        timestamp: new Date(),
      };
      mqttService.sendCommand(cmd);
      console.log('Command sent:', cmd);

      // Show feedback for 2 seconds
      setTimeout(() => {
        setLastCommand('');
      }, 2000);
    } catch (error) {
      console.error('Failed to send command:', error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const adjustParameter = (key: string, currentValue: number, delta: number) => {
    const newValue = currentValue + delta;
    sendCommand('set_parameter', { [key]: newValue });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      {/* Header */}
      <div className="mb-8">
        <Button onClick={onBack} variant="secondary" icon={<ArrowLeft />}>
          BACK TO EQUIPMENT LIST
        </Button>
      </div>

      {/* Equipment Info */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-4 border-gray-300">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">{equipment.name}</h1>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-2xl p-6 border-4 border-blue-200">
            <p className="text-2xl text-gray-600 mb-2">Type</p>
            <p className="text-4xl font-bold text-blue-900">{equipment.type}</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6 border-4 border-green-200">
            <p className="text-2xl text-gray-600 mb-2">Status</p>
            <p className="text-4xl font-bold text-green-900">{equipment.status}</p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-6 border-4 border-purple-200">
            <p className="text-2xl text-gray-600 mb-2">Location</p>
            <p className="text-4xl font-bold text-purple-900">{equipment.location}</p>
          </div>
        </div>
      </div>

      {/* Command Feedback */}
      {lastCommand && (
        <div className="bg-blue-600 text-white rounded-3xl p-6 mb-8 text-center border-4 border-blue-700 animate-pulse">
          <p className="text-4xl font-bold">COMMAND SENT: {lastCommand}</p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-4 border-gray-300">
        <h2 className="text-4xl font-bold mb-8 text-gray-900">EQUIPMENT CONTROLS</h2>
        <div className="grid grid-cols-2 gap-8">
          <Button
            onClick={() => sendCommand('start')}
            disabled={loading}
            variant="success"
            icon={<Play />}
            fullWidth
          >
            START
          </Button>

          <Button
            onClick={() => sendCommand('stop')}
            disabled={loading}
            variant="danger"
            icon={<Square />}
            fullWidth
          >
            STOP
          </Button>

          <Button
            onClick={() => sendCommand('reset')}
            disabled={loading}
            variant="primary"
            icon={<RotateCcw />}
            fullWidth
          >
            RESET
          </Button>

          <Button
            onClick={() => sendCommand('emergency_stop')}
            disabled={loading}
            variant="warning"
            icon={<AlertTriangle />}
            fullWidth
          >
            EMERGENCY STOP
          </Button>
        </div>
      </div>

      {/* Parameters */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-gray-300">
        <h2 className="text-4xl font-bold mb-8 text-gray-900">PARAMETERS</h2>
        <div className="space-y-6">
          {Object.entries(equipment.parameters).map(([key, value]) => {
            const numValue = typeof value === 'number' ? value : 0;
            return (
              <div
                key={key}
                className="bg-gray-50 rounded-2xl p-6 border-4 border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="text-3xl font-bold text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <span className="text-5xl font-bold text-blue-600">
                    {value?.toString()}
                  </span>
                </div>
                {typeof value === 'number' && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => adjustParameter(key, numValue, -10)}
                      disabled={loading}
                      className="flex-1 bg-red-500 text-white rounded-xl py-6 text-3xl font-bold active:scale-95 transition-transform disabled:opacity-50"
                    >
                      <Minus className="w-12 h-12 mx-auto" />
                    </button>
                    <button
                      onClick={() => adjustParameter(key, numValue, -1)}
                      disabled={loading}
                      className="flex-1 bg-orange-500 text-white rounded-xl py-6 text-3xl font-bold active:scale-95 transition-transform disabled:opacity-50"
                    >
                      - 1
                    </button>
                    <button
                      onClick={() => adjustParameter(key, numValue, 1)}
                      disabled={loading}
                      className="flex-1 bg-green-500 text-white rounded-xl py-6 text-3xl font-bold active:scale-95 transition-transform disabled:opacity-50"
                    >
                      + 1
                    </button>
                    <button
                      onClick={() => adjustParameter(key, numValue, 10)}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white rounded-xl py-6 text-3xl font-bold active:scale-95 transition-transform disabled:opacity-50"
                    >
                      <Plus className="w-12 h-12 mx-auto" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
