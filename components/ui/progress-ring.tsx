'use client';

import React from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  disableTransition?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 88, // Default size for podium
  strokeWidth = 4,
  children,
  disableTransition,
}) => {
  const normalizedRadius = (size - strokeWidth) / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isCompleted = progress >= 100;

  // Determine color based on completion
  const progressColor = isCompleted ? 'stroke-green-500' : 'stroke-blue-500';
  const transitionClass = disableTransition ? '' : 'transition-all duration-300 ease-in-out';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        height={size}
        width={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background Circle */}
        <circle
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Circle */}
        <circle
          className={`${transitionClass} ${progressColor}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
      {isCompleted && (
        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-white rounded-full p-0.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-xs">
            ✅
          </span>
        </div>
      )}
    </div>
  );
};
