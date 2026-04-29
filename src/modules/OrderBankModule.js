import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboardData } from '../context/DashboardDataContext';

export function OrderBankModule() {
  const { skuData, setSkuData, orderHistory, markModuleDirty, MODULE_IDS } = useDashboardData();
  const [activeRow, setActiveRow] = useState(null);
  const orderBankRows = skuData.map((sku) => ({
    sku: sku.sku,
    product: sku.product,
    inBank: sku.ordersInBank,
    inProcess: sku.ordersInProcess,
    unitValue: sku.unitValue,
  }));

  const totalInBank = orderBankRows.reduce((sum, r) => sum + r.inBank, 0);
  const totalInProcess = orderBankRows.reduce((sum, r) => sum + r.inProcess, 0);
  const totalValue = orderBankRows.reduce((sum, r) => sum + (r.inBank + r.inProcess) * r.unitValue, 0);

  return (
    <div style={{ padding: '24px', color: '#e2e8f0' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', color: '#ffffff' }}>
        Order Bank
      </h2>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Orders in Bank', value: totalInBank, color: '#3b82f6' },
          { label: 'Orders in Process', value: totalInProcess, color: '#10b981' },
          { label: 'Total Order Value', value: '$' + (totalValue / 1e6).toFixed(1) + 'M', color: '#f59e0b' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: '#1e293b', borderRadius: '10px', padding: '20px',
            borderLeft: `4px solid ${kpi.color}`
          }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>{kpi.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Order Table */}
      <div style={{ background: '#1e293b', borderRadius: '10px', padding: '20px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#cbd5e1' }}>
          Orders by Finished Good
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['SKU', 'Product', 'In Bank', 'In Process', 'Total Orders', 'Unit Value', 'Total Value'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderBankRows.map((row, idx) => (
              <tr
                key={row.sku}
                onClick={() => setActiveRow(activeRow === row.sku ? null : row.sku)}
                style={{
                  borderBottom: '1px solid #1e293b',
                  background: activeRow === row.sku ? '#1a3a5c' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{row.sku}</td>
                <td style={{ padding: '10px 12px', color: '#ffffff', fontWeight: '500' }}>{row.product}</td>
                <td
                  style={{ padding: '10px 12px', color: '#3b82f6', fontWeight: '600' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {idx === 0 ? (
                    <input
                      type="number"
                      min={0}
                      value={row.inBank}
                      onChange={(e) => {
                        const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                        setSkuData((list) => list.map((s) => (s.sku === row.sku ? { ...s, ordersInBank: v } : s)));
                        markModuleDirty(MODULE_IDS.orderbank);
                      }}
                      style={{ width: 72, background: '#0f172a', border: '1px solid #334155', color: '#3b82f6', borderRadius: 4, padding: 4 }}
                    />
                  ) : (
                    row.inBank
                  )}
                </td>
                <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: '600' }}>{row.inProcess}</td>
                <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{row.inBank + row.inProcess}</td>
                <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>${row.unitValue.toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: '#f59e0b', fontWeight: '600' }}>
                  ${((row.inBank + row.inProcess) * row.unitValue / 1e6).toFixed(1)}M
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Line Chart */}
      <div style={{ background: '#1e293b', borderRadius: '10px', padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#cbd5e1' }}>
          Monthly Order Volume — Year over Year Comparison
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={orderHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }} />
            <Line type="monotone" dataKey="y2026" name="2026" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
            <Line type="monotone" dataKey="y2025" name="2025" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="y2024" name="2024" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="y2023" name="2023" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}