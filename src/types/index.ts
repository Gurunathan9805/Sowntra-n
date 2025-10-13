export interface BoardData {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  isPublic: boolean;
  ownerId: string;
  createdAt: Date;
  lastModified: Date;
}

export interface ProjectData {
  elements: Element[];
  pages: Page[];
  settings?: ProjectSettings;
}

export interface Element {
  id: string;
  type: 'text' | 'shape' | 'image' | 'line' | 'draw';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  properties: any;
}

export interface Page {
  id: string;
  name: string;
  elements: Element[];
}

export interface ProjectSettings {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor?: string;
  gridEnabled?: boolean;
  snapToGrid?: boolean;
}

export interface UserStats {
  ownedBoards: number;
  sharedBoards: number;
  totalAssets: number;
  memberSince: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

