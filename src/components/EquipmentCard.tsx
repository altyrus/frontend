import { Equipment, EquipmentStatus } from '@/types/equipment';
import { Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface EquipmentCardProps {
  equipment: Equipment;
  onClick?: () => void;
}

export function EquipmentCard({ equipment, onClick }: EquipmentCardProps) {
  const getStatusIcon = (status: EquipmentStatus) => {
    switch (status) {
      case EquipmentStatus.ONLINE:
      case EquipmentStatus.RUNNING:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case EquipmentStatus.OFFLINE:
      case EquipmentStatus.STOPPED:
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case EquipmentStatus.ERROR:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case EquipmentStatus.MAINTENANCE:
        return <Activity className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: EquipmentStatus) => {
    switch (status) {
      case EquipmentStatus.ONLINE:
      case EquipmentStatus.RUNNING:
        return 'border-green-500';
      case EquipmentStatus.OFFLINE:
      case EquipmentStatus.STOPPED:
        return 'border-gray-400';
      case EquipmentStatus.ERROR:
        return 'border-red-500';
      case EquipmentStatus.MAINTENANCE:
        return 'border-yellow-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${getStatusColor(
        equipment.status
      )} cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{equipment.name}</h3>
          <p className="text-sm text-gray-500">{equipment.type}</p>
        </div>
        {getStatusIcon(equipment.status)}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Status:</span>
          <span className="font-medium">{equipment.status}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Location:</span>
          <span className="font-medium">{equipment.location}</span>
        </div>

        {Object.entries(equipment.parameters).slice(0, 2).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-gray-600 capitalize">{key}:</span>
            <span className="font-medium">{value?.toString()}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Last update: {new Date(equipment.lastUpdate).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
