import React from 'react'
import { FiTrendingUp, FiCheckCircle, FiClock, FiXCircle, FiCalendar } from 'react-icons/fi'

const DataCard = ({ title, value, icon, trend, trendValue, color = 'blue' }) => {
  const getIcon = () => {
    switch (icon) {
      case 'trending':
        return <FiTrendingUp className="w-4 h-4" />
      case 'completed':
        return <FiCheckCircle className="w-4 h-4" />
      case 'pending':
        return <FiClock className="w-4 h-4" />
      case 'abandoned':
        return <FiXCircle className="w-4 h-4" />
      case 'upcoming':
        return <FiCalendar className="w-4 h-4" />
      default:
        return <FiTrendingUp className="w-4 h-4" />
    }
  }

  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
          icon: 'text-green-600 dark:text-green-400',
          border: 'border-green-200 dark:border-green-700',
          hover: 'hover:border-green-300 dark:hover:border-green-600',
          title: 'text-green-700 dark:text-green-300',
          value: 'text-green-900 dark:text-green-100'
        }
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
          icon: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-700',
          hover: 'hover:border-blue-300 dark:hover:border-blue-600',
          title: 'text-blue-700 dark:text-blue-300',
          value: 'text-blue-900 dark:text-blue-100'
        }
      case 'yellow':
        return {
          bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
          icon: 'text-yellow-600 dark:text-yellow-400',
          border: 'border-yellow-200 dark:border-yellow-700',
          hover: 'hover:border-yellow-300 dark:hover:border-yellow-600',
          title: 'text-yellow-700 dark:text-yellow-300',
          value: 'text-yellow-900 dark:text-yellow-100'
        }
      case 'red':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
          icon: 'text-red-600 dark:text-red-400',
          border: 'border-red-200 dark:border-red-700',
          hover: 'hover:border-red-300 dark:hover:border-red-600',
          title: 'text-red-700 dark:text-red-300',
          value: 'text-red-900 dark:text-red-100'
        }
      case 'purple':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
          icon: 'text-purple-600 dark:text-purple-400',
          border: 'border-purple-200 dark:border-purple-700',
          hover: 'hover:border-purple-300 dark:hover:border-purple-600',
          title: 'text-purple-700 dark:text-purple-300',
          value: 'text-purple-900 dark:text-purple-100'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20',
          icon: 'text-gray-600 dark:text-gray-400',
          border: 'border-gray-200 dark:border-gray-700',
          hover: 'hover:border-gray-300 dark:hover:border-gray-600',
          title: 'text-gray-700 dark:text-gray-300',
          value: 'text-gray-900 dark:text-gray-100'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 border ${colors.bg} ${colors.border} ${colors.hover} group cursor-pointer`}>
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm ${colors.icon}`}>
            {getIcon()}
          </div>

          <p className={`!text-xs font-semibold uppercase tracking-wider ${colors.title}`}>
            {title}
          </p>

          {trend && (
            <div className={`flex items-center space-x-1 text-xs font-medium ${
              trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <span>{trend === 'up' ? '↗' : '↘'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
       
          <h4 className={`text-[2em] text-center font-bold ${colors.value}`}>
            {value}
          </h4>
        </div>
        
        {/* Subtle Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
      </div>
    </div>
  )
}

export default DataCard
