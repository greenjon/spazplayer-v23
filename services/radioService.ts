import { StreamMetadata } from '../types';

interface RadioMount {
  title?: string;
  artist?: string;
  current_song?: string;
  listeners?: string | number;
}

interface SpazRadioResponse {
  mounts?: {
    [key: string]: RadioMount;
  };
}

const processMetadata = (title: string, artist: string | undefined, listeners: number | undefined): StreamMetadata => {
  let finalTitle = title;
  let finalArtist = artist || '';

  // Logic to separate Artist - Title if needed
  // Only split if no artist is provided and title contains separator
  if (!finalArtist && finalTitle && finalTitle.includes(' - ')) {
    const parts = finalTitle.split(' - ');
    if (parts.length >= 2) {
      finalArtist = parts[0].trim();
      finalTitle = parts.slice(1).join(' - ').trim();
    }
  } else if (finalArtist && finalTitle === finalArtist) {
    // If artist and title are identical, it might be a duplication in metadata
    // We leave it as is, or could clear artist, but usually safe to keep
  }

  return {
    title: finalTitle,
    artist: finalArtist,
    listeners
  };
};

export const fetchStreamMetadata = async (): Promise<StreamMetadata | null> => {
  try {
    const response = await fetch('https://radio.spaz.org/streams/playing-jsonp', {
      method: 'GET',
      headers: { 'Accept': '*/*' },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return null;

    const text = await response.text();

    // Attempt 1: Extract and parse JSON
    // The response is usually: parseMusic({ ...json... });
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      try {
        const data: SpazRadioResponse = JSON.parse(jsonString);
        
        // Check for /radio mount specifically
        if (data.mounts && data.mounts['/radio']) {
          const m = data.mounts['/radio'];
          return processMetadata(m.title || m.current_song || 'Spaz Radio', m.artist, Number(m.listeners));
        }
        
        // If /radio not found, maybe just take the first mount?
        // But for now, we trust the structure or fall through to regex
      } catch (e) {
        // JSON parse failed, fall through to Regex
      }
    }

    // Attempt 2: Regex Fallback
    // Parse specifically for "artist" and "title" if JSON structure is unexpected
    // This is robust against malformed JSON wrappers
    const titleMatch = text.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const artistMatch = text.match(/"artist"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const listenersMatch = text.match(/"listeners"\s*:\s*"?(\d+)"?/);

    if (titleMatch) {
      const rawTitle = titleMatch[1];
      const rawArtist = artistMatch ? artistMatch[1] : undefined;
      const rawListeners = listenersMatch ? parseInt(listenersMatch[1], 10) : undefined;
      
      return processMetadata(rawTitle, rawArtist, rawListeners);
    }

    return null;
  } catch (error) {
    return null;
  }
};