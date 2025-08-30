import React, { useRef } from 'react'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { Medicine } from '@/interface/data'
import StatusBadge from '@/components/common/StatusBadge'
import { FaPrint, FaTimes, FaDownload } from 'react-icons/fa'

interface ViewMedicineModalProps {
  medicine: Medicine | null
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
const MedicinePDF = ({ medicine }: { medicine: Medicine }) => {
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
          <Text style={styles.title}>Medicine Information</Text>
          <Text style={styles.subtitle}>Generated on {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Medicine Code</Text>
              <Text style={styles.value}>{medicine.medCode}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Medicine Name</Text>
              <Text style={styles.value}>{medicine.name}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{medicine.description}</Text>
          </View>
        </View>

        {/* Medicine Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicine Details</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Medicine Type</Text>
              <Text style={styles.value}>{medicine.medType}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Category</Text>
              <Text style={styles.value}>{medicine.category}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>{medicine.status}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Supplier</Text>
              <Text style={styles.value}>{medicine.supplier}</Text>
            </View>
          </View>
        </View>

        {/* Inventory Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Expiry Date</Text>
              <Text style={styles.value}>{formatDate(medicine.expDate)}</Text>
            </View>
          </View>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Created At</Text>
              <Text style={styles.value}>{formatDate(medicine.createdAt)}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Last Updated</Text>
              <Text style={styles.value}>{formatDate(medicine.updatedAt)}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Medicine Database ID</Text>
              <Text style={styles.value}>{medicine.id}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

const ViewMedicineModal: React.FC<ViewMedicineModalProps> = ({ medicine, isOpen, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !medicine) return null

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

  const handlePrint = async () => {
    try {
      const blob = await pdf(<MedicinePDF medicine={medicine} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `medicine-${medicine.medCode}-${medicine.name}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-secondary">Medicine Information</h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="btn btn-sm btn-primary"
            >
              <FaPrint className="mr-1" />
              Print PDF
            </button>
            <PDFDownloadLink
              document={<MedicinePDF medicine={medicine} />}
              fileName={`medicine-${medicine.medCode}-${medicine.name}.pdf`}
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
            <h1 className="text-2xl font-bold">Medicine Information</h1>
            <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          {/* Basic Information */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm text-secondary mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Medicine Code</span>
                  </label>
                  <p className="text-sm font-medium">{medicine.medCode}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Medicine Name</span>
                  </label>
                  <p className="text-sm font-medium">{medicine.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm text-secondary mb-3">Description</h4>
              <div>
                <label className="label">
                  <span className="label-text text-xs font-semibold">Description</span>
                </label>
                <p className="text-sm">{medicine.description}</p>
              </div>
            </div>
          </div>

          {/* Medicine Details */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm text-secondary mb-3">Medicine Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Medicine Type</span>
                  </label>
                  <span className="capitalize badge badge-outline badge-sm">{medicine.medType}</span>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Category</span>
                  </label>
                  <p className="text-sm">{medicine.category}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Status</span>
                  </label>
                  <StatusBadge status={medicine.status} size="xs" />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Supplier</span>
                  </label>
                  <p className="text-sm">{medicine.supplier}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Information */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-sm text-secondary mb-3">Inventory Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Quantity</span>
                  </label>
                  <p className={`text-sm font-medium ${medicine.quantity <= 10 ? 'text-error' : medicine.quantity <= 50 ? 'text-warning' : 'text-success'}`}>
                    {medicine.quantity}
                  </p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Expiry Date</span>
                  </label>
                  <p className={`text-sm font-medium ${medicine.expDate instanceof Date && medicine.expDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-error' : ''}`}>
                    {formatDate(medicine.expDate)}
                  </p>
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
                  <p className="text-sm">{formatDate(medicine.createdAt)}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Last Updated</span>
                  </label>
                  <p className="text-sm">{formatDate(medicine.updatedAt)}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-xs font-semibold">Medicine Database ID</span>
                  </label>
                  <p className="font-mono text-xs">{medicine.id}</p>
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

export default ViewMedicineModal
