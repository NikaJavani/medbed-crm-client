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
  me