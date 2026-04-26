import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../lib/api'
import { Clock, AlertTriangle, Search } from 'lucide-react'

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
          <span className={`text-xs ${brea