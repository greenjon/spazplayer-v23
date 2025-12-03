export interface StreamMetadata {
  title: string;
  artist?: string;
  listeners?: number;
}

export enum VisualizationMode {
  OFF = 'OFF',
  OSCILLOSCOPE = 'OSCILLOSCOPE',
}

export interface IcecastStats {
  icestats?: {
    source?: {
      title?: string;
      artist?: string;
      listeners?: number;
    } | Array<{
      title?: string;
      listeners?: number;
    }>;
  };
}