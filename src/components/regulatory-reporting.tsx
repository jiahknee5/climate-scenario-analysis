"use client"

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { LoanPortfolio, ClimateScenario, ScenarioResult } from '@/types'
import { ScenarioCalculator } from '@/lib/scenario-calculator'

interface RegulatoryReportingProps {
  portfolio: LoanPortfolio[]
  scenarios: ClimateScenario[]
}

export default function RegulatoryReporting({ portfolio, scenarios }: RegulatoryReportingProps) {
  const [reportType, setReportType] = useState<'ccar' | 'fed_scenario' | 'basel' | 'ifrs9'>('ccar')
  const [timeHorizon, setTimeHorizon] = useState<'1_year' | '3_year' | '9_year'>('3_year')

  // Calculate regulatory metrics
  const regulatoryMetrics = useMemo(() => {
    if (!portfolio.length || !scenarios.length) return null

    const totalExposure = portfolio.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
    const scenarioResults: ScenarioResult[] = []
    
    portfolio.forEach(loan => {
      scenarios.forEach(scenario => {
        const result = ScenarioCalculator.calculateScenarioImpact(loan, scenario)
        scenarioResults.push(result)
      })
    })

    // CCAR-specific calculations
    const baselineScenario = scenarios.find(s => s.id === 'baseline') || scenarios[0]
    const adverseScenario = scenarios.find(s => s.id === 'disorderly_transition') || scenarios[1]
    const severelyAdverseScenario = scenarios.find(s => s.id === 'hot_house') || scenarios[scenarios.length - 1]

    const calculateScenarioLoss = (scenarioId: string) => {
      return scenarioResults
        .filter(r => r.scenario_id === scenarioId)
        .reduce((sum, r) => sum + r.expected_loss, 0)
    }

    const baselineLoss = calculateScenarioLoss(baselineScenario.id)
    const adverseLoss = calculateScenarioLoss(adverseScenario.id)
    const severelyAdverseLoss = calculateScenarioLoss(severelyAdverseScenario.id)

    return {
      totalExposure,
      baselineLoss,
      adverseLoss,
      severelyAdverseLoss,
      ccarStress: (severelyAdverseLoss - baselineLoss) / totalExposure,
      tier1CapitalRatio: 0.12, // Mock value
      leverageRatio: 0.08, // Mock value
      commonEquityTier1: 0.115, // Mock value
      stressedCapitalRatio: Math.max(0.045, 0.12 - (severelyAdverseLoss - baselineLoss) / totalExposure),
      concentrationByState: calculateStateConcentration(portfolio),
      riskWeightedAssets: totalExposure * 0.75, // Simplified RWA calculation
      provisionExpense: severelyAdverseLoss * 0.6, // Expected provision under stress
    }
  }, [portfolio, scenarios])

  const ccarTimelineData = useMemo(() => {
    const quarters = Array.from({ length: timeHorizon === '1_year' ? 4 : timeHorizon === '3_year' ? 12 : 36 }, (_, i) => {
      const year = 2024 + Math.floor(i / 4)
      const quarter = (i % 4) + 1
      return `${year}Q${quarter}`
    })

    return quarters.map((quarter, index) => {
      const progressionFactor = Math.min(1, (index + 1) / quarters.length)
      
      return {
        quarter,
        baseline: regulatoryMetrics ? (regulatoryMetrics.baselineLoss / 1000000) * progressionFactor : 0,
        adverse: regulatoryMetrics ? (regulatoryMetrics.adverseLoss / 1000000) * progressionFactor : 0,
        severelyAdverse: regulatoryMetrics ? (regulatoryMetrics.severelyAdverseLoss / 1000000) * progressionFactor : 0,
        capitalRatio: regulatoryMetrics 
          ? Math.max(0.045, regulatoryMetrics.tier1CapitalRatio - (regulatoryMetrics.ccarStress * progressionFactor))
          : 0.12
      }
    })
  }, [regulatoryMetrics, timeHorizon])

  const capitalAdequacyData = useMemo(() => {
    if (!regulatoryMetrics) return []

    return [
      {
        metric: 'Current Tier 1 Capital Ratio',
        value: regulatoryMetrics.tier1CapitalRatio * 100,
        requirement: 6.0,
        buffer: 2.5,
        status: 'compliant'
      },
      {
        metric: 'Stressed Tier 1 Capital Ratio',
        value: regulatoryMetrics.stressedCapitalRatio * 100,
        requirement: 4.5,
        buffer: 2.5,
        status: regulatoryMetrics.stressedCapitalRatio > 0.07 ? 'compliant' : 'breach'
      },
      {
        metric: 'Leverage Ratio',
        value: regulatoryMetrics.leverageRatio * 100,
        requirement: 3.0,
        buffer: 1.0,
        status: 'compliant'
      },
      {
        metric: 'Common Equity Tier 1',
        value: regulatoryMetrics.commonEquityTier1 * 100,
        requirement: 4.5,
        buffer: 2.5,
        status: 'compliant'
      }
    ]
  }, [regulatoryMetrics])

  const downloadReport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!regulatoryMetrics) return

    const reportData = {
      report_type: reportType.toUpperCase(),
      generation_date: new Date().toISOString(),
      time_horizon: timeHorizon,
      portfolio_summary: {
        total_exposure: regulatoryMetrics.totalExposure,
        loan_count: portfolio.length,
        geographic_concentration: regulatoryMetrics.concentrationByState
      },
      stress_test_results: {
        baseline_loss: regulatoryMetrics.baselineLoss,
        adverse_loss: regulatoryMetrics.adverseLoss,
        severely_adverse_loss: regulatoryMetrics.severelyAdverseLoss,
        ccar_stress_rate: regulatoryMetrics.ccarStress
      },
      capital_adequacy: {
        current_tier1_ratio: regulatoryMetrics.tier1CapitalRatio,
        stressed_tier1_ratio: regulatoryMetrics.stressedCapitalRatio,
        leverage_ratio: regulatoryMetrics.leverageRatio,
        cet1_ratio: regulatoryMetrics.commonEquityTier1
      },
      timeline_projections: ccarTimelineData
    }

    if (format === 'csv') {
      const csvContent = convertToCSV(reportData)
      downloadFile(csvContent, `${reportType}_report.csv`, 'text/csv')
    } else if (format === 'excel') {
      alert('Excel export feature coming soon')
    } else {
      alert('PDF export feature coming soon')
    }
  }

  if (!portfolio.length || !scenarios.length) {
    return (
      <div className="text-center py-8 text-black">
        Please add loans and scenarios to generate regulatory reports
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Regulatory Reporting & Compliance</h3>
        <div className="flex items-center space-x-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as 'ccar' | 'fed_scenario' | 'basel' | 'ifrs9')}
            className="px-3 py-2 border rounded"
          >
            <option value="ccar">CCAR Stress Testing</option>
            <option value="fed_scenario">Fed Scenario Analysis</option>
            <option value="basel">Basel III Compliance</option>
            <option value="ifrs9">IFRS 9 ECL</option>
          </select>
          
          <select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(e.target.value as '1_year' | '3_year' | '9_year')}
            className="px-3 py-2 border rounded"
          >
            <option value="1_year">1 Year</option>
            <option value="3_year">3 Year (CCAR)</option>
            <option value="9_year">9 Year (CCAR)</option>
          </select>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">{reportType.toUpperCase()} Executive Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              ${regulatoryMetrics ? (regulatoryMetrics.totalExposure / 1000000000).toFixed(1) : '0'}B
            </div>
            <div className="text-sm text-black">Total Exposure</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-900">
              {regulatoryMetrics ? (regulatoryMetrics.ccarStress * 100).toFixed(2) : '0.00'}%
            </div>
            <div className="text-sm text-black">CCAR Stress Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">
              {regulatoryMetrics ? (regulatoryMetrics.stressedCapitalRatio * 100).toFixed(1) : '0.0'}%
            </div>
            <div className="text-sm text-black">Stressed Tier 1 Ratio</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              regulatoryMetrics && regulatoryMetrics.stressedCapitalRatio > 0.045 ? 'text-green-900' : 'text-red-900'
            }`}>
              {regulatoryMetrics && regulatoryMetrics.stressedCapitalRatio > 0.045 ? 'PASS' : 'FAIL'}
            </div>
            <div className="text-sm text-black">Stress Test Result</div>
          </div>
        </div>
      </div>

      {/* Timeline Analysis */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">
          {reportType.toUpperCase()} Stress Timeline ({timeHorizon.replace('_', ' ')})
        </h4>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={ccarTimelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quarter" />
            <YAxis yAxisId="loss" orientation="left" label={{ value: 'Loss ($M)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="capital" orientation="right" label={{ value: 'Capital Ratio (%)', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="loss" type="monotone" dataKey="baseline" stroke="#8884d8" strokeWidth={2} name="Baseline Loss" />
            <Line yAxisId="loss" type="monotone" dataKey="adverse" stroke="#82ca9d" strokeWidth={2} name="Adverse Loss" />
            <Line yAxisId="loss" type="monotone" dataKey="severelyAdverse" stroke="#ff7300" strokeWidth={2} name="Severely Adverse Loss" />
            <Line yAxisId="capital" type="monotone" dataKey="capitalRatio" stroke="#8dd1e1" strokeWidth={3} strokeDasharray="5 5" name="Tier 1 Capital Ratio" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Capital Adequacy */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">Capital Adequacy Assessment</h4>
        <div className="space-y-4">
          {capitalAdequacyData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded">
              <div className="flex-1">
                <div className="font-medium">{item.metric}</div>
                <div className="text-sm text-black">
                  Requirement: {item.requirement}% | Buffer: {item.buffer}%
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-lg font-bold">{item.value.toFixed(1)}%</div>
                  <div className={`text-xs ${
                    item.status === 'compliant' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {item.status.toUpperCase()}
                  </div>
                </div>
                
                <div className="w-32 bg-gray-100 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      item.value >= (item.requirement + item.buffer) ? 'bg-green-500' :
                      item.value >= item.requirement ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, (item.value / (item.requirement + item.buffer)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Geographic Concentration */}
      {regulatoryMetrics && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Geographic Concentration Risk</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regulatoryMetrics.concentrationByState}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" />
              <YAxis label={{ value: 'Exposure (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Exposure']} />
              <Bar dataKey="percentage" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Download Reports */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">Export Regulatory Reports</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => downloadReport('pdf')}
            className="px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
          >
            📄 Download PDF Report
          </button>
          
          <button
            onClick={() => downloadReport('excel')}
            className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
          >
            📊 Export to Excel
          </button>
          
          <button
            onClick={() => downloadReport('csv')}
            className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            📋 Download CSV Data
          </button>
        </div>
        
        <div className="mt-4 text-sm text-blue-900">
          <p><strong>Report includes:</strong> Stress test results, capital adequacy metrics, geographic concentration analysis, and regulatory compliance assessment for {reportType.toUpperCase()} requirements.</p>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="bg-white border border-gray-200 border rounded-lg p-6">
        <h4 className="font-medium mb-3">Regulatory Compliance Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-black mb-2">Current Status:</h5>
            <ul className="space-y-1 text-black">
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Basel III Capital Requirements: Compliant
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                CCAR Qualitative Assessment: Pass
              </li>
              <li className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${
                  regulatoryMetrics && regulatoryMetrics.stressedCapitalRatio > 0.045 ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                CCAR Quantitative Assessment: {regulatoryMetrics && regulatoryMetrics.stressedCapitalRatio > 0.045 ? 'Pass' : 'Conditional Pass'}
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                Climate Risk Disclosure: In Progress
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-black mb-2">Next Steps:</h5>
            <ul className="space-y-1 text-black">
              <li>• Submit CCAR stress testing results by March 31</li>
              <li>• Enhance climate risk modeling capabilities</li>
              <li>• Review capital buffer adequacy quarterly</li>
              <li>• Update geographic concentration limits</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function calculateStateConcentration(portfolio: LoanPortfolio[]) {
  const stateExposure = new Map<string, number>()
  const totalExposure = portfolio.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
  
  portfolio.forEach(loan => {
    const current = stateExposure.get(loan.location.state) || 0
    stateExposure.set(loan.location.state, current + loan.outstanding_balance)
  })
  
  return Array.from(stateExposure.entries())
    .map(([state, exposure]) => ({
      state,
      exposure,
      percentage: (exposure / totalExposure) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10) // Top 10 states
}

function convertToCSV(data: Record<string, unknown>): string {
  const headers = Object.keys(data).join(',')
  const rows = Object.values(data).map((value) => 
    typeof value === 'object' ? JSON.stringify(value) : String(value)
  ).join(',')
  
  return `${headers}\n${rows}`
}

function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}