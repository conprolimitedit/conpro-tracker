'use client'
import React from 'react'

const CircularProgress = ({ 
  value, 
  max = 100, 
  size = 120, 
  strokeWidth = 8, 
  color = '#3B82F6',
  label = '',
  showValue = true,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const normalizedValue = Math.min(Math.max(value, 0), max)
  const offset = circumference - (normalizedValue / max) * circumference

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        {/* Center text */}
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color }}>
                {Math.round(normalizedValue)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">%</div>
            </div>
          </div>
        )}
      </div>
      {label && (
        <div className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
          {label}
        </div>
      )}
    </div>
  )
}

export default CircularProgress

