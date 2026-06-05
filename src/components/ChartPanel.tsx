import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartPayload } from '../types'

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4']

function BarChartView({ chart }: { chart: ChartPayload }) {
  const data = (chart.labels ?? []).map((label, i) => {
    const point: Record<string, unknown> = { name: label }
    for (const ds of chart.datasets ?? []) {
      point[ds.label] = ds.data[i]
    }
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        {(chart.datasets ?? []).map((ds, i) => (
          <Bar key={ds.label} dataKey={ds.label} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function LineChartView({ chart }: { chart: ChartPayload }) {
  const data = (chart.labels ?? []).map((label, i) => {
    const point: Record<string, unknown> = { name: label }
    for (const ds of chart.datasets ?? []) {
      point[ds.label] = ds.data[i]
    }
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        {(chart.datasets ?? []).map((ds, i) => (
          <Line
            key={ds.label}
            type="monotone"
            dataKey={ds.label}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function PieChartView({ chart }: { chart: ChartPayload }) {
  const data = (chart.labels ?? []).map((label, i) => ({
    name: label,
    value: (chart.values ?? [])[i] ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function TableView({ chart }: { chart: ChartPayload }) {
  const cols = chart.columns ?? []
  const rows = chart.rows ?? []
  return (
    <div className="chart-table-wrapper">
      <table className="chart-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c}>{String(row[c] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SingleChart({ chart }: { chart: ChartPayload }) {
  return (
    <div className="chart-card">
      <h3 className="chart-title">{chart.title}</h3>
      {chart.chart_type === 'bar_chart' && <BarChartView chart={chart} />}
      {chart.chart_type === 'line_chart' && <LineChartView chart={chart} />}
      {chart.chart_type === 'pie_chart' && <PieChartView chart={chart} />}
      {chart.chart_type === 'table' && <TableView chart={chart} />}
    </div>
  )
}

export default function ChartPanel({ charts }: { charts: ChartPayload[] }) {
  if (charts.length === 0) return null
  return (
    <div className="chart-panel">
      <div className="charts-header">
        <span className="charts-header-icon">◈</span>
        <h2>Visualisations</h2>
      </div>
      <div className="charts-grid">
        {charts.map((c) => (
          <SingleChart key={c.task_id} chart={c} />
        ))}
      </div>
    </div>
  )
}
