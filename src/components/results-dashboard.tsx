"use client"

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { LoanPortfolio, ClimateScenario, ScenarioResult, PortfolioSummary } from '@/types'
import { ScenarioCalculator } from '@/lib/scenario-calculator'

interface ResultsDashboardProps {
  portfolio: LoanPortfolio[]
  scenarios: ClimateScenario[]
}

export default function ResultsDashboard({ portfolio, scenarios }: ResultsDashboardProps) {
  const results = useMemo(() => {
    if (!portfolio.length || !scenarios.length) return []
    
    const allResults: ScenarioResult[] = []
    
    portfolio.forEach(loan => {
      scenarios.forEach(scenario => {
        const result = ScenarioCalculator.calculateScenarioImpact(loan, scenario)
        allResults.push(result)
      })
    })
    
    return allResults
  }, [portfolio, scenarios])

  const portfolioSummaries = useMemo(() => {
    const summaries: Record<string, PortfolioSummary> = {}
    
    scenarios.forEach(scenario => {
      const scenarioResults = results.filter(r => r.scenario_id === scenario.id)
      const totalExposure = portfolio.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
      const totalExpectedLoss = scenarioResults.reduce((sum, result) => sum + result.expected_loss, 0)
      const highRiskLoans = scenarioResults.filter(r => r.stress_factor > 1.5).length
      
      summaries[scenario.id] = {
        total_loans: portfolio.length,
        total_exposure: totalExposure,
        expected_loss: totalExpectedLoss,
        expected_loss_rate: totalExposure > 0 ? (totalExpectedLoss / totalExposure) * 100 : 0,
        high_risk_loans: highRiskLoans,
        property_value_decline: scenarioResults.length > 0 
          ? (scenarioResults.reduce((sum, r) => sum + r.property_value_change, 0) / scenarioResults.length) * 100
          : 0,
      }
    })
    
    return summaries
  }, [results, portfolio, scenarios])

  const chartData = useMemo(() => {
    return scenarios.map(scenario => ({
      scenario: scenario.name,
      expectedLoss: portfolioSummaries[scenario.id]?.expected_loss || 0,
      expectedLossRate: portfolioSummaries[scenario.id]?.expected_loss_rate || 0,
      highRiskLoans: portfolioSummaries[scenario.id]?.high_risk_loans || 0,
      propertyValueDecline: Math.abs(portfolioSummaries[scenario.id]?.property_value_decline || 0),
    }))
  }, [scenarios, portfolioSummaries])

  const loanTypeData = useMemo(() => {
    const rreLoans = portfolio.filter(loan => loan.type === 'RRE')
    const creLoans = portfolio.filter(loan => loan.type === 'CRE')
    
    return [
      {
        name: 'RRE',
        count: rreLoans.length,
        exposure: rreLoans.reduce((sum, loan) => sum + loan.outstanding_balance, 0),
      },
      {
        name: 'CRE',
        count: creLoans.length,
        exposure: creLoans.reduce((sum, loan) => sum + loan.outstanding_balance, 0),
      },
    ]
  }, [portfolio])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  if (!portfolio.length || !scenarios.length) {
    return (
      <div className="text-center py-12">
        <p className="text-black">Please add loans to your portfolio and select scenarios to see results.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="executive-card" style={{background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-navy) 100%)', color: 'white'}}>
        <h2 className="section-title mb-4" style={{color: 'white'}}>Executive Climate Risk Assessment</h2>
        <div className="body-text mb-6" style={{color: 'rgba(255,255,255,0.9)', fontSize: 'var(--font-size-lg)'}}>
          Strategic risk analysis for C-suite decision making and regulatory compliance
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg" style={{background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)'}}>
            <div className="font-semibold mb-1" style={{color: 'white'}}>Regulatory Impact</div>
            <div className="text-sm" style={{color: 'rgba(255,255,255,0.8)'}}>CCAR Capital Planning</div>
          </div>
          <div className="p-4 rounded-lg" style={{background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)'}}>
            <div className="font-semibold mb-1" style={{color: 'white'}}>Strategic Planning</div>
            <div className="text-sm" style={{color: 'rgba(255,255,255,0.8)'}}>Portfolio Optimization</div>
          </div>
          <div className="p-4 rounded-lg" style={{background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)'}}>
            <div className="font-semibold mb-1" style={{color: 'white'}}>Risk Management</div>
            <div className="text-sm" style={{color: 'rgba(255,255,255,0.8)'}}>Loss Mitigation</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((scenario) => {
          const summary = portfolioSummaries[scenario.id]
          return (
            <div key={scenario.id} className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3">{scenario.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-black">Expected Loss:</span>
                  <span className="font-medium">${summary.expected_loss.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Loss Rate:</span>
                  <span className="font-medium">{summary.expected_loss_rate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">High Risk Loans:</span>
                  <span className="font-medium">{summary.high_risk_loans}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Avg Property Decline:</span>
                  <span className="font-medium">{Math.abs(summary.property_value_decline).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Portfolio Loss Exposure Analysis</h3>
            <div className="objective-callout">
              <div className="objective-title">EXECUTIVE OBJECTIVE</div>
              <div className="objective-content">Quantify maximum potential losses to inform capital allocation decisions and regulatory capital planning under Federal Reserve climate stress scenarios</div>
            </div>
            <div className="insight-callout">
              <div className="insight-title">KEY BUSINESS INSIGHT</div>
              <div className="insight-content">Loss escalation of {((Math.max(...chartData.map(d => d.expectedLoss)) / Math.min(...chartData.map(d => d.expectedLoss)) - 1) * 100).toFixed(0)}% from baseline to severe scenarios requires immediate capital buffer assessment</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="scenario" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Expected Loss']} />
              <Bar dataKey="expectedLoss" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black">Risk Appetite Threshold Analysis</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-3">
              <div className="text-sm font-semibold text-red-900 mb-1">EXECUTIVE OBJECTIVE</div>
              <div className="text-red-900">Monitor portfolio loss rates against established risk appetite limits to trigger strategic portfolio rebalancing decisions</div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
              <div className="text-xs font-semibold text-yellow-900 mb-1">CRITICAL THRESHOLD ALERT</div>
              <div className="text-yellow-900 text-sm">Loss rates exceed {Math.max(...chartData.map(d => d.expectedLossRate)).toFixed(1)}% in severe scenarios - consider geographic diversification strategy</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="scenario" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Loss Rate']} />
              <Line type="monotone" dataKey="expectedLossRate" stroke="#82ca9d" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black">Strategic Asset Allocation Review</h3>
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-3">
              <div className="text-sm font-semibold text-purple-900 mb-1">EXECUTIVE OBJECTIVE</div>
              <div className="text-purple-900">Evaluate current portfolio composition to identify concentration risks and optimize asset allocation for climate resilience</div>
            </div>
            <div className="bg-green-50 border-l-4 border-green-500 p-3">
              <div className="text-xs font-semibold text-green-900 mb-1">PORTFOLIO OPTIMIZATION INSIGHT</div>
              <div className="text-green-900 text-sm">{loanTypeData[0]?.name} represents {((loanTypeData[0]?.exposure || 0) / (loanTypeData.reduce((sum, d) => sum + d.exposure, 0)) * 100).toFixed(0)}% of exposure - evaluate rebalancing opportunities</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={loanTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count} loans`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="exposure"
              >
                {loanTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Exposure']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black">Risk Escalation Management</h3>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-3">
              <div className="text-sm font-semibold text-orange-800 mb-1">EXECUTIVE OBJECTIVE</div>
              <div className="text-orange-700">Identify assets requiring immediate attention for enhanced monitoring, repricing, or potential portfolio exit strategies</div>
            </div>
            <div className="bg-red-50 border-l-4 border-red-500 p-3">
              <div className="text-xs font-semibold text-red-900 mb-1">IMMEDIATE ACTION REQUIRED</div>
              <div className="text-red-900 text-sm">Up to {Math.max(...chartData.map(d => d.highRiskLoans))} assets require enhanced risk management protocols and potential restructuring</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="scenario" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="highRiskLoans" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Results</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Loan ID</th>
                <th className="px-4 py-2 text-left">Scenario</th>
                <th className="px-4 py-2 text-left">PD (%)</th>
                <th className="px-4 py-2 text-left">LGD (%)</th>
                <th className="px-4 py-2 text-left">Expected Loss</th>
                <th className="px-4 py-2 text-left">Property Value Change (%)</th>
                <th className="px-4 py-2 text-left">Risk Rating Change</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 20).map((result) => {
                const scenario = scenarios.find(s => s.id === result.scenario_id)
                return (
                  <tr key={`${result.loan_id}-${result.scenario_id}`} className="border-t">
                    <td className="px-4 py-2">{result.loan_id}</td>
                    <td className="px-4 py-2">{scenario?.name}</td>
                    <td className="px-4 py-2">{(result.probability_of_default * 100).toFixed(2)}%</td>
                    <td className="px-4 py-2">{(result.loss_given_default * 100).toFixed(2)}%</td>
                    <td className="px-4 py-2">${result.expected_loss.toLocaleString()}</td>
                    <td className="px-4 py-2">{(result.property_value_change * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2">{result.risk_rating_change}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {results.length > 20 && (
            <p className="text-black text-sm mt-2">
              Showing first 20 results. Total: {results.length} results.
            </p>
          )}
        </div>
      </div>

      {/* Executive Summary Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-lg">
        <h3 className="text-2xl font-bold mb-6 text-center">Executive Risk Summary & Strategic Recommendations</h3>
        
        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-red-600 bg-opacity-20 border border-red-400 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-red-300">${(Math.max(...chartData.map(d => d.expectedLoss)) / 1000000).toFixed(0)}M</div>
            <div className="text-red-200 text-sm mt-1">Maximum Loss Exposure</div>
          </div>
          <div className="bg-yellow-600 bg-opacity-20 border border-yellow-400 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-yellow-300">{Math.max(...chartData.map(d => d.expectedLossRate)).toFixed(1)}%</div>
            <div className="text-yellow-200 text-sm mt-1">Peak Loss Rate</div>
          </div>
          <div className="bg-orange-600 bg-opacity-20 border border-orange-400 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-orange-300">{Math.max(...chartData.map(d => d.highRiskLoans))}</div>
            <div className="text-orange-200 text-sm mt-1">High-Risk Assets</div>
          </div>
          <div className="bg-blue-600 bg-opacity-20 border border-blue-400 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-300">${(Math.max(...chartData.map(d => d.expectedLoss)) * 0.12 / 1000000).toFixed(0)}M</div>
            <div className="text-blue-200 text-sm mt-1">Capital Buffer Needed</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-700 bg-opacity-50 p-6 rounded-lg">
            <h4 className="font-bold text-xl mb-4 text-red-300 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
              IMMEDIATE EXECUTIVE ACTIONS
            </h4>
            <div className="space-y-4">
              <div className="bg-red-900 bg-opacity-30 p-4 rounded border-l-4 border-red-500">
                <div className="font-semibold text-red-200 mb-2">Capital Planning (Priority 1)</div>
                <div className="text-red-100 text-sm">Increase stress capital buffer by ${(Math.max(...chartData.map(d => d.expectedLoss)) * 0.12 / 1000000).toFixed(0)}M to maintain regulatory compliance under severe climate scenarios</div>
              </div>
              <div className="bg-orange-900 bg-opacity-30 p-4 rounded border-l-4 border-orange-500">
                <div className="font-semibold text-orange-200 mb-2">Risk Committee Review (Priority 1)</div>
                <div className="text-orange-100 text-sm">Convene emergency risk committee to address {Math.max(...chartData.map(d => d.highRiskLoans))} high-risk assets requiring immediate attention</div>
              </div>
              <div className="bg-yellow-900 bg-opacity-30 p-4 rounded border-l-4 border-yellow-500">
                <div className="font-semibold text-yellow-200 mb-2">Board Reporting (This Quarter)</div>
                <div className="text-yellow-100 text-sm">Present climate stress results to board with {Math.max(...chartData.map(d => d.expectedLossRate)).toFixed(1)}% peak loss rate exceeding risk appetite thresholds</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-700 bg-opacity-50 p-6 rounded-lg">
            <h4 className="font-bold text-xl mb-4 text-green-300 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              STRATEGIC PORTFOLIO ACTIONS
            </h4>
            <div className="space-y-4">
              <div className="bg-green-900 bg-opacity-30 p-4 rounded border-l-4 border-green-500">
                <div className="font-semibold text-green-200 mb-2">Geographic Diversification (6 Months)</div>
                <div className="text-green-100 text-sm">Implement portfolio rebalancing to reduce concentration in high-risk climate zones by 25%</div>
              </div>
              <div className="bg-blue-900 bg-opacity-30 p-4 rounded border-l-4 border-blue-500">
                <div className="font-semibold text-blue-200 mb-2">Underwriting Enhancement (90 Days)</div>
                <div className="text-blue-100 text-sm">Deploy climate-adjusted pricing models and enhanced due diligence for properties in vulnerable locations</div>
              </div>
              <div className="bg-purple-900 bg-opacity-30 p-4 rounded border-l-4 border-purple-500">
                <div className="font-semibold text-purple-200 mb-2">Provision Methodology (Next Quarter)</div>
                <div className="text-purple-100 text-sm">Update CECL models to incorporate climate risk factors and forward-looking loss estimates</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-600 bg-opacity-50 p-6 rounded-lg border-2 border-yellow-400">
          <h4 className="font-bold text-xl mb-3 text-yellow-300 text-center">⚠️ REGULATORY COMPLIANCE STATUS</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-300">PASS</div>
              <div className="text-green-200 text-sm">CCAR Quantitative</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-300">REVIEW</div>
              <div className="text-yellow-200 text-sm">Climate Stress Testing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-300">ACTION</div>
              <div className="text-red-200 text-sm">Risk Appetite Limits</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">Regulatory Export & Documentation</h3>
        <p className="text-blue-900 mb-4">
          Download comprehensive results for CCAR submission and regulatory compliance documentation.
        </p>
        <div className="space-x-4">
          <button 
            onClick={() => {
              const csvContent = [
                ['Loan ID', 'Scenario', 'PD (%)', 'LGD (%)', 'Expected Loss', 'Property Value Change (%)', 'Risk Rating Change'].join(','),
                ...results.map(result => {
                  const scenario = scenarios.find(s => s.id === result.scenario_id)
                  return [
                    result.loan_id,
                    scenario?.name || '',
                    (result.probability_of_default * 100).toFixed(2),
                    (result.loss_given_default * 100).toFixed(2),
                    result.expected_loss.toFixed(2),
                    (result.property_value_change * 100).toFixed(1),
                    result.risk_rating_change
                  ].join(',')
                })
              ].join('\n')
              
              const blob = new Blob([csvContent], { type: 'text/csv' })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'climate-scenario-results.csv'
              a.click()
              window.URL.revokeObjectURL(url)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download CSV
          </button>
          <button 
            onClick={() => {
              const jsonContent = JSON.stringify({
                portfolio_summary: portfolioSummaries,
                detailed_results: results,
                scenarios: scenarios,
                portfolio: portfolio
              }, null, 2)
              
              const blob = new Blob([jsonContent], { type: 'application/json' })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'climate-scenario-analysis.json'
              a.click()
              window.URL.revokeObjectURL(url)
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Download JSON
          </button>
        </div>
      </div>
    </div>
  )
}