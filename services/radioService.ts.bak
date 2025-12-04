import { IcecastStats, StreamMetadata } from '../types';

// The status URL for Icecast servers is typically /status-json.xsl
const STATUS_URL = 'https://radio.spaz.org:8060/status-json.xsl';

export const fetchStreamMetadata = async (): Promise<StreamMetadata> => {
  try {
    const response = await fetch(STATUS_URL);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: IcecastStats = await response.json();
    
    // Parse Icecast JSON structure
    // It can vary, usually data.icestats.source is an object or array of mounts
    let source = data.icestats?.source;

    if (Array.isArray(source)) {
      // If multiple mounts, try to find the one matching our stream or just take the first
      source = source[0];
    }

    if (source) {
      return {
        title: source.title || 'Unknown Track',
        artist: source.artist || '',
        listeners: source.listeners || 0,
      };
    }

    return { title: 'Radio Spaz', artist: 'Live Stream' };
  } catch (error) {
    console.warn('Failed to fetch metadata:', error);
    return { title: 'Radio Spaz', artist: 'Connecting...' };
  }
};