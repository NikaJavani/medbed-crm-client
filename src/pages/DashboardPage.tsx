import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import {
  TicketCheck,
  AlertTriangle,
  Clock,
  Activity,
  TrendingUp,
  BedDouble,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────

interface TicketSummary {
  total: number
  activeTickets: number
  breachedSla: number
  critical: number
  slaComplianceRate: string
  byStatus: {
    open: number
    inProgress: number
    pendingParts: number
    resolved: number
    closed: number
  }
}

interface CategoryStat {
  category: string
  count: number
}

interface AssetHealth {
  id: string
  serialNumber: string
  ward: string
  model: string
  organization: string
  totalTickets: number
  healthScore: string
  status: string
}

interface RecentTicket {
  id: string
  ticketNumber: string
  title: string
  status: string
  priority: string
  createdAt: string
  organization: { name: string }
  asset: { serialNumber: string; ward: string }
}

// ── Helper components ──────────────────────────────────────

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

const healthColor: Record<string, string> = {
  Excellent: 'text-green-600',
  Good: 'text-blue-600',
  Fair: 'text-orange-500',
  Poor: 'text-red-600',
}

const CHART_COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#10b981', '#ef4444']

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  sub?: string
}) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-gray-500">{label}</span>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

// ── Main page ──────────────────────────────────────────────

export default function DashboardPage() {
  const { data: summaryData } = useQuery({
    queryKey: ['ticket-summary'],
    queryFn: () => api.get('/api/analytics/tickets/summary').then(r => r.data.data as TicketSummary),
  })

  const { data: categoryData } = useQuery({
    queryKey: ['tickets-by-category'],
    queryFn: () => api.get('/api/analytics/tickets/by-category').then(r => r.data.data as CategoryStat[]),
  })

  const { data: assetData } = useQuery({
    queryKey: ['asset-health'],
    queryFn: () => api.get('/api/analytics/assets/health').then(r => r.data.data as AssetHealth[]),
  })

  const { data: activityData } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => api.get('/api/analytics/activity').then(r => r.data.data),
  })

  const summary = summaryData
  const categories = categoryData ?? []
  const assets = assetData ?? []
  const recentTickets: RecentTicket[] = activityData?.recentTickets ?? []

  const pieData = summary
    ? [
        { name: 'Open', value: summary.byStatus.open },
        { name: 'In Progress', value: summary.byStatus.inProgress },
        { name: 'Pending Parts', value: summary.byStatus.pendingParts },
        { name: 'Resolved', value: summary.byStatus.resolved },
        { name: 'Closed', value: summary.byStatus.closed },
      ].filter(d => d.value > 0)
    : []

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Live overview of service operations
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets"
          value={summary?.total ?? '—'}
          icon={TicketCheck}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Active Tickets"
          value={summary?.activeTickets ?? '—'}
          icon={Activity}
          color="bg-orange-50 text-orange-600"
          sub="Open + In Progress + Pending Parts"
        />
        <StatCard
          label="SLA Breached"
          value={summary?.breachedSla ?? '—'}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
          sub="Unresolved past deadline"
        />
        <StatCard
          label="SLA Compliance"
          value={summary?.slaComplianceRate ?? '—'}
          icon={TrendingUp}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — tickets by category */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Tickets by Category
          </h2>
          {categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categories} barSize={32}>
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.replace('_', ' ')}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, 'Tickets']}
                  labelFormatter={(l) => l.replace('_', ' ')}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No data
            </div>
          )}
        </div>

        {/* Pie chart — tickets by status */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Tickets by Status
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset health table */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BedDouble className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Asset Health</h2>
          </div>
          <div className="space-y-2">
            {assets.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {a.serialNumber}
                  </p>
                  <p className="text-xs text-gray-400">
                    {a.ward} — {a.organization}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${healthColor[a.healthScore]}`}>
                    {a.healthScore}
                  </p>
                  <p className="text-xs text-gray-400">{a.totalTickets} tickets</p>
                </div>
              </div>
            ))}
            {assets.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No assets</p>
            )}
          </div>
        </div>

        {/* Recent tickets */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Recent Tickets</h2>
          </div>
          <div className="space-y-3">
            {recentTickets.map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-600">
                    {t.ticketNumber}
                  </p>
                  <p className="text-sm text-gray-800 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.organization.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status]}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[t.priority]}`}>
                    {t.priority}
                  </span>
                </div>
              </div>
            ))}
            {recentTickets.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No tickets</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}