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
        <p className="text-gray-500">Please add loans to your portfolio and select scenarios to see results.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Scenario Analysis Results</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((scenario) => {
          const summary = portfolioSummaries[scenario.id]
          return (
            <div key={scenario.id} className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3">{scenario.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Loss:</span>
                  <span className="font-medium">${summary.expected_loss.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loss Rate:</span>
                  <span className="font-medium">{summary.expected_loss_rate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">High Risk Loans:</span>
                  <span className="font-medium">{summary.high_risk_loans}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Property Decline:</span>
                  <span className="font-medium">{Math.abs(summary.property_value_decline).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Expected Loss by Scenario</h3>
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
          <h3 className="text-lg font-semibold mb-4">Expected Loss Rate by Scenario</h3>
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
          <h3 className="text-lg font-semibold mb-4">Portfolio Composition</h3>
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
          <h3 className="text-lg font-semibold mb-4">High Risk Loans by Scenario</h3>
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
            <p className="text-gray-500 text-sm mt-2">
              Showing first 20 results. Total: {results.length} results.
            </p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">Export Results</h3>
        <p className="text-blue-700 mb-4">
          Download results for regulatory reporting and further analysis.
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