import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { X, Plus } from 'lucide-react'

interface Asset {
  id: string
  serialNumber: string
  internalTag: string | null
  ward: string | null
  assetModel: { name: string }
  organization: { name: string }
}

interface CreateTicketModalProps {
  onClose: () => void
}

export default function CreateTicketModal({ onClose }: CreateTicketModalProps) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    assetId: '',
    title: '',
    description: '',
    priority: 'medium',
    category: 'other',
  })

  const [error, setError] = useState('')

  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets-for-ticket'],
    queryFn: () => api.get('/api/assets').then(r => r.data.data as Asset[]),
  })

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/api/tickets', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket-summary'] })
      onClose()
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.description?.[0] ||
        'Something went wrong. Please try again.'
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.assetId) {
      setError('Please select an asset')
      return
    }
    if (!form.title.trim()) {
      setError('Please enter a title')
      return
    }
    if (!form.description.trim()) {
      setError('Please describe the issue')
      return
    }

    mutation.mutate(form)
  }

  const assets = assetsData ?? []

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Report an Issue</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Asset selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Which bed is having issues? <span className="text-red-500">*</span>
            </label>
            {assetsLoading ? (
              <p className="text-sm text-gray-400">Loading assets...</p>
            ) : assets.length === 0 ? (
              <p className="text-sm text-red-500">
                No beds registered for your account. Please contact Piyatech.
              </p>
            ) : (
              <select
                value={form.assetId}
                onChange={e => setForm({ ...form, assetId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a bed...</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.serialNumber}
                    {asset.internalTag ? ` (${asset.internalTag})` : ''}
                    {asset.ward ? ` — ${asset.ward}` : ''}
                    {` — ${asset.organization.name}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Bed motor not responding"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe the problem <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what happened, when it started, and any error messages you see..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Priority and Category row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mechanical">Mechanical</option>
                <option value="electrical">Electrical</option>
                <option value="software">Software</option>
                <option value="preventive_maintenance">Preventive Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || assets.length === 0}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}