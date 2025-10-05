'use client'
import React, { useState } from 'react'

const PreContract = ({ initialSection = 'advert' }) => {
  const [activeSection, setActiveSection] = useState(initialSection)
  const [statuses, setStatuses] = useState({
    advert: 'unsubmitted',
    eoi: 'unsubmitted',
    rfp: 'unsubmitted',
    tenderDocuments: 'unsubmitted',
    contractDocuments: 'unsubmitted'
  })

  const sections = [
    { id: 'advert', name: 'Advert in the Media', icon: '📢' },
    { id: 'eoi', name: 'Expression of Interest (EOI)', icon: '📋' },
    { id: 'rfp', name: 'Request for Proposal', icon: '📄' },
    { id: 'tenderDocuments', name: 'Tender Documents', icon: '📁' },
    { id: 'contractDocuments', name: 'Contract Documents', icon: '📜' }
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

  const FileInput = ({ label, accept = "*" }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <input
        type="file"
        accept={accept}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'advert':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Advert in the Media</h3>
              <StatusButtons section="advert" />
            </div>
            <FileInput label="Media Advertisement File" accept=".pdf,.doc,.docx,.jpg,.png" />
          </div>
        )

      case 'eoi':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Expression of Interest (EOI)</h3>
              <StatusButtons section="eoi" />
            </div>
            <FileInput label="EOI Document" accept=".pdf,.doc,.docx" />
          </div>
        )

      case 'rfp':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Request for Proposal (Technical and Financial Proposal)</h3>
              <StatusButtons section="rfp" />
            </div>
            <FileInput label="Technical Proposal" accept=".pdf,.doc,.docx" />
            <FileInput label="Financial Proposal" accept=".pdf,.doc,.docx,.xlsx" />
          </div>
        )

      case 'tenderDocuments':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Tender Documents</h3>
              <StatusButtons section="tenderDocuments" />
            </div>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Conceptual Drawings</h4>
                <FileInput label="Conceptual Drawings" accept=".pdf,.dwg,.dxf,.jpg,.png" />
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Specification and General Work Schedule</h4>
                <FileInput label="Specifications Document" accept=".pdf,.doc,.docx" />
                <FileInput label="Work Schedule" accept=".pdf,.xlsx,.xls" />
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Bill of Quantities</h4>
                <FileInput label="Bill of Quantities" accept=".pdf,.xlsx,.xls" />
              </div>
            </div>
          </div>
        )

      case 'contractDocuments':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Contract Documents</h3>
              <StatusButtons section="contractDocuments" />
            </div>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Award Letter</h4>
                <FileInput label="Award Letter" accept=".pdf,.doc,.docx" />
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Acceptance Letter</h4>
                <FileInput label="Acceptance Letter" accept=".pdf,.doc,.docx" />
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Signing of Contract Documents</h4>
                <FileInput label="Signed Contract" accept=".pdf,.doc,.docx" />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Pre Contract Phase</h2>
        
        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${activeSection === section.id
                  ? 'bg-blue-500 text-white'
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
        {renderContent()}
      </div>
    </div>
  )
}

export default PreContract 