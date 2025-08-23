"use client"

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts'
import { LoanData } from '@/types/loan-data'
import { GeographicalOptimizer } from '@/lib/geographical-optimizer'

interface GeographicalOptimizationDashboardProps {
  loans: LoanData[]
  scenarios: string[]
}

export default function GeographicalOptimizationDashboard({ 
  loans, 
  scenarios
}: GeographicalOptimizationDashboardProps) {

  const geographicMetrics = useMemo(() => {
    if (!loans.length) return []
    
    // Mock climate data for demo
    const mockClimateData = loans.map(loan => ({
      property_id: loan.property_id,
      baseline_year: 2023,
      projection_years: [2030, 2050, 2070, 2100],
      rcp_scenarios: {
        rcp_26: {
          scenario: 'rcp_26',
          description: 'Low emissions',
          temperature_change: 1.5,
          precipitation_change: 5,
          sea_level_rise: 0.3,
          hazard_multipliers: { flood: 1.1, wildfire: 1.15, hurricane: 1.05, hail: 1.02, tornado: 1.03 }
        },
        rcp_45: {
          scenario: 'rcp_45',
          description: 'Medium emissions',
          temperature_change: 2.5,
          precipitation_change: 10,
          sea_level_rise: 0.5,
          hazard_multipliers: { flood: 1.25, wildfire: 1.35, hurricane: 1.15, hail: 1.08, tornado: 1.10 }
        },
        rcp_60: {
          scenario: 'rcp_60',
          description: 'High emissions',
          temperature_change: 3.0,
          precipitation_change: 15,
          sea_level_rise: 0.7,
          hazard_multipliers: { flood: 1.35, wildfire: 1.50, hurricane: 1.25, hail: 1.12, tornado: 1.15 }
        },
        rcp_85: {
          scenario: 'rcp_85',
          description: 'Very high emissions',
          temperature_change: 4.5,
          precipitation_change: 25,
          sea_level_rise: 1.2,
          hazard_multipliers: { flood: 1.60, wildfire: 1.80, hurricane: 1.45, hail: 1.20, tornado: 1.25 }
        }
      },
      hazards: []
    }))

    return GeographicalOptimizer.analyzeGeographicRisk(loans, mockClimateData, scenarios)
  }, [loans, scenarios])

  const optimizationRecommendations = useMemo(() => {
    if (!geographicMetrics.length) return []
    
    return GeographicalOptimizer.generateOptimizationRecommendations(
      geographicMetrics
    )
  }, [geographicMetrics])

  const chartData = useMemo(() => {
    return geographicMetrics.map(metric => ({
      region: metric.region_name.split(' - ')[0], // Just state name
      currentAllocation: metric.current_allocation * 100,
      optimalAllocation: metric.optimal_allocation * 100,
      riskContribution: metric.risk_contribution * 100,
      sharpeRatio: metric.sharpe_ratio,
      climateBeta: metric.climate_beta,
      diversificationBenefit: metric.diversification_benefit * 100
    }))
  }, [geographicMetrics])

  const riskReturnData = useMemo(() => {
    return geographicMetrics.map(metric => ({
      region: metric.region_name.split(' - ')[0],
      risk: metric.risk_contribution * 100,
      return: metric.sharpe_ratio * 10, // Scale for visibility
      size: metric.current_allocation * 1000 // Bubble size
    }))
  }, [geographicMetrics])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  if (!loans.length) {
    return (
      <div className="text-center py-8 text-black">
        No loan data available for geographical analysis
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current vs Optimal Allocation */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Current vs Optimal Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Allocation (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="currentAllocation" fill="#8884d8" name="Current %" />
              <Bar dataKey="optimalAllocation" fill="#82ca9d" name="Optimal %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk-Return Scatter */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Risk-Return Profile by Region</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={riskReturnData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="risk" 
                name="Risk Contribution" 
                label={{ value: 'Risk Contribution (%)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                dataKey="return" 
                name="Risk-Adj Return" 
                label={{ value: 'Risk-Adjusted Return', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) => [
                  name === 'return' ? `${Number(value).toFixed(2)}` : `${Number(value).toFixed(1)}%`,
                  name === 'return' ? 'Risk-Adj Return' : 'Risk Contribution'
                ]}
                labelFormatter={(label, payload) => 
                  payload && payload[0] ? `${payload[0].payload.region}` : ''
                }
              />
              <Scatter dataKey="return" fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Climate Beta Analysis */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Climate Sensitivity by Region</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Climate Beta', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}`, 'Climate Beta']} />
              <Bar 
                dataKey="climateBeta" 
                fill="#82ca9d"
                name="Climate Beta"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Contribution Pie Chart */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Portfolio Risk Contribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ region, riskContribution }) => `${region}: ${riskContribution.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="riskContribution"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Risk Contribution']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Optimization Recommendations */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Portfolio Optimization Recommendations</h3>
        <div className="space-y-4">
          {optimizationRecommendations.slice(0, 8).map((rec, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                rec.implementation_priority === 'high' 
                  ? 'border-red-500 bg-red-50' 
                  : rec.implementation_priority === 'medium'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-green-500 bg-green-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">
                    {rec.recommendation_type.replace('_', ' ').toUpperCase()} - {rec.region}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    rec.implementation_priority === 'high' 
                      ? 'bg-red-200 text-red-900' 
                      : rec.implementation_priority === 'medium'
                      ? 'bg-yellow-200 text-yellow-900'
                      : 'bg-green-200 text-green-900'
                  }`}>
                    {rec.implementation_priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-black">Expected Benefit</div>
                  <div className="font-bold">{(rec.expected_benefit * 100).toFixed(1)}%</div>
                </div>
              </div>
              
              <p className="text-sm text-black mb-2">{rec.rationale}</p>
              
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-black">Current: </span>
                  <span className="font-medium">{(rec.current_exposure * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-black">Recommended: </span>
                  <span className="font-medium">{(rec.recommended_exposure * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-black">Timeline: </span>
                  <span className="font-medium">{rec.time_horizon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-900 font-medium">Portfolio Diversification</div>
          <div className="text-lg font-bold text-blue-900">
            {geographicMetrics.length > 0 
              ? (geographicMetrics.reduce((sum, m) => sum + m.diversification_benefit, 0) / geographicMetrics.length * 100).toFixed(1)
              : '0'}%
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-900 font-medium">Avg Climate Beta</div>
          <div className="text-lg font-bold text-green-900">
            {geographicMetrics.length > 0 
              ? (geographicMetrics.reduce((sum, m) => sum + m.climate_beta, 0) / geographicMetrics.length).toFixed(2)
              : '0.00'}
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-900 font-medium">High Priority Actions</div>
          <div className="text-lg font-bold text-yellow-900">
            {optimizationRecommendations.filter(r => r.implementation_priority === 'high').length}
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-900 font-medium">Max Regional Risk</div>
          <div className="text-lg font-bold text-red-900">
            {geographicMetrics.length > 0 
              ? (Math.max(...geographicMetrics.map(m => m.risk_contribution)) * 100).toFixed(1)
              : '0.0'}%
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium mb-2">Key Insights & Recommendations</h4>
        <div className="text-sm text-blue-900 space-y-1">
          <p>• Geographic diversification can significantly reduce portfolio climate risk</p>
          <p>• Focus on high-priority recommendations to achieve maximum risk reduction</p>
          <p>• Monitor climate beta for regions with increasing physical risk exposure</p>
          <p>• Consider gradual rebalancing over the recommended time horizons</p>
        </div>
      </div>
    </div>
  )
}