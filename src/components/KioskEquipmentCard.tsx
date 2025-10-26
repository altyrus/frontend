import { Equipment, EquipmentStatus } from '@/types/equipment';
import { Activity, AlertCircle, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

interface KioskEquipmentCardProps {
  equipment: Equipment;
  onClick: () => void;
}

export function KioskEquipmentCard({ equipment, onClick }: KioskEquipmentCardProps) {
  const getStatusIcon = (status: EquipmentStatus) => {
    switch (status) {
      case EquipmentStatus.ONLINE:
      case EquipmentStatus.RUNNING:
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case EquipmentStatus.OFFLINE:
      case EquipmentStatus.STOPPED:
        return <XCircle className="w-16 h-16 text-gray-400" />;
      case EquipmentStatus.ERROR:
        return <AlertCircle className="w-16 h-16 text-red-500" />;
      case EquipmentStatus.MAINTENANCE:
        return <Activity className="w-16 h-16 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: EquipmentStatus) => {
    switch (status) {
      case EquipmentStatus.ONLINE:
      case EquipmentStatus.RUNNING:
        return 'bg-green-100 border-green-500';
      case EquipmentStatus.OFFLINE:
      case EquipmentStatus.STOPPED:
        return 'bg-gray-100 border-gray-400';
      case EquipmentStatus.ERROR:
        return 'bg-red-100 border-red-500';
      case EquipmentStatus.MAINTENANCE:
        return 'bg-yellow-100 border-yellow-500';
      default:
        return 'bg-white border-gray-300';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`${getStatusColor(
        equipment.status
      )} border-8 rounded-3xl p-8 w-full text-left transition-all active:scale-95 shadow-2xl hover:shadow-3xl`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          {getStatusIcon(equipment.status)}
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{equipment.name}</h2>
            <p className="text-2xl text-gray-600">{equipment.type}</p>
          </div>
        </div>
        <ChevronRight className="w-16 h-16 text-gray-400" />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-4">
        <div className="bg-white bg-opacity-60 rounded-xl p-4">
          <p className="text-xl text-gray-600 mb-1">Status</p>
          <p className="text-3xl font-bold text-gray-900">{equipment.status}</p>
        </div>
        <div className="bg-white bg-opacity-60 rounded-xl p-4">
          <p className="text-xl text-gray-600 mb-1">Location</p>
          <p className="text-3xl font-bold text-gray-900">{equipment.location}</p>
        </div>
      </div>

      {Object.entries(equipment.parameters).slice(0, 3).map(([key, value]) => (
        <div key={key} className="bg-white bg-opacity-60 rounded-xl p-4 mb-3">
          <p className="text-xl text-gray-600 mb-1 capitalize">{key}</p>
          <p className="text-3xl font-bold text-gray-900">{value?.toString()}</p>
        </div>
      ))}
    </button>
  );
}
