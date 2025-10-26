export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  location: string;
  parameters: EquipmentParameters;
  lastUpdate: Date;
}

export enum EquipmentType {
  MOTOR = 'MOTOR',
  VALVE = 'VALVE',
  PUMP = 'PUMP',
  SENSOR = 'SENSOR',
  CONVEYOR = 'CONVEYOR',
  ROBOT = 'ROBOT',
}

export enum EquipmentStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
}

export interface EquipmentParameters {
  speed?: number;
  temperature?: number;
  pressure?: number;
  position?: number;
  power?: number;
  [key: string]: number | string | boolean | undefined;
}

export interface EquipmentCommand {
  equipmentId: string;
  command: string;
  parameters?: Record<string, unknown>;
  timestamp: Date;
}

export interface EquipmentTelemetry {
  equipmentId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}
