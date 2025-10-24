'use client'
import React, { memo } from 'react'

const DefaultSkeleton = () => (
  <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
    <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded"></div>
  </div>
)

const ProjectList = ({
  items,
  isLoading,
  skeletonCount = 6,
  className,
  renderItem,
  renderSkeleton,
  emptyState
}) => {
  const Skeleton = renderSkeleton || DefaultSkeleton

  if (isLoading) {
    return (
      <div className={className}>
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <Skeleton key={idx} />
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return emptyState || null
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <React.Fragment key={item.project_id || index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </div>
  )
}

export default memo(ProjectList)


