export interface Task {
  id: string;
  title: string;
  description?: string;
  plantType: PlantType;
  completed: boolean;
  streak: number;
  createdAt: Date;
}

export interface Plant {
  id: string;
  name: string;
  type: PlantType;
  growth: number;
  health: number;
  lastWatered: Date;
}

export enum PlantType {
  EXERCISE = 'exercise',
  STUDY = 'study',
  WORK = 'work',
  SELFCARE = 'selfcare',
  CREATIVE = 'creative'
}
