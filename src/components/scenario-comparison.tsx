"use client"

import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts'
import { LoanPortfolio, ClimateScenario, ScenarioResult } from '@/types'
import { ScenarioCalculator } from '@/lib/scenario-calculator'

interface ScenarioComparisonProps {
  portfolio: LoanPortfolio[]
  scenarios: ClimateScenario[]
  selectedYear: number
}

export default function ScenarioComparison({ portfolio, scenarios, selectedYear }: ScenarioComparisonProps) {
  const [comparisonType, setComparisonType] = useState<'impact' | 'timeline' | 'stress'>('impact')
  const [selectedMetric, setSelectedMetric] = useState<'expected_loss' | 'property_value' | 'risk_rating'>('expected_loss')

  const scenarioResults = useMemo(() => {
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

  const timelineData = useMemo(() => {
    const years = [2025, 2030, 2035, 2040, 2050, 2070, 2100]
    
    return years.map(year => {
      const yearData: any = { year }
      
      scenarios.forEach(scenario => {
        // Calculate progressive impact over time
        const timeProgression = (year - 2024) / (2100 - 2024)
        const baselineImpact = scenarioResults
          .filter(r => r.scenario_id === scenario.id)
          .reduce((sum, r) => sum + r.expected_loss, 0)
        
        yearData[scenario.name] = baselineImpact * timeProgression
      })
      
      return yearData
    })
  }, [scenarios, scenarioResults])

  const impactComparisonData = useMemo(() => {
    return scenarios.map(scenario => {
      const scenarioData = scenarioResults.filter(r => r.scenario_id === scenario.id)
      
      const totalExpectedLoss = scenarioData.reduce((sum, r) => sum + r.expected_loss, 0)
      const avgPropertyChange = scenarioData.length > 0 
        ? scenarioData.reduce((sum, r) => sum + r.property_value_change, 0) / scenarioData.length
        : 0
      const highRiskLoans = scenarioData.filter(r => r.stress_factor > 1.5).length
      const avgStressFactor = scenarioData.length > 0
        ? scenarioData.reduce((sum, r) => sum + r.stress_factor, 0) / scenarioData.length
        : 1
      
      return {
        scenario: scenario.name,
        expectedLoss: totalExpectedLoss / 1000000, // Convert to millions
        propertyValueDecline: Math.abs(avgPropertyChange * 100),
        highRiskLoans,
        avgStressFactor,
        physicalRiskScore: calculatePhysicalRiskScore(scenario),
        transitionRiskScore: calculateTransitionRiskScore(scenario)
      }
    })
  }, [scenarios, scenarioResults])

  const radarData = useMemo(() => {
    const metrics = ['Physical Risk', 'Transition Risk', 'Expected Loss', 'Property Impact', 'Stress Factor']
    
    return scenarios.map(scenario => {
      const data = impactComparisonData.find(d => d.scenario === scenario.name)
      if (!data) return { scenario: scenario.name, data: [] }
      
      return {
        scenario: scenario.name,
        data: [
          { metric: 'Physical Risk', value: data.physicalRiskScore },
          { metric: 'Transition Risk', value: data.transitionRiskScore },
          { metric: 'Expected Loss', value: Math.min(100, (data.expectedLoss / 50) * 100) }, // Normalize
          { metric: 'Property Impact', value: Math.min(100, data.propertyValueDecline * 2) }, // Normalize
          { metric: 'Stress Factor', value: Math.min(100, (data.avgStressFactor - 1) * 100) } // Normalize
        ]
      }
    })
  }, [scenarios, impactComparisonData])

  const stressTestData = useMemo(() => {
    const stressLevels = [1.0, 1.25, 1.5, 2.0, 2.5, 3.0]
    
    return stressLevels.map(stressLevel => {
      const dataPoint: any = { stressLevel: `${stressLevel}x` }
      
      scenarios.forEach(scenario => {
        const baseImpact = impactComparisonData.find(d => d.scenario === scenario.name)?.expectedLoss || 0
        dataPoint[scenario.name] = baseImpact * stressLevel
      })
      
      return dataPoint
    })
  }, [scenarios, impactComparisonData])

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0']

  if (!portfolio.length || !scenarios.length) {
    return (
      <div className="text-center py-8 text-black">
        Please add loans and scenarios to see comparison analysis
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Scenario Comparison Analysis</h3>
        <div className="flex items-center space-x-4">
          <select
            value={comparisonType}
            onChange={(e) => setComparisonType(e.target.value as any)}
            className="px-3 py-2 border rounded"
          >
            <option value="impact">Impact Comparison</option>
            <option value="timeline">Timeline Analysis</option>
            <option value="stress">Stress Testing</option>
          </select>
        </div>
      </div>

      {comparisonType === 'impact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">Expected Loss Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={impactComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Expected Loss ($M)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(1)}M`, 'Expected Loss']} />
                <Area type="monotone" dataKey="expectedLoss" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">Risk Profile Radar</h4>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData[0]?.data || []}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Tooltip />
                <Legend />
                {radarData.map((scenario, index) => (
                  <Radar
                    key={scenario.scenario}
                    name={scenario.scenario}
                    dataKey="value"
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">Property Value Impact</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={impactComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Value Decline (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Value Decline']} />
                <Area type="monotone" dataKey="propertyValueDecline" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">High Risk Loan Count</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={impactComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'High Risk Loans', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [value, 'High Risk Loans']} />
                <Area type="monotone" dataKey="highRiskLoans" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {comparisonType === 'timeline' && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Expected Loss Over Time</h4>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis label={{ value: 'Expected Loss ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
              <Legend />
              {scenarios.map((scenario, index) => (
                <Line
                  key={scenario.id}
                  type="monotone"
                  dataKey={scenario.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {comparisonType === 'stress' && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Stress Test Results</h4>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={stressTestData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stressLevel" />
              <YAxis label={{ value: 'Expected Loss ($M)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`$${Number(value).toFixed(1)}M`, '']} />
              <Legend />
              {scenarios.map((scenario, index) => (
                <Line
                  key={scenario.id}
                  type="monotone"
                  dataKey={scenario.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Worst Case Scenario</div>
          <div className="text-lg font-bold text-blue-800">
            {impactComparisonData.length > 0 
              ? impactComparisonData.reduce((max, curr) => curr.expectedLoss > max.expectedLoss ? curr : max).scenario
              : 'N/A'}
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Best Case Scenario</div>
          <div className="text-lg font-bold text-green-800">
            {impactComparisonData.length > 0 
              ? impactComparisonData.reduce((min, curr) => curr.expectedLoss < min.expectedLoss ? curr : min).scenario
              : 'N/A'}
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-600 font-medium">Range of Impact</div>
          <div className="text-lg font-bold text-yellow-800">
            {impactComparisonData.length > 0 
              ? `${(Math.max(...impactComparisonData.map(d => d.expectedLoss)) - Math.min(...impactComparisonData.map(d => d.expectedLoss))).toFixed(1)}M`
              : '$0M'}
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600 font-medium">Avg Stress Factor</div>
          <div className="text-lg font-bold text-red-800">
            {impactComparisonData.length > 0 
              ? (impactComparisonData.reduce((sum, d) => sum + d.avgStressFactor, 0) / impactComparisonData.length).toFixed(2)
              : '1.00'}x
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h4 className="font-medium mb-3">Scenario Analysis Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-black mb-2">Key Findings:</h5>
            <ul className="space-y-1 text-black">
              <li>• {scenarios.length} scenarios analyzed across {portfolio.length} loans</li>
              <li>• Range of expected losses: ${impactComparisonData.length > 0 ? `${Math.min(...impactComparisonData.map(d => d.expectedLoss)).toFixed(1)}M - ${Math.max(...impactComparisonData.map(d => d.expectedLoss)).toFixed(1)}M` : '0M'}</li>
              <li>• Timeline analysis shows progressive impact through {selectedYear}</li>
              <li>• Stress testing reveals portfolio resilience limits</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-black mb-2">Recommendations:</h5>
            <ul className="space-y-1 text-black">
              <li>• Focus mitigation efforts on worst-case scenarios</li>
              <li>• Monitor early indicators for high-impact pathways</li>
              <li>• Develop contingency plans for stress factor &gt; 2.0x</li>
              <li>• Regular scenario updates as climate science evolves</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function calculatePhysicalRiskScore(scenario: ClimateScenario): number {
  const risks = scenario.physical_risks
  return Math.min(100, (
    risks.flood_probability_increase * 20 +
    risks.wildfire_probability_increase * 20 +
    risks.hurricane_probability_increase * 20 +
    risks.temperature_increase * 15 +
    risks.sea_level_rise * 25
  ))
}

function calculateTransitionRiskScore(scenario: ClimateScenario): number {
  const risks = scenario.transition_risks
  return Math.min(100, (
    (risks.carbon_price / 200) * 25 +
    risks.energy_cost_increase * 30 +
    risks.policy_stringency * 25 +
    risks.technology_disruption * 20
  ))
}