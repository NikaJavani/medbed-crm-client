import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../lib/api'
import { Clock, AlertTriangle, Search, Plus } from 'lucide-react'
import CreateTicketModal from '../components/CreateTicketModal'

// ── Types ──────────────────────────────────────────────────

interface Ticket {
  id: string
  ticketNumber: string
  title: string
  status: string
  priority: string
  category: string
  createdAt: string
  slaDeadline: string
  organization: { name: string }
  asset: {
    serialNumber: string
    ward: string
    assetModel: { name: string }
  }
  reportedBy: { firstName: string; lastName: string }
  assignments: {
    technician: { firstName: string; lastName: string }
  }[]
}

// ── Helpers ────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  acknowledged: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-orange-100 text-orange-700',
  pending_parts: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

const priorityColor: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const priorityOrder: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
}

const isSlaBreached = (deadline: string, status: string) => {
  if (['resolved', 'closed', 'cancelled'].includes(status)) return false
  return new Date(deadline) < new Date()
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

const formatDeadline = (deadline: string) => {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff < 0) return 'Overdue'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Less than 1h'
  if (hours < 24) return `${hours}h left`
  return `${Math.floor(hours / 24)}d left`
}

// ── Ticket row ─────────────────────────────────────────────

const TicketRow = ({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) => {
  const breached = isSlaBreached(ticket.slaDeadline, ticket.status)
  const assignee = ticket.assignments[0]?.technician

  return (
    <tr
      onClick={onClick}
      className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {breached && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
          <div>
            <p className="text-xs font-semibold text-blue-600">{ticket.ticketNumber}</p>
            <p className="text-sm text-gray-800 font-medium">{ticket.title}</p>
            <p className="text-xs text-gray-400">{ticket.organization.name}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-medium text-gray-700">{ticket.asset.serialNumber}</p>
        <p className="text-xs text-gray-400">{ticket.asset.ward}</p>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColor[ticket.priority]}`}>
          {ticket.priority}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[ticket.status]}`}>
          {ticket.status.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="px-4 py-3">
        {assignee ? (
          <p className="text-xs text-gray-700">
            {assignee.firstName} {assignee.lastName}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">Unassigned</p>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className={`text-xs ${breached ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
            {formatDeadline(ticket.slaDeadline)}
          </span>
        </div>
        <p className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</p>
      </td>
    </tr>
  )
}

// ── Ticket detail modal ────────────────────────────────────

const TicketModal = ({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) => {
  const breached = isSlaBreached(ticket.slaDeadline, ticket.status)

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-1">
                {ticket.ticketNumber}
              </p>
              <h2 className="text-lg font-bold text-gray-900">{ticket.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{ticket.organization.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold ml-4"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[ticket.status]}`}>
              {ticket.status.replace(/_/g, ' ')}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColor[ticket.priority]}`}>
              {ticket.priority}
            </span>
            {breached && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700">
                SLA Breached
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Asset</p>
              <p className="text-sm font-medium text-gray-800">
                {ticket.asset.serialNumber}
              </p>
              <p className="text-xs text-gray-500">{ticket.asset.ward}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Category</p>
              <p className="text-sm font-medium text-gray-800 capitalize">
                {ticket.category.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Reported By</p>
              <p className="text-sm font-medium text-gray-800">
                {ticket.reportedBy.firstName} {ticket.reportedBy.lastName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Assigned To</p>
              <p className="text-sm font-medium text-gray-800">
                {ticket.assignments[0]?.technician
                  ? `${ticket.assignments[0].technician.firstName} ${ticket.assignments[0].technician.lastName}`
                  : 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Created</p>
              <p className="text-sm font-medium text-gray-800">
                {formatDate(ticket.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">SLA Deadline</p>
              <p className={`text-sm font-medium ${breached ? 'text-red-600' : 'text-gray-800'}`}>
                {formatDate(ticket.slaDeadline)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────

export default function TicketsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api.get('/api/tickets').then(r => r.data.data as Ticket[]),
  })

  const tickets = (data ?? [])
    .filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.asset.serialNumber.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || t.status === statusFilter
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter
      return matchSearch && matchStatus && matchPriority
    })
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
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
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_parts">Pending Parts</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Ticket
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Asset
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Assigned To
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                SLA
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                  Loading tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No tickets found
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => setSelectedTicket(ticket)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Modal */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  )
}