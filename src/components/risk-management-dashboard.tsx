"use client"

import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line } from 'recharts'
import { LoanPortfolio, ClimateScenario, ScenarioResult } from '@/types'
import { ScenarioCalculator } from '@/lib/scenario-calculator'

interface RiskManagementDashboardProps {
  portfolio: LoanPortfolio[]
  scenarios: ClimateScenario[]
}

export default function RiskManagementDashboard({ portfolio, scenarios }: RiskManagementDashboardProps) {
  // Business Objective: Comprehensive risk assessment for portfolio management and CCAR compliance
  const riskAnalysis = useMemo(() => {
    if (!portfolio.length || !scenarios.length) return null
    
    const allResults: ScenarioResult[] = []
    
    portfolio.forEach(loan => {
      scenarios.forEach(scenario => {
        const result = ScenarioCalculator.calculateScenarioImpact(loan, scenario)
        allResults.push(result)
      })
    })
    
    return {
      results: allResults,
      portfolioMetrics: calculatePortfolioMetrics(portfolio, allResults),
      concentrationRisk: calculateConcentrationRisk(portfolio),
      capitalImpact: calculateCapitalImpact(portfolio, allResults),
      riskDistribution: calculateRiskDistribution(portfolio, allResults),
    }
  }, [portfolio, scenarios])

  // Business Objective: VaR/Expected Shortfall analysis for risk appetite monitoring
  const varAnalysis = useMemo(() => {
    if (!riskAnalysis) return []
    
    return scenarios.map(scenario => {
      const scenarioResults = riskAnalysis.results.filter(r => r.scenario_id === scenario.id)
      const losses = scenarioResults.map(r => r.expected_loss).sort((a, b) => b - a)
      
      const var95 = losses[Math.floor(losses.length * 0.05)] || 0
      const var99 = losses[Math.floor(losses.length * 0.01)] || 0
      const expectedShortfall = losses.slice(0, Math.floor(losses.length * 0.01))
        .reduce((sum, loss) => sum + loss, 0) / Math.max(1, Math.floor(losses.length * 0.01))
      
      return {
        scenario: scenario.name,
        scenarioId: scenario.id,
        var95: var95 / 1000000, // Convert to millions
        var99: var99 / 1000000,
        expectedShortfall: expectedShortfall / 1000000,
        portfolioLoss: scenarioResults.reduce((sum, r) => sum + r.expected_loss, 0) / 1000000,
        lossRate: scenarioResults.reduce((sum, r) => sum + r.expected_loss, 0) / 
                  portfolio.reduce((sum, l) => sum + l.outstanding_balance, 0) * 100,
      }
    })
  }, [riskAnalysis, scenarios])

  // Business Objective: Geographic concentration limits and diversification monitoring
  const concentrationAnalysis = useMemo(() => {
    if (!portfolio.length) return []
    
    const stateExposure = new Map<string, number>()
    const totalExposure = portfolio.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
    
    portfolio.forEach(loan => {
      const current = stateExposure.get(loan.location.state) || 0
      stateExposure.set(loan.location.state, current + loan.outstanding_balance)
    })
    
    return Array.from(stateExposure.entries())
      .map(([state, exposure]) => ({
        state,
        exposure: exposure / 1000000, // Convert to millions
        percentage: (exposure / totalExposure) * 100,
        riskLevel: getStateRiskLevel(state),
        regulatoryLimit: 15, // Example 15% concentration limit
        exceedsLimit: (exposure / totalExposure) > 0.15,
      }))
      .sort((a, b) => b.exposure - a.exposure)
  }, [portfolio])

  // Business Objective: Stress testing loss distribution analysis
  const lossDistribution = useMemo(() => {
    if (!riskAnalysis) return []
    
    const bins = [0, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, Infinity]
    const binLabels = ['<$10K', '$10K-25K', '$25K-50K', '$50K-100K', '$100K-250K', '$250K-500K', '$500K-1M', '>$1M']
    
    return scenarios.map(scenario => {
      const scenarioResults = riskAnalysis.results.filter(r => r.scenario_id === scenario.id)
      const distribution = bins.slice(0, -1).map((binStart, index) => {
        const binEnd = bins[index + 1]
        const count = scenarioResults.filter(r => 
          r.expected_loss >= binStart && r.expected_loss < binEnd
        ).length
        
        return {
          range: binLabels[index],
          count,
          percentage: (count / scenarioResults.length) * 100,
        }
      })
      
      return {
        scenario: scenario.name,
        distribution,
      }
    })
  }, [riskAnalysis, scenarios])

  // Business Objective: Capital adequacy and buffer monitoring
  const capitalAnalysis = useMemo(() => {
    if (!riskAnalysis) return []
    
    return scenarios.map(scenario => {
      const scenarioResults = riskAnalysis.results.filter(r => r.scenario_id === scenario.id)
      const totalLoss = scenarioResults.reduce((sum, r) => sum + r.expected_loss, 0)
      const totalExposure = portfolio.reduce((sum, l) => sum + l.outstanding_balance, 0)
      
      // Simplified capital calculation
      const baseCapitalRatio = 0.12 // 12% Tier 1 ratio
      const lossRate = totalLoss / totalExposure
      const stressedCapitalRatio = Math.max(0.045, baseCapitalRatio - lossRate * 2) // Simplified stress impact
      
      return {
        scenario: scenario.name,
        baseCapitalRatio: baseCapitalRatio * 100,
        stressedCapitalRatio: stressedCapitalRatio * 100,
        capitalBuffer: (stressedCapitalRatio - 0.08) * 100, // Buffer above 8% minimum
        passesStress: stressedCapitalRatio > 0.08,
        capitalDeficit: Math.max(0, (0.08 - stressedCapitalRatio) * totalExposure / 1000000),
        regulatoryMinimum: 8,
      }
    })
  }, [riskAnalysis, portfolio, scenarios])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  if (!riskAnalysis) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Please load portfolio and scenarios to see risk management analytics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Executive Risk Management Dashboard</h2>
        <p className="text-red-100 text-lg mb-4">
          Advanced analytics for C-suite decision making and regulatory oversight
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-red-700 bg-opacity-50 p-3 rounded text-center">
            <div className="font-bold">VaR Analysis</div>
            <div className="text-red-200">Tail Risk Quantification</div>
          </div>
          <div className="bg-red-700 bg-opacity-50 p-3 rounded text-center">
            <div className="font-bold">Concentration Risk</div>
            <div className="text-red-200">Geographic Limits</div>
          </div>
          <div className="bg-red-700 bg-opacity-50 p-3 rounded text-center">
            <div className="font-bold">Capital Adequacy</div>
            <div className="text-red-200">Stress Testing</div>
          </div>
          <div className="bg-red-700 bg-opacity-50 p-3 rounded text-center">
            <div className="font-bold">Loss Distribution</div>
            <div className="text-red-200">Portfolio Optimization</div>
          </div>
        </div>
      </div>

      {/* Executive Risk Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600 font-medium">Portfolio VaR (99%)</div>
          <div className="text-2xl font-bold text-red-800">
            ${Math.max(...varAnalysis.map(v => v.var99)).toFixed(1)}M
          </div>
          <div className="text-xs text-red-600 mt-1">Worst-case scenario</div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm text-orange-600 font-medium">Expected Shortfall</div>
          <div className="text-2xl font-bold text-orange-800">
            ${Math.max(...varAnalysis.map(v => v.expectedShortfall)).toFixed(1)}M
          </div>
          <div className="text-xs text-orange-600 mt-1">Tail risk exposure</div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-600 font-medium">Geographic Concentration</div>
          <div className="text-2xl font-bold text-yellow-800">
            {concentrationAnalysis.length > 0 ? concentrationAnalysis[0].percentage.toFixed(1) : '0.0'}%
          </div>
          <div className="text-xs text-yellow-600 mt-1">Largest state exposure</div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Capital Buffer</div>
          <div className="text-2xl font-bold text-blue-800">
            {capitalAnalysis.length > 0 ? Math.min(...capitalAnalysis.map(c => c.capitalBuffer)).toFixed(1) : '0.0'}%
          </div>
          <div className="text-xs text-blue-600 mt-1">Above regulatory minimum</div>
        </div>
      </div>

      {/* Value at Risk Analysis */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Value at Risk Analysis</h3>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-3">
            <div className="text-sm font-semibold text-blue-800 mb-1">EXECUTIVE DECISION SUPPORT</div>
            <div className="text-blue-700">Quantify maximum potential losses at 95% and 99% confidence levels to inform board-level risk appetite decisions and regulatory capital allocation</div>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-3">
            <div className="text-xs font-semibold text-red-800 mb-1">RISK APPETITE THRESHOLD</div>
            <div className="text-red-700 text-sm">VaR 99% of ${Math.max(...varAnalysis.map(v => v.var99)).toFixed(1)}M approaches board-approved risk limits - consider portfolio adjustment</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">VaR by Climate Scenario</h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={varAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" label={{ value: 'VaR ($M)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Loss Rate (%)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="var95" fill="#8884d8" name="VaR 95%" />
                <Bar yAxisId="left" dataKey="var99" fill="#ff7300" name="VaR 99%" />
                <Line yAxisId="right" type="monotone" dataKey="lossRate" stroke="#82ca9d" strokeWidth={3} name="Loss Rate %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Expected Shortfall Analysis</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={varAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Expected Shortfall ($M)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(1)}M`, 'Expected Shortfall']} />
                <Area type="monotone" dataKey="expectedShortfall" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-slate-50 rounded">
          <h4 className="font-medium text-slate-700 mb-2">Key Risk Insights</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• VaR increases by {((Math.max(...varAnalysis.map(v => v.var99)) / Math.min(...varAnalysis.map(v => v.var99))) - 1) * 100}% from best to worst scenario</li>
            <li>• Expected shortfall indicates significant tail risk concentration</li>
            <li>• Portfolio loss rates range from {Math.min(...varAnalysis.map(v => v.lossRate)).toFixed(2)}% to {Math.max(...varAnalysis.map(v => v.lossRate)).toFixed(2)}%</li>
            <li>• Risk appetite threshold monitoring required for stress scenarios</li>
          </ul>
        </div>
      </div>

      {/* Geographic Concentration Risk */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Geographic Concentration Risk Management</h3>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-3">
            <div className="text-sm font-semibold text-yellow-800 mb-1">STRATEGIC PORTFOLIO OVERSIGHT</div>
            <div className="text-yellow-700">Monitor geographic concentration against regulatory limits to prevent excessive exposure to climate-vulnerable regions</div>
          </div>
          <div className="bg-orange-50 border-l-4 border-orange-500 p-3">
            <div className="text-xs font-semibold text-orange-800 mb-1">CONCENTRATION ALERT</div>
            <div className="text-orange-700 text-sm">Largest state exposure: {concentrationAnalysis.length > 0 ? concentrationAnalysis[0].percentage.toFixed(1) : '0.0'}% - evaluate diversification strategy if approaching 15% limit</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">State Concentration vs. Regulatory Limits</h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={concentrationAnalysis.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis label={{ value: 'Concentration (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3b82f6" />
                <Line type="monotone" dataKey="regulatoryLimit" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" name="Regulatory Limit" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Risk Level Distribution</h4>
            <div className="space-y-3">
              {['High', 'Medium', 'Low'].map(riskLevel => {
                const states = concentrationAnalysis.filter(c => c.riskLevel === riskLevel.toLowerCase())
                const totalExposure = states.reduce((sum, s) => sum + s.exposure, 0)
                const totalPercentage = states.reduce((sum, s) => sum + s.percentage, 0)
                
                return (
                  <div key={riskLevel} className={`p-4 rounded-lg border-l-4 ${
                    riskLevel === 'High' ? 'border-red-500 bg-red-50' :
                    riskLevel === 'Medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-green-500 bg-green-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{riskLevel} Climate Risk States</span>
                      <span className="text-lg font-bold">${totalExposure.toFixed(0)}M ({totalPercentage.toFixed(1)}%)</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {states.length} states: {states.slice(0, 3).map(s => s.state).join(', ')}
                      {states.length > 3 && ` +${states.length - 3} more`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded">
          <h4 className="font-medium text-amber-800 mb-2">Concentration Risk Alerts</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            {concentrationAnalysis.filter(c => c.exceedsLimit).map(state => (
              <li key={state.state}>
                • {state.state}: {state.percentage.toFixed(1)}% exceeds {state.regulatoryLimit}% limit by {(state.percentage - state.regulatoryLimit).toFixed(1)}%
              </li>
            ))}
            {concentrationAnalysis.filter(c => c.exceedsLimit).length === 0 && (
              <li>• All state concentrations within regulatory limits</li>
            )}
          </ul>
        </div>
      </div>

      {/* Capital Adequacy Under Stress */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Capital Adequacy Under Climate Stress</h3>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-3">
            <div className="text-sm font-semibold text-green-800 mb-1">REGULATORY COMPLIANCE ASSURANCE</div>
            <div className="text-green-700">Ensure capital ratios remain above regulatory minimums under severe climate scenarios to maintain banking operations and dividend capacity</div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
            <div className="text-xs font-semibold text-blue-800 mb-1">CAPITAL PLANNING INSIGHT</div>
            <div className="text-blue-700 text-sm">Minimum buffer: {Math.min(...capitalAnalysis.map(c => c.capitalBuffer)).toFixed(1)}% above regulatory minimum - consider capital conservation actions if below 2.5%</div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={capitalAnalysis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="scenario" angle={-45} textAnchor="end" height={100} />
            <YAxis yAxisId="left" label={{ value: 'Capital Ratio (%)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Capital Deficit ($M)', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="baseCapitalRatio" fill="#10b981" name="Base Capital Ratio" />
            <Bar yAxisId="left" dataKey="stressedCapitalRatio" fill="#3b82f6" name="Stressed Capital Ratio" />
            <Line yAxisId="left" type="monotone" dataKey="regulatoryMinimum" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" name="Regulatory Minimum (8%)" />
            <Area yAxisId="right" type="monotone" dataKey="capitalDeficit" fill="#ef4444" fillOpacity={0.3} name="Capital Deficit" />
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <div className="text-sm text-green-600 font-medium">Scenarios Passed</div>
            <div className="text-2xl font-bold text-green-800">
              {capitalAnalysis.filter(c => c.passesStress).length}/{capitalAnalysis.length}
            </div>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-600 font-medium">Min Capital Buffer</div>
            <div className="text-2xl font-bold text-blue-800">
              {Math.min(...capitalAnalysis.map(c => c.capitalBuffer)).toFixed(1)}%
            </div>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <div className="text-sm text-red-600 font-medium">Max Capital Deficit</div>
            <div className="text-2xl font-bold text-red-800">
              ${Math.max(...capitalAnalysis.map(c => c.capitalDeficit)).toFixed(0)}M
            </div>
          </div>
        </div>
      </div>

      {/* Loss Distribution Analysis */}
      <div className="bg-white border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Loss Distribution Analysis</h3>
          <p className="text-sm text-slate-600">
            <strong>Business Objective:</strong> Understand loss concentration patterns for portfolio optimization and risk management
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lossDistribution.slice(0, 2).map((scenarioData, index) => (
            <div key={scenarioData.scenario}>
              <h4 className="font-medium mb-3">{scenarioData.scenario}</h4>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={scenarioData.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke={COLORS[index]} fill={COLORS[index]} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Management Recommendations */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Risk Management Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-blue-300">Immediate Actions</h4>
            <ul className="space-y-2 text-sm text-slate-200">
              <li>• Review portfolios in high-concentration states exceeding limits</li>
              <li>• Implement climate risk pricing adjustments for new originations</li>
              <li>• Enhance geographic diversification through strategic origination targets</li>
              <li>• Update insurance requirements for properties in high-risk areas</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-green-300">Strategic Planning</h4>
            <ul className="space-y-2 text-sm text-slate-200">
              <li>• Develop climate stress testing framework for ongoing monitoring</li>
              <li>• Establish portfolio-level climate risk appetite statements</li>
              <li>• Create early warning indicators for geographic concentration</li>
              <li>• Integrate climate factors into credit underwriting standards</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function calculatePortfolioMetrics(portfolio: LoanPortfolio[], results: ScenarioResult[]) {
  const totalExposure = portfolio.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
  const totalExpectedLoss = results.reduce((sum, result) => sum + result.expected_loss, 0)
  
  return {
    totalExposure,
    totalExpectedLoss,
    averageLossRate: totalExpectedLoss / totalExposure,
    highRiskLoans: results.filter(r => r.stress_factor > 1.5).length,
  }
}

function calculateConcentrationRisk(portfolio: LoanPortfolio[]) {
  const stateConcentration = new Map<string, number>()
  const totalExposure = portfolio.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
  
  portfolio.forEach(loan => {
    const current = stateConcentration.get(loan.location.state) || 0
    stateConcentration.set(loan.location.state, current + loan.outstanding_balance)
  })
  
  const herfindahlIndex = Array.from(stateConcentration.values())
    .reduce((sum, exposure) => sum + Math.pow(exposure / totalExposure, 2), 0)
  
  return {
    herfindahlIndex,
    diversificationScore: 1 - herfindahlIndex,
    stateCount: stateConcentration.size,
  }
}

function calculateCapitalImpact(portfolio: LoanPortfolio[], results: ScenarioResult[]) {
  const totalExposure = portfolio.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
  const totalExpectedLoss = results.reduce((sum, result) => sum + result.expected_loss, 0)
  
  return {
    riskWeightedAssets: totalExposure * 0.75, // Simplified
    tier1CapitalRequirement: totalExposure * 0.08,
    additionalProvisions: totalExpectedLoss * 0.6,
  }
}

function calculateRiskDistribution(portfolio: LoanPortfolio[], results: ScenarioResult[]) {
  const riskBuckets = {
    low: results.filter(r => r.stress_factor <= 1.2).length,
    medium: results.filter(r => r.stress_factor > 1.2 && r.stress_factor <= 1.8).length,
    high: results.filter(r => r.stress_factor > 1.8).length,
  }
  
  return riskBuckets
}

function getStateRiskLevel(state: string): string {
  const highRiskStates = ['FL', 'LA', 'TX', 'NC', 'SC', 'NJ', 'NY']
  const mediumRiskStates = ['CA', 'GA', 'WA', 'OR', 'AZ', 'CO']
  
  if (highRiskStates.includes(state)) return 'high'
  if (mediumRiskStates.includes(state)) return 'medium'
  return 'low'
}