import React from 'react';

const Shimmer: React.FC = () => (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/50"></div>
);

const SkeletonBox: React.FC<{className?: string}> = ({ className }) => (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-700 ${className}`}>
        <Shimmer />
    </div>
);

export const PatientListSkeleton: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col bg-bg-secondary rounded-[2.5rem] shadow-sm border border-border-primary animate-pulse">
      <div className="p-6 flex items-center justify-between gap-4 shrink-0 border-b border-border-primary">
        <SkeletonBox className="h-12 rounded-2xl flex-1" />
        <SkeletonBox className="h-12 w-48 rounded-2xl" />
      </div>
      <div className="flex-1 overflow-auto no-scrollbar p-4 space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonBox key={i} className="h-16 rounded-2xl w-full" />
        ))}
      </div>
    </div>
  );
};


export const PatientDetailSkeleton: React.FC = () => {
    return (
        <div className="h-full w-full flex flex-col bg-bg-secondary rounded-[2.5rem] shadow-sm border border-border-primary animate-pulse">
            {/* Header */}
            <div className="p-6 flex items-center justify-between gap-4 shrink-0 border-b border-border-primary">
                <div className="flex items-center gap-6">
                    <SkeletonBox className="h-16 w-16 rounded-2xl" />
                    <div>
                        <SkeletonBox className="h-6 w-48 rounded-md mb-2" />
                        <SkeletonBox className="h-4 w-32 rounded-md" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <SkeletonBox className="h-12 w-12 rounded-lg" />
                    <SkeletonBox className="h-12 w-36 rounded-xl" />
                </div>
            </div>
            {/* Tabs */}
            <div className="p-2 border-b border-border-primary flex items-center gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonBox key={i} className="h-10 w-24 rounded-lg" />
                ))}
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto no-scrollbar p-6 space-y-6">
                <SkeletonBox className="h-24 w-full rounded-2xl" />
                <div className="grid grid-cols-3 gap-6">
                    <SkeletonBox className="h-32 rounded-2xl" />
                    <SkeletonBox className="h-32 rounded-2xl" />
                    <SkeletonBox className="h-32 rounded-2xl" />
                </div>
                <SkeletonBox className="h-48 w-full rounded-2xl" />
            </div>
        </div>
    );
};