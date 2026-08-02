import React from 'react';
import { X } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, url, title }) => {
  if (!isOpen) return null;

  const isYouTubeEmbed = url.includes("youtube.com/embed") || url.includes("youtu.be");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h3 className="text-lg font-bold text-white truncate max-w-xl">{title}</h3>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative aspect-video w-full bg-black">
          {isYouTubeEmbed ? (
            <iframe
              src={url}
              title={title}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={url}
              controls
              autoPlay
              className="h-full w-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};