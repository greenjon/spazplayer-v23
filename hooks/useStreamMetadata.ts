import { useEffect, useState } from "react";
import { StreamMetadata } from "../types";

const STATUS_URL = "https://radio.spaz.org:8060/status-json.xsl";
const NOW_PLAYING_URL = "//radio.spaz.org/streams/playing-jsonp";

export const useStreamMetadata = (refreshRate = 10000) => {
  const [metadata, setMetadata] = useState<StreamMetadata>({
    title: "Connecting...",
    artist: "",
    listeners: 0,
  });

  useEffect(() => {
    const callbackName = "update_meta";

    // Fetch listeners from Icecast
    const fetchListeners = async (): Promise<number> => {
      try {
        const response = await fetch(STATUS_URL);
        if (!response.ok) throw new Error("Network response was not ok");

        const data: any = await response.json();
        let source = data.icestats?.source;
        if (Array.isArray(source)) source = source[0];
        return source?.listeners || 0;
      } catch (error) {
        console.warn("Failed to fetch listener count:", error);
        return 0;
      }
    };

    // JSONP callback
    (window as any)[callbackName] = async (data: { playing: string }) => {
      const listeners = await fetchListeners();

      let title = data.playing || "Radio Spaz";
      let artist = "";

      if (title.includes(" - ")) {
        [artist, title] = title.split(" - ").map((s) => s.trim());
      }

      setMetadata({ title, artist, listeners });
    };

    // Load JSONP script
    const loadData = () => {
      // Remove existing script if any (though cleanup handles this, safe to double check)
      const existing = document.getElementById('jsonp-script');
      if (existing) existing.remove();

      const script = document.createElement("script");
      script.id = 'jsonp-script';
      script.src = `${NOW_PLAYING_URL}?callback=${callbackName}&_=${Date.now()}`; // Add cache buster
      document.head.appendChild(script);
      
      script.onload = () => {
        setTimeout(() => {
           if (document.head.contains(script)) {
             document.head.removeChild(script);
           }
        }, 1000); 
      };
      
      script.onerror = () => {
          if (document.head.contains(script)) {
             document.head.removeChild(script);
           }
      };
    };

    loadData();
    const interval = setInterval(loadData, refreshRate);

    return () => {
      clearInterval(interval);
      delete (window as any)[callbackName];
    };
  }, [refreshRate]);

  return metadata;
};