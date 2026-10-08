import React, { useEffect, useState } from 'react';
import { Megaphone, AlertCircle, Info, Flame, ChevronRight, X } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

export default function AnnouncementTicker() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.announcements && Array.isArray(data.announcements)) {
            setAnnouncements(data.announcements);
          }
        }
      } catch (err) {
        // Silently fail if offline
      }
    };

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isDismissed || announcements.length === 0) {
    return null;
  }

  // Choose styling tone based on first announcement's severity
  const primary = announcements[0];
  const isDanger = primary.type === 'danger';
  const isWarning = primary.type === 'warning';

  const bgClasses = isDanger
    ? 'bg-rose-950 text-rose-100 border-b border-rose-800'
    : isWarning
    ? 'bg-amber-950 text-amber-100 border-b border-amber-800'
    : 'bg-slate-900 text-slate-100 border-b border-slate-800';

  const badgeClasses = isDanger
    ? 'bg-rose-600/30 text-rose-300 border-rose-500/40'
    : isWarning
    ? 'bg-amber-600/30 text-amber-300 border-amber-500/40'
    : 'bg-blue-600/30 text-blue-300 border-blue-500/40';

  return (
    <div className={`relative w-full overflow-hidden text-xs font-medium transition-all ${bgClasses}`}>
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        {/* Left Badge */}
        <div className="flex items-center gap-2 shrink-0 z-10 pr-2 border-r border-white/10">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${badgeClasses}`}>
            {isDanger ? <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> : isWarning ? <Flame className="w-3.5 h-3.5 text-amber-400" /> : <Megaphone className="w-3.5 h-3.5 text-blue-400" />}
            Alerts
          </span>
        </div>

        {/* Smooth Scrolling Marquee Area */}
        <div className="relative flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-flex animate-ticker whitespace-nowrap items-center gap-12 hover:[animation-play-state:paused] cursor-pointer">
            {/* Duplicated list so the marquee loops seamlessly without blank gaps */}
            {[...announcements, ...announcements, ...announcements].map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="inline-flex items-center gap-2 text-xs">
                <span className="font-semibold underline decoration-white/30 underline-offset-2">
                  {item.title}:
                </span>
                <span className="text-white/90">
                  {item.message}
                </span>
                <span className="text-white/40 select-none">•</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Dismiss Button */}
        <div className="shrink-0 z-10 pl-2">
          <button
            onClick={() => setIsDismissed(true)}
            title="Dismiss announcement banner"
            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tickerLoop {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          display: inline-flex;
          animation: tickerLoop 35s linear infinite;
        }
      `}</style>
    </div>
  );
}
