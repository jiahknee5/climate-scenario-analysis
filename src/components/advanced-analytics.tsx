"use client"

import { useState, useMemo } from 'react'
import { LoanPortfolio, ClimateScenario } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ExceedanceCurveChart from './exceedance-curve-chart'
import GeographicalOptimizationDashboard from './geographical-optimization-dashboard'
import ScenarioComparison from './scenario-comparison'

interface AdvancedAnalyticsProps {
  portfolio: LoanPortfolio[]
  scenarios: ClimateScenario[]
}

export default function AdvancedAnalytics({ portfolio, scenarios }: AdvancedAnalyticsProps) {
  const [selectedYear, setSelectedYear] = useState(2030)
  const [selectedProperty, setSelectedProperty] = useState<string>('')

  // Convert portfolio to loan data format
  const loanData = useMemo(() => {
    return portfolio.map(loan => ({
      loan_id: loan.id,
      loan_number: loan.id,
      property_id: `prop_${loan.id}`,
      loan_amount: loan.outstanding_balance,
      outstanding_balance: loan.outstanding_balance,
      original_term_months: 360,
      remaining_term_months: 240,
      interest_rate: loan.interest_rate,
      monthly_payment: loan.outstanding_balance * (loan.interest_rate / 100 / 12),
      loan_type: 'conventional' as const,
      property_type: loan.property_type as 'single_family',
      property_value: loan.property_value,
      ltv_ratio: loan.ltv_ratio,
      combined_ltv: loan.ltv_ratio,
      borrower_income: 80000,
      dti_ratio: 0.35,
      credit_score: 720,
      origination_date: loan.origination_date,
      maturity_date: loan.maturity_date,
      address: {
        street: '123 Main St',
        city: 'Sample City',
        state: loan.location.state,
        zip_code: loan.location.zip_code,
        county: loan.location.county,
        latitude: 0,
        longitude: 0,
      },
      risk_metrics: {
        pd_baseline: 0.02,
        lgd_baseline: 0.25,
        ead: loan.outstanding_balance,
        expected_loss: loan.outstanding_balance * 0.02 * 0.25,
      },
      insurance_coverage: {
        hazard_insurance_amount: loan.property_value * 0.8,
        flood_insurance_amount: loan.property_value * 0.5,
        hazard_premium_annual: 2000,
        flood_premium_annual: 1500,
        total_insurance_premium: 3500,
      },
    }))
  }, [portfolio])

  const scenarioNames = scenarios.map(s => s.id)

  const concentrationMetrics = useMemo(() => {
    const stateConcentration = new Map<string, number>()
    const totalExposure = portfolio.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
    
    portfolio.forEach(loan => {
      const current = stateConcentration.get(loan.location.state) || 0
      stateConcentration.set(loan.location.state, current + loan.outstanding_balance)
    })
    
    const sortedStates = Array.from(stateConcentration.entries())
      .map(([state, exposure]) => ({
        state,
        exposure,
        percentage: (exposure / totalExposure) * 100
      }))
      .sort((a, b) => b.exposure - a.exposure)
    
    const herfindahlIndex = sortedStates.reduce((sum, state) => 
      sum + Math.pow(state.percentage / 100, 2), 0)
    
    return {
      topStates: sortedStates.slice(0, 5),
      herfindahlIndex,
      diversificationScore: 1 - herfindahlIndex
    }
  }, [portfolio])

  if (!portfolio.length || !scenarios.length) {
    return (
      <div className="text-center py-12">
        <p className="text-black">Please add loans to your portfolio and select scenarios to see advanced analytics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium mb-1">Analysis Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border rounded"
            >
              <option value={2025}>2025</option>
              <option value={2030}>2030</option>
              <option value={2040}>2040</option>
              <option value={2050}>2050</option>
              <option value={2070}>2070</option>
              <option value={2100}>2100</option>
            </select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="exceedance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="exceedance">Exceedance Curves</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Comparison</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Analysis</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
          <TabsTrigger value="concentration">Risk Concentration</TabsTrigger>
        </TabsList>

        <TabsContent value="exceedance" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <ExceedanceCurveChart
              loans={loanData}
              scenarios={scenarioNames}
              selectedYear={selectedYear}
              chartType="portfolio"
            />
            
            {portfolio.length > 0 && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Individual Property Analysis</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Select Property</label>
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="px-3 py-2 border rounded w-full max-w-md"
                  >
                    <option value="">Select a property...</option>
                    {portfolio.map(loan => (
                      <option key={loan.id} value={`prop_${loan.id}`}>
                        {loan.id} - {loan.location.state} ({loan.type})
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedProperty && (
                  <ExceedanceCurveChart
                    loans={loanData}
                    scenarios={scenarioNames}
                    selectedYear={selectedYear}
                    chartType="individual"
                    selectedProperty={selectedProperty}
                  />
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <ScenarioComparison
            portfolio={portfolio}
            scenarios={scenarios}
            selectedYear={selectedYear}
          />
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <GeographicalOptimizationDashboard
            loans={loanData}
            scenarios={scenarioNames}
            selectedYear={selectedYear}
          />
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Sensitivity Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Parameter Sensitivities</h4>
                <div className="space-y-3">
                  {[
                    { param: 'Climate Multiplier', impact: 'High', elasticity: 1.8 },
                    { param: 'Property Value Volatility', impact: 'Medium', elasticity: 1.2 },
                    { param: 'Interest Rate Shock', impact: 'Medium', elasticity: 0.9 },
                    { param: 'Insurance Cost Multiplier', impact: 'Low', elasticity: 0.4 },
                    { param: 'Correlation Factor', impact: 'Low', elasticity: 0.3 },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded">
                      <span className="font-medium">{item.param}</span>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          item.impact === 'High' ? 'text-red-900' : 
                          item.impact === 'Medium' ? 'text-yellow-900' : 'text-green-900'
                        }`}>
                          {item.impact} Impact
                        </div>
                        <div className="text-xs text-black">
                          Elasticity: {item.elasticity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Stress Test Results</h4>
                <div className="space-y-3">
                  {scenarios.map((scenario, index) => {
                    const stressMultiplier = getStressMultiplier(scenario.id)
                    const stressedLoss = portfolio.reduce((sum, loan) => 
                      sum + loan.outstanding_balance * 0.005 * stressMultiplier, 0)
                    
                    return (
                      <div key={scenario.id} className="p-3 bg-white border border-gray-200 rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{scenario.name}</span>
                          <span className="font-bold">
                            ${(stressedLoss / 1000000).toFixed(1)}M
                          </span>
                        </div>
                        <div className="text-xs text-black mt-1">
                          Stress Factor: {stressMultiplier.toFixed(1)}x
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="concentration" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Geographic Concentration</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Herfindahl Index</span>
                  <span className="font-bold">{concentrationMetrics.herfindahlIndex.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Diversification Score</span>
                  <span className="font-bold">{concentrationMetrics.diversificationScore.toFixed(3)}</span>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-3">Top State Concentrations</h4>
                <div className="space-y-2">
                  {concentrationMetrics.topStates.map((state, index) => (
                    <div key={state.state} className="flex justify-between items-center">
                      <span className="text-sm">{state.state}</span>
                      <div className="text-right">
                        <span className="font-medium">{state.percentage.toFixed(1)}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, state.percentage * 2)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Metrics by Loan Type</h3>
              <div className="space-y-4">
                {['RRE', 'CRE'].map(type => {
                  const typeLoans = portfolio.filter(loan => loan.type === type)
                  const typeExposure = typeLoans.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
                  const avgLTV = typeLoans.length > 0 
                    ? typeLoans.reduce((sum, loan) => sum + loan.ltv_ratio, 0) / typeLoans.length 
                    : 0
                  
                  return (
                    <div key={type} className="p-4 bg-white border border-gray-200 rounded">
                      <h4 className="font-medium mb-2">{type} Portfolio</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Loans: {typeLoans.length}</div>
                        <div>Avg LTV: {(avgLTV * 100).toFixed(1)}%</div>
                        <div>Exposure: ${(typeExposure / 1000000).toFixed(1)}M</div>
                        <div>% of Portfolio: {((typeExposure / concentrationMetrics.topStates.reduce((sum, s) => sum + s.exposure, 0)) * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getStressMultiplier(scenarioId: string): number {
  const multipliers: Record<string, number> = {
    'baseline': 1.0,
    'orderly_transition': 1.3,
    'disorderly_transition': 1.8,
    'hot_house': 2.5,
  }
  
  return multipliers[scenarioId] || 1.5
}