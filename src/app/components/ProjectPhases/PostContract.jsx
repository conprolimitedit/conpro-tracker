'use client'
import React, { useState } from 'react'

const PostContract = ({ initialCategory = 'consultant', initialSection = 'inception' }) => {
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [activeSection, setActiveSection] = useState(initialSection)
  const [statuses, setStatuses] = useState({
    // Consultant sections
    inception: 'unsubmitted',
    progressReports: 'unsubmitted',
    invoiceClaims: 'unsubmitted',
    siteMeetingMinutes: 'unsubmitted',
    handingOver: 'unsubmitted',
    defectLiability: 'unsubmitted',
    finalAccount: 'unsubmitted',
    // Contractor sections
    mobilization: 'unsubmitted',
    contractorProgressReports: 'unsubmitted',
    contractorIPCs: 'unsubmitted',
    contractorSiteMeetingMinutes: 'unsubmitted',
    contractorHandingOver: 'unsubmitted',
    contractorDefectLiability: 'unsubmitted',
    contractorFinalAccount: 'unsubmitted'
  })

  const categories = [
    { id: 'consultant', name: 'Post Contract - Consultant', icon: '👨‍💼' },
    { id: 'contractor', name: 'Post Contract - Contractor', icon: '👷‍♂️' }
  ]

  const consultantSections = [
    { id: 'inception', name: 'Inception Report', icon: '📋' },
    { id: 'progressReports', name: 'Progress Reports', icon: '📊' },
    { id: 'invoiceClaims', name: "Consultant's Invoice / Fee Claims", icon: '💰' },
    { id: 'siteMeetingMinutes', name: 'Site Meeting Minutes', icon: '📝' },
    { id: 'handingOver', name: 'Handing Over', icon: '🤝' },
    { id: 'defectLiability', name: 'Defect Liability', icon: '⚠️' },
    { id: 'finalAccount', name: 'Final Account', icon: '📋' }
  ]

  const contractorSections = [
    { id: 'mobilization', name: 'Mobilization to Sites', icon: '🚚' },
    { id: 'contractorProgressReports', name: 'Progress Reports', icon: '📊' },
    { id: 'contractorIPCs', name: 'Contractor IPCs', icon: '📈' },
    { id: 'contractorSiteMeetingMinutes', name: 'Site Meeting Minutes', icon: '📝' },
    { id: 'contractorHandingOver', name: 'Handing Over', icon: '🤝' },
    { id: 'contractorDefectLiability', name: 'Defect Liability Period', icon: '⚠️' },
    { id: 'contractorFinalAccount', name: 'Final Account', icon: '📋' }
  ]

  const updateStatus = (section, newStatus) => {
    setStatuses(prev => ({
      ...prev,
      [section]: newStatus
    }))
  }

  const StatusButtons = ({ section }) => (
    <div className="flex space-x-3">
      <button
        onClick={() => updateStatus(section, 'completed')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          statuses[section] === 'completed'
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        Completed
      </button>
      <button
        onClick={() => updateStatus(section, 'uncompleted')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          statuses[section] === 'uncompleted'
            ? 'bg-yellow-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        Uncompleted
      </button>
      <button
        onClick={() => updateStatus(section, 'unsubmitted')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          statuses[section] === 'unsubmitted'
            ? 'bg-red-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        Unsubmitted
      </button>
    </div>
  )

  const FileInput = ({ label, accept = "*", multiple = false }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
    </div>
  )

  const renderConsultantContent = () => {
    switch (activeSection) {
      case 'inception':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Inception Report</h3>
              <StatusButtons section="inception" />
            </div>
            <FileInput label="Inception Report Document" accept=".pdf,.doc,.docx" />
          </div>
        )

      case 'progressReports':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Progress Reports</h3>
              <StatusButtons section="progressReports" />
            </div>
            <FileInput label="Progress Reports" accept=".pdf,.doc,.docx" multiple={true} />
          </div>
        )

      case 'invoiceClaims':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Consultant's Invoice / Fee Claims</h3>
              <StatusButtons section="invoiceClaims" />
            </div>
            <FileInput label="Invoice Documents" accept=".pdf,.doc,.docx,.xlsx" multiple={true} />
          </div>
        )

      case 'siteMeetingMinutes':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Site Meeting Minutes</h3>
              <StatusButtons section="siteMeetingMinutes" />
            </div>
            <FileInput label="Site Meeting Minutes" accept=".pdf,.doc,.docx" multiple={true} />
          </div>
        )

      case 'handingOver':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Handing Over</h3>
              <StatusButtons section="handingOver" />
            </div>
            <FileInput label="Handing Over Documents" accept=".pdf,.doc,.docx" multiple={true} />
          </div>
        )

      case 'defectLiability':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Defect Liability</h3>
              <StatusButtons section="defectLiability" />
            </div>
            <FileInput label="Defect Liability Reports" accept=".pdf,.doc,.docx" multiple={true} />
          </div>
        )

      case 'finalAccount':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Final Account</h3>
              <StatusButtons section="finalAccount" />
            </div>
            <FileInput label="Final Account Documents" accept=".pdf,.doc,.docx,.xlsx" multiple={true} />
          </div>
        )

      default:
        return null
    }
  }

  const renderContractorContent = () => {
    switch (activeSection) {
      case 'mobilization':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Mobilization to Sites</h3>
              <StatusButtons section="mobilization" />
            </div>
            <FileInput label="Mobilization Documents" accept=".pdf,.doc,.docx,.jpg,.png" multiple={true} />
          </div>
        )

      case 'contractorProgressReports':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Progress Reports</h3>
              <StatusButtons section="contractorProgressReports" />
            </div>
            <FileInput label="Progress Reports" accept=".pdf,.doc,.docx" multiple={true} />
          </div>
        )

      case 'contractorIPCs':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Contractor IPCs</h3>
              <StatusButtons section="contractorIPCs" />
            </div>
            <FileInput label="Interim Payment Certificates" accept=".pdf,.doc,.docx,.xlsx" multiple={true} />
          </div>
        )

      case 'contractorSiteMeetingMinutes':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Site Meeting Minutes</h3>
              <StatusButtons section="contractorSiteMeetingMinutes" />
            </div>
            <FileInput label="Site Meeting Minutes" accept=".pdf,.doc,.docx" multiple={true} />
          </div>
        )

      case 'contractorHandingOver':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Handing Over</h3>
              <StatusButtons section="contractorHandingOver" />
            </div>
            <FileInput label="Handing Over Documents" accept=".pdf,.doc,.docx" multiple={true} />
          </div>
        )

      case 'contractorDefectLiability':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Defect Liability Period</h3>
              <StatusButtons section="contractorDefectLiability" />
            </div>
            <FileInput label="Defect Liability Reports" accept=".pdf,.doc,.docx" multiple={true} />
          </div>
        )

      case 'contractorFinalAccount':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Final Account</h3>
              <StatusButtons section="contractorFinalAccount" />
            </div>
            <FileInput label="Final Account Documents" accept=".pdf,.doc,.docx,.xlsx" multiple={true} />
          </div>
        )

      default:
        return null
    }
  }

  const handleCategoryChange = (category) => {
    setActiveCategory(category)
    // Reset to first section of new category
    if (category === 'consultant') {
      setActiveSection('inception')
    } else {
      setActiveSection('mobilization')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Post Contract Phase</h2>
        
        {/* Category Navigation */}
        <div className="flex space-x-4 mb-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${activeCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }
              `}
            >
              <span className="text-lg">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2">
          {(activeCategory === 'consultant' ? consultantSections : contractorSections).map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${activeSection === section.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }
              `}
            >
              <span>{section.icon}</span>
              <span>{section.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {activeCategory === 'consultant' ? renderConsultantContent() : renderContractorContent()}
      </div>
    </div>
  )
}

export default PostContract 