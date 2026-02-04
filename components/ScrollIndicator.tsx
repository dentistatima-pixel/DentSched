import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const ScrollIndicator: React.FC<{ containerRef: React.RefObject<HTMLDivElement> }> = ({ 
  containerRef 
}) => {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const isScrollable = container.scrollHeight > container.clientHeight;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
      setShowIndicator(isScrollable && !isAtBottom);
    };

    container.addEventListener('scroll', checkScroll);
    const observer = new ResizeObserver(checkScroll);
    observer.observe(container);
    
    checkScroll(); // Initial check

    return () => {
        container.removeEventListener('scroll', checkScroll);
        observer.disconnect();
    }
  }, [containerRef]);

  if (!showIndicator) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-bounce pointer-events-none">
      <div className="bg-teal-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <ChevronDown size={20} />
        <span className="text-sm font-bold">Scroll for more</span>
      </div>
    </div>
  );
};