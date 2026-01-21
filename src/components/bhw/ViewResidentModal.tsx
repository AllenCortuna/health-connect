 'use client'

import React, { useEffect, useRef, useState } from 'react'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Resident } from '@/interface/user'
import { FaTimes, FaDownload } from 'react-icons/fa'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface ViewResidentModalProps {
  resident: Resident | null
  isOpen: boolean
  onClose: () => void
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
    borderBottom: '1px solid #333',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    borderBottom: '1px solid #ccc',
    paddingBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  column: {
    flex: 1,
    marginRight: 15,
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: 8,
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    color: '#333',
  },
  fullWidth: {
    flexDirection: 'column',
    marginBottom: 6,
  },
})

// PDF Document Component
const ResidentPDF = ({ resident, householdHead }: { resident: Resident; householdHead?: string }) => {
  const formatDate = (date: Date | { toDate: () => Date } | undefined) => {
    if (!date) return 'N/A'
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString()
    }
    if (date instanceof Date) {
      return date.toLocaleDateString()
    }
    return 'N/A'
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Resident Information</Text>
          <Text style={styles.subtitle}>Generated on {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Family Number</Text>
              <Text style={styles.value}>{resident.familyNo}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Household Number</Text>
              <Text style={styles.value}>{resident.householdId || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>House Number</Text>
              <Text style={styles.value}>{resident.houseNo || 'N/A'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Household Head</Text>
              <Text style={styles.value}>{householdHead || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.value}>
                {resident.firstName} {resident.middleName} {resident.lastName} {resident.suffix}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Birth Date</Text>
              <Text style={styles.value}>{formatDate(resident.birthDate)}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Birth Place</Text>
              <Text style={styles.value}>{resident.birthPlace}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Gender</Text>
              <Text style={styles.value}>{resident.gender}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Marginalized Group</Text>
              <Text style={styles.value}>
                {resident.marginalizedGroup && resident.marginalizedGroup.length > 0
                  ? resident.marginalizedGroup
                      .map((group) => 
                        group === 'IPs' ? "IP's" : 
                        group === '4ps' ? '4Ps' : 
                        group === 'pwd' ? 'PWD' : 
                        group.charAt(0).toUpperCase() + group.slice(1)
                      )
                      .join(', ')
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Spouse Name</Text>
              <Text style={styles.value}>{resident.spouseName || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{resident.email}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Contact Number</Text>
              <Text style={styles.value}>{resident.contactNumber || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Complete Address</Text>
            <Text style={styles.value}>{resident.address}</Text>
          </View>
        </View>

        {/* Health Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Height</Text>
              <Text style={styles.value}>{resident.height ? `${resident.height} cm` : 'N/A'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Weight</Text>
              <Text style={styles.value}>{resident.weight ? `${resident.weight} kg` : 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Blood Type</Text>
              <Text style={styles.value}>{resident.bloodType || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Created At</Text>
              <Text style={styles.value}>{formatDate(resident.createdAt)}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Resident Database ID</Text>
              <Text style={styles.value}>{resident.id}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

const ViewResidentModal: React.FC<ViewResidentModalProps> = ({ resident, isOpen, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null)
  const [householdHead, setHouseholdHead] = useState<string | null>(null)

  useEffect(() => {
    const fetchHouseholdHead = async () => {
      if (!resident?.householdId) {
        setHouseholdHead(null)
        return
      }

      try {
        const householdsRef = collection(db, 'household')
        const q = query(householdsRef, where('householdNumber', '==', resident.householdId))
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as { headOfHousehold?: string }
          setHouseholdHead(data.headOfHousehold || null)
        } else {
          setHouseholdHead(null)
        }
      } catch (error) {
        console.error('Error fetching household head:', error)
        setHouseholdHead(null)
      }
    }

    if (isOpen && resident) {
      fetchHouseholdHead()
    }
  }, [isOpen, resident])

  if (!isOpen || !resident) return null

  const formatDate = (date: Date | { toDate: () => Date } | undefined) => {
    if (!date) return 'N/A'
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString()
    }
    if (date instanceof Date) {
      return date.toLocaleDateString()
    }
    return 'N/A'
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-secondary">Resident Information</h3>
          <div className="flex gap-2">
            <PDFDownloadLink
              document={<ResidentPDF resident={resident} householdHead={householdHead || undefined} />}
              fileName={`resident-${resident.firstName}-${resident.lastName}.pdf`}
              className="btn btn-sm btn-secondary"
            >
              {({ loading }) => (
                <>
                  <FaDownload className="mr-1" />
                  {loading ? 'Generating...' : 'Download PDF'}
                </>
              )}
            </PDFDownloadLink>
            <button
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div ref={printRef} className="space-y-6">
          {/* Print Header */}
          <div className="hidden print:block header">
            <h1 className="text-2xl font-bold">Resident Information</h1>
            <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          {/* Basic Information */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm text-secondary mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Family Number</span>
                  </label>
                  <p className="text-sm">{resident.familyNo}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">House Number</span>
                  </label>
                  <p className="text-sm">{resident.householdId || 'N/A'}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Household Head</span>
                  </label>
                  <p className="text-sm">{householdHead || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm text-secondary mb-3">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Full Name</span>
                  </label>
                  <p className="text-sm font-medium">
                    {resident.firstName} {resident.middleName} {resident.lastName} {resident.suffix}
                  </p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Birth Date</span>
                  </label>
                  <p className="text-sm">{formatDate(resident.birthDate)}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Birth Place</span>
                  </label>
                  <p className="text-sm">{resident.birthPlace}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Gender</span>
                  </label>
                  <p className="text-sm capitalize">{resident.gender}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Marginalized Group</span>
                  </label>
                  {resident.marginalizedGroup && resident.marginalizedGroup.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {resident.marginalizedGroup.map((group) => (
                        <span
                          key={group}
                          className="badge badge-sm badge-outline"
                          title={group}
                        >
                          {group === 'IPs'
                            ? "IP's"
                            : group === '4ps'
                              ? '4Ps'
                              : group === 'pwd'
                                ? 'PWD'
                                : group === 'solo parent'
                                  ? 'Solo Parent'
                                  : group.charAt(0).toUpperCase() + group.slice(1)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Spouse Name</span>
                  </label>
                  <p className="text-sm">{resident.spouseName || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm text-secondary mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Email</span>
                  </label>
                  <p className="text-sm">{resident.email}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Contact Number</span>
                  </label>
                  <p className="text-sm">{resident.contactNumber || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm text-secondary mb-3">Address</h4>
              <div>
                <label className="label">
                  <span className="label-text text-xs font-semibold">Complete Address</span>
                </label>
                <p className="text-sm">{resident.address}</p>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm text-secondary mb-3">Health Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Height</span>
                  </label>
                  <p className="text-sm">{resident.height ? `${resident.height} cm` : 'N/A'}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Weight</span>
                  </label>
                  <p className="text-sm">{resident.weight ? `${resident.weight} kg` : 'N/A'}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Blood Type</span>
                  </label>
                  <p className="text-sm">{resident.bloodType || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm text-secondary mb-3">System Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Created At</span>
                  </label>
                  <p className="text-sm">{formatDate(resident.createdAt)}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Resident Database ID</span>
                  </label>
                  <p className="font-mono text-xs">{resident.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewResidentModal
