import React from "react";
import { useStreamMetadata } from "../hooks/useStreamMetadata";

const StreamMetadataDisplay: React.FC = () => {
  const metadata = useStreamMetadata();

  const nowPlaying = metadata.artist
    ? `${metadata.artist} - ${metadata.title}`
    : metadata.title || "Loading...";

  return (
    <div className="flex flex-col justify-center min-w-0 pr-4">
      <span className="text-sm md:text-base font-medium text-[#00FF00] leading-tight line-clamp-2 break-words">
        {nowPlaying}
      </span>
      {metadata.listeners !== undefined && metadata.listeners > 0 && (
        <span className="text-xs text-slate-400 leading-tight line-clamp-1 break-words mt-0.5">
          Listeners: {metadata.listeners}
        </span>
      )}
    </div>
  );
};

export default StreamMetadataDisplay;