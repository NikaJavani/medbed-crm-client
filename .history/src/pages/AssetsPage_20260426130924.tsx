import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../lib/api'
import { Search, BedDouble } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────

interface Asset {
  id: string
  serialNumber: string
  internalTag: string | null
  ward: string | null
  floor: string | null
  status: string
  installationDate: string | null
  warrantyExpiry: string | null
  createdAt: string
  assetModel: {
    id: string
    name: string
    manufacturer: string
    category: string
  }
  organization: {
    id: string
    name: string
  }
  _count: {
    tickets: number
  }
}

// ── Helpers ────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  operational: 'bg-green-100 text-green-700',
  under_maintenance: 'bg-orange-100 text-orange-700',
  decommissioned: 'bg-red-100 text-red-700',
  pending_inspection: 'bg-yellow-100 text-yellow-700',
}

const healthScore = (ticketCount: number) => {
  if (ticketCount === 0) return { label: 'Excellent', color: 'text-green-600' }
  if (ticketCount <= 2) return { label: 'Good', color: 'text-blue-600' }
  if (ticketCount <= 4) return { label: 'Fair', color: 'text-orange-500' }
  return { label: 'Poor', color: 'text-red-600' }
}

const formatDate = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

const isWarrantyExpired = (date: string | null) =>
  date ? new Date(date) < new Date() : false

// ── Asset Card ─────────────────────────────────────────────

const AssetCard = ({
  asset,
  onClick,
}: {
  asset: Asset
  onClick: () => void
}) => {
  const health = healthScore(asset._count.tickets)
  const warrantyExpired = isWarrantyExpired(asset.warrantyExpiry)

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 p-2 rounded-lg">
            <BedDouble className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {asset.serialNumber}
            </p>
            {asset.internalTag && (
              <p className="text-xs text-gray-400">{asset.internalTag}</p>
            )}
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[asset.status]}`}
        >
          {asset.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Model */}
      <p className="text-sm text-gray-700 font-medium mb-1">
        {asset.assetModel.name}
      </p>
      <p className="text-xs text-gray-400 mb-3">{asset.assetModel.category}</p>

      {/* Location */}
      <div className="flex items-center gap-1 mb-3">
        <p className="text-xs text-gray-500">
          {asset.organization.name}
          {asset.ward ? ` · ${asset.ward}` : ''}
          {asset.floor ? ` · Floor ${asset.floor}` : ''}
        </p>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div>
          <p className="text-xs text-gray-400">Health</p>
          <p className={`text-sm font-semibold ${health.color}`}>
            {health.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Tickets</p>
          <p className="text-sm font-semibold text-gray-700">
            {asset._count.tickets}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Warranty</p>
          <p
            className={`text-xs font-medium ${
              warrantyExpired ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            {warrantyExpired ? 'Expired' : formatDate(asset.warrantyExpiry)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Asset Modal ────────────────────────────────────────────

const AssetModal = ({
  asset,
  onClose,
}: {
  asset: Asset
  onClose: () => void
}) => {
  const health = healthScore(asset._count.tickets)
  const warrantyExpired = isWarrantyExpired(asset.warrantyExpiry)

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2.5 rounded-xl">
                <BedDouble className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {asset.serialNumber}
                </h2>
                {asset.internalTag && (
                  <p className="text-sm text-gray-400">{asset.internalTag}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[asset.status]}`}
            >
              {asset.status.replace(/_/g, ' ')}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${health.color} bg-gray-50`}
            >
              {health.label} health
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Model</p>
              <p className="text-sm font-medium text-gray-800">
                {asset.assetModel.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Category</p>
              <p className="text-sm font-medium text-gray-800">
                {asset.assetModel.category}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Manufacturer</p>
              <p className="text-sm font-medium text-gray-800">
                {asset.assetModel.manufacturer}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Hospital</p>
              <p className="text-sm font-medium text-gray-800">
                {asset.organization.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Ward</p>
              <p className="text-sm font-medium text-gray-800">
                {asset.ward ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Floor</p>
              <p className="text-sm font-medium text-gray-800">
                {asset.floor ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Installation Date</p>
              <p className="text-sm font-medium text-gray-800">
                {formatDate(asset.installationDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Warranty Expiry</p>
              <p
                className={`text-sm font-medium ${
                  warrantyExpired ? 'text-red-500' : 'text-gray-800'
                }`}
              >
                {formatDate(asset.warrantyExpiry)}
                {warrantyExpired && ' (Expired)'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Tickets</p>
              <p className="text-sm font-medium text-gray-800">
                {asset._count.tickets}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────

export default function AssetsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.get('/api/assets').then((r) => r.data.data as Asset[]),
  })

  const assets = (data ?? []).filter((a) => {
    const matchSearch =
      a.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.assetModel.name.toLowerCase().includes(search.toLowerCase()) ||
      a.organization.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.ward ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
        <p className="text-sm text-gray-500 mt-1">
          {assets.length} bed{assets.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Statuses</option>
          <option value="operational">Operational</option>
          <option value="under_maintenance">Under Maintenance</option>
          <option value="pending_inspection">Pending Inspection</option>
          <option value="decommissioned">Decommissioned</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center text-gray-400 text-sm py-12">
          Loading assets...
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-12">
          No assets found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => setSelectedAsset(asset)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  )
}