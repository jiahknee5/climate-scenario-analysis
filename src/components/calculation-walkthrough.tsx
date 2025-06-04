"use client"

import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LoanPortfolio, ClimateScenario } from '@/types'

interface CalculationWalkthroughProps {
  portfolio: LoanPortfolio[]
  scenarios: ClimateScenario[]
}

export default function CalculationWalkthrough({ portfolio, scenarios }: CalculationWalkthroughProps) {
  const [selectedLoan, setSelectedLoan] = useState<LoanPortfolio | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<ClimateScenario | null>(null)

  // Use first loan as default example
  const exampleLoan = selectedLoan || portfolio[0] || {
    id: 'example_001',
    type: 'RRE' as const,
    property_type: 'single_family',
    outstanding_balance: 800000,
    ltv_ratio: 0.75,
    location: { state: 'FL', county: 'Miami-Dade', zip_code: '33101' },
    property_value: 1066667,
    origination_date: '2020-03-15',
    maturity_date: '2050-03-15',
    interest_rate: 4.25,
    risk_rating: 'A',
  }

  const exampleScenario = selectedScenario || scenarios[0] || {
    id: 'disorderly_transition',
    name: 'Disorderly Transition',
    description: 'Late and sudden policy action leading to economic disruption',
    time_horizon: 30,
    physical_risks: {
      flood_probability_increase: 0.25,
      wildfire_probability_increase: 0.35,
      hurricane_probability_increase: 0.20,
      temperature_increase: 2.0,
      sea_level_rise: 0.5,
    },
    transition_risks: {
      carbon_price: 200,
      energy_cost_increase: 0.45,
      policy_stringency: 0.9,
      technology_disruption: 0.8,
    },
  }

  const baselineLTV = exampleLoan ? exampleLoan.outstanding_balance / exampleLoan.property_value : 0

  const calculations = useMemo(() => {
    if (!exampleLoan) return null

    // Step 1: Baseline Risk Parameters
    const baselinePD = getBaselinePD(exampleLoan.risk_rating)
    const baselineLGD = getBaselineLGD(exampleLoan.ltv_ratio)
    const ead = exampleLoan.outstanding_balance
    const baselineEL = baselinePD * baselineLGD * ead

    // Step 2: Climate Risk Adjustments
    const physicalRiskMultiplier = calculatePhysicalRiskMultiplier(exampleLoan, exampleScenario)
    const transitionRiskMultiplier = calculateTransitionRiskMultiplier(exampleLoan, exampleScenario)
    const combinedStressFactor = Math.max(physicalRiskMultiplier, transitionRiskMultiplier)

    // Step 3: Stressed Risk Parameters
    const stressedPD = Math.min(baselinePD * combinedStressFactor, 1.0)
    const stressedLGD = Math.min(baselineLGD * (1 + combinedStressFactor * 0.2), 1.0)
    const stressedEL = stressedPD * stressedLGD * ead

    // Step 4: Property Value Impact
    const propertyValueChange = calculatePropertyValueChange(exampleLoan, exampleScenario)
    const adjustedPropertyValue = exampleLoan.property_value * (1 + propertyValueChange)
    const adjustedLTV = exampleLoan.outstanding_balance / adjustedPropertyValue

    // Step 5: Insurance Premium Calculation (Young 2004 Model)
    const baseInsurancePremium = calculateInsurancePremium(exampleLoan, 'baseline')
    const stressedInsurancePremium = calculateInsurancePremium(exampleLoan, exampleScenario.id)
    const premiumIncrease = stressedInsurancePremium - baseInsurancePremium

    // Step 6: Capital Impact
    const riskWeightBaseline = getRiskWeight(exampleLoan.risk_rating, baselineLTV)
    const riskWeightStressed = getRiskWeight(getRiskRatingChange(combinedStressFactor), adjustedLTV)
    const capitalRequirementBaseline = exampleLoan.outstanding_balance * riskWeightBaseline * 0.08
    const capitalRequirementStressed = exampleLoan.outstanding_balance * riskWeightStressed * 0.08

    return {
      baseline: {
        pd: baselinePD,
        lgd: baselineLGD,
        ead,
        expectedLoss: baselineEL,
        loanLossProvision: baselineEL * 0.6,
        insurancePremium: baseInsurancePremium,
        riskWeight: riskWeightBaseline,
        capitalRequirement: capitalRequirementBaseline,
      },
      stressed: {
        pd: stressedPD,
        lgd: stressedLGD,
        ead,
        expectedLoss: stressedEL,
        loanLossProvision: stressedEL * 0.6,
        insurancePremium: stressedInsurancePremium,
        riskWeight: riskWeightStressed,
        capitalRequirement: capitalRequirementStressed,
      },
      adjustments: {
        physicalRiskMultiplier,
        transitionRiskMultiplier,
        combinedStressFactor,
        propertyValueChange,
        adjustedPropertyValue,
        adjustedLTV,
        premiumIncrease,
        elIncrease: stressedEL - baselineEL,
        capitalIncrease: capitalRequirementStressed - capitalRequirementBaseline,
      }
    }
  }, [exampleLoan, exampleScenario, baselineLTV])

  const sensitivityData = useMemo(() => {
    if (!calculations) return []
    
    const stressFactors = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0]
    return stressFactors.map(factor => ({
      stressFactor: factor,
      expectedLoss: calculations.baseline.expectedLoss * factor,
      capitalRequirement: calculations.baseline.capitalRequirement * (1 + (factor - 1) * 0.5),
      insurancePremium: calculations.baseline.insurancePremium * (1 + (factor - 1) * 0.3),
    }))
  }, [calculations])

  if (!calculations) {
    return (
      <div className="text-center py-8 text-black">
        Please load a portfolio to see detailed calculations
      </div>
    )
  }


  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Climate Risk Calculation Methodology</h2>
        <p className="text-blue-100">
          Step-by-step calculation walkthrough for CCAR stress testing and regulatory compliance
        </p>
      </div>

      {/* Property Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Select Property for Analysis</h3>
          <select
            value={selectedLoan?.id || exampleLoan.id}
            onChange={(e) => {
              const loan = portfolio.find(l => l.id === e.target.value)
              setSelectedLoan(loan || null)
            }}
            className="w-full p-3 border rounded-lg text-black"
          >
            <option value={exampleLoan.id}>Example Property (Miami SFR)</option>
            {portfolio.slice(0, 20).map(loan => (
              <option key={loan.id} value={loan.id}>
                {loan.id} - {loan.location.state} {loan.type} ({loan.property_type})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Select Climate Scenario</h3>
          <select
            value={selectedScenario?.id || exampleScenario.id}
            onChange={(e) => {
              const scenario = scenarios.find(s => s.id === e.target.value)
              setSelectedScenario(scenario || null)
            }}
            className="w-full p-3 border rounded-lg text-black"
          >
            <option value={exampleScenario.id}>Disorderly Transition (2°C)</option>
            {scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Property Details */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Property Characteristics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded">
            <div className="text-sm text-black">Property Value</div>
            <div className="text-xl font-bold text-black">${exampleLoan.property_value.toLocaleString()}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded">
            <div className="text-sm text-black">Outstanding Balance</div>
            <div className="text-xl font-bold text-black">${exampleLoan.outstanding_balance.toLocaleString()}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded">
            <div className="text-sm text-black">Current LTV</div>
            <div className="text-xl font-bold text-black">{(baselineLTV * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-slate-50 p-4 rounded">
            <div className="text-sm text-black">Risk Rating</div>
            <div className="text-xl font-bold text-black">{exampleLoan.risk_rating}</div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Calculations */}
      <div className="space-y-6">
        {/* Step 1: Baseline Risk Parameters */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">Step 1: Baseline Risk Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-black mb-2">Probability of Default (PD)</h4>
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">Based on Risk Rating: {exampleLoan.risk_rating}</div>
                <div className="text-2xl font-bold text-blue-800">{(calculations.baseline.pd * 100).toFixed(3)}%</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">Loss Given Default (LGD)</h4>
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <div className="text-sm text-green-600 mb-1">LTV-Adjusted: {(baselineLTV * 100).toFixed(1)}%</div>
                <div className="text-2xl font-bold text-green-800">{(calculations.baseline.lgd * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">Expected Loss (EL)</h4>
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                <div className="text-sm text-yellow-600 mb-1">PD × LGD × EAD</div>
                <div className="text-2xl font-bold text-yellow-800">${calculations.baseline.expectedLoss.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Climate Risk Assessment */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-800">Step 2: Climate Risk Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-black mb-3">Physical Risk Multiplier</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Flood Risk Increase:</span>
                  <span className="font-medium">+{(exampleScenario.physical_risks.flood_probability_increase * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Hurricane Risk Increase:</span>
                  <span className="font-medium">+{(exampleScenario.physical_risks.hurricane_probability_increase * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sea Level Rise:</span>
                  <span className="font-medium">+{exampleScenario.physical_risks.sea_level_rise}m</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Physical Risk Multiplier:</span>
                    <span className="text-red-600">{calculations.adjustments.physicalRiskMultiplier.toFixed(2)}x</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-black mb-3">Transition Risk Multiplier</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Carbon Price:</span>
                  <span className="font-medium">${exampleScenario.transition_risks.carbon_price}/tCO2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Energy Cost Increase:</span>
                  <span className="font-medium">+{(exampleScenario.transition_risks.energy_cost_increase * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Policy Stringency:</span>
                  <span className="font-medium">{(exampleScenario.transition_risks.policy_stringency * 100).toFixed(0)}%</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Transition Risk Multiplier:</span>
                    <span className="text-orange-600">{calculations.adjustments.transitionRiskMultiplier.toFixed(2)}x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-red-800">Combined Stress Factor:</span>
              <span className="text-2xl font-bold text-red-800">{calculations.adjustments.combinedStressFactor.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* Step 3: Stressed Parameters */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-purple-800">Step 3: Climate-Adjusted Risk Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-black mb-2">Stressed PD</h4>
              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">
                  {(calculations.baseline.pd * 100).toFixed(3)}% × {calculations.adjustments.combinedStressFactor.toFixed(2)}
                </div>
                <div className="text-2xl font-bold text-purple-800">{(calculations.stressed.pd * 100).toFixed(3)}%</div>
                <div className="text-xs text-purple-600 mt-1">
                  Increase: +{((calculations.stressed.pd - calculations.baseline.pd) * 100).toFixed(3)}%
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">Stressed LGD</h4>
              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">
                  Collateral value adjustment
                </div>
                <div className="text-2xl font-bold text-purple-800">{(calculations.stressed.lgd * 100).toFixed(1)}%</div>
                <div className="text-xs text-purple-600 mt-1">
                  Increase: +{((calculations.stressed.lgd - calculations.baseline.lgd) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">Stressed EL</h4>
              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">
                  Climate-adjusted expected loss
                </div>
                <div className="text-2xl font-bold text-purple-800">${calculations.stressed.expectedLoss.toLocaleString()}</div>
                <div className="text-xs text-purple-600 mt-1">
                  Increase: +${calculations.adjustments.elIncrease.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Property Value Impact */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-indigo-800">Step 4: Property Value Impact Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-black mb-2">Value Change</h4>
              <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                <div className="text-sm text-indigo-600 mb-1">Physical + Transition impacts</div>
                <div className="text-2xl font-bold text-indigo-800">
                  {calculations.adjustments.propertyValueChange >= 0 ? '+' : ''}
                  {(calculations.adjustments.propertyValueChange * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">Adjusted Value</h4>
              <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                <div className="text-sm text-indigo-600 mb-1">Climate-adjusted property value</div>
                <div className="text-2xl font-bold text-indigo-800">
                  ${calculations.adjustments.adjustedPropertyValue.toLocaleString()}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">New LTV</h4>
              <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                <div className="text-sm text-indigo-600 mb-1">Post-climate adjustment</div>
                <div className="text-2xl font-bold text-indigo-800">
                  {(calculations.adjustments.adjustedLTV * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Insurance Premium Calculation */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-orange-800">Step 5: Insurance Premium Calculation (Young 2004 Model)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-black mb-3">Baseline Premium Components</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Expected Loss:</span>
                  <span className="font-medium">${calculations.baseline.expectedLoss.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Risk Loading (30%):</span>
                  <span className="font-medium">${(calculations.baseline.expectedLoss * 0.3).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Expense Ratio (25%):</span>
                  <span className="font-medium">${(calculations.baseline.expectedLoss * 0.25).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total Premium:</span>
                    <span className="text-orange-600">${calculations.baseline.insurancePremium.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-black mb-3">Climate-Adjusted Premium</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Stressed Expected Loss:</span>
                  <span className="font-medium">${calculations.stressed.expectedLoss.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Climate Risk Loading (40%):</span>
                  <span className="font-medium">${(calculations.stressed.expectedLoss * 0.4).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Expense Ratio (25%):</span>
                  <span className="font-medium">${(calculations.stressed.expectedLoss * 0.25).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Stressed Premium:</span>
                    <span className="text-red-600">${calculations.stressed.insurancePremium.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-orange-800">Premium Increase:</span>
              <span className="text-2xl font-bold text-orange-800">+${calculations.adjustments.premiumIncrease.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Step 6: Capital Impact */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-800">Step 6: Regulatory Capital Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-black mb-3">Baseline Capital Requirement</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Risk Weight ({exampleLoan.risk_rating}):</span>
                  <span className="font-medium">{(calculations.baseline.riskWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Risk-Weighted Assets:</span>
                  <span className="font-medium">${(exampleLoan.outstanding_balance * calculations.baseline.riskWeight).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Capital Ratio (8%):</span>
                  <span className="font-medium">8.0%</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Capital Requirement:</span>
                    <span className="text-green-600">${calculations.baseline.capitalRequirement.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-black mb-3">Stressed Capital Requirement</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Stressed Risk Weight:</span>
                  <span className="font-medium">{(calculations.stressed.riskWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Stressed RWA:</span>
                  <span className="font-medium">${(exampleLoan.outstanding_balance * calculations.stressed.riskWeight).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Capital Ratio (8%):</span>
                  <span className="font-medium">8.0%</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Stressed Capital:</span>
                    <span className="text-red-600">${calculations.stressed.capitalRequirement.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-green-800">Additional Capital Required:</span>
              <span className="text-2xl font-bold text-green-800">+${calculations.adjustments.capitalIncrease.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitivity Analysis */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Sensitivity Analysis: Impact of Stress Factor</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Expected Loss Sensitivity</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensitivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stressFactor" label={{ value: 'Stress Factor', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Expected Loss ($)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Expected Loss']} />
                <Line type="monotone" dataKey="expectedLoss" stroke="#8884d8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="font-medium mb-3">Capital Requirement Sensitivity</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensitivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stressFactor" label={{ value: 'Stress Factor', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Capital Requirement ($)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Capital Requirement']} />
                <Line type="monotone" dataKey="capitalRequirement" stroke="#82ca9d" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Business Implications */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Business Implications & Risk Management Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-blue-300">CCAR Implications</h4>
            <ul className="space-y-2 text-sm text-white">
              <li>• Expected loss increases by {((calculations.adjustments.elIncrease / calculations.baseline.expectedLoss) * 100).toFixed(0)}% under climate stress</li>
              <li>• Additional capital requirement: ${calculations.adjustments.capitalIncrease.toLocaleString()}</li>
              <li>• Loan loss provision impact: ${(calculations.adjustments.elIncrease * 0.6).toLocaleString()}</li>
              <li>• Consider portfolio rebalancing for geographic concentration</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-green-300">Risk Mitigation Strategies</h4>
            <ul className="space-y-2 text-sm text-white">
              <li>• Enhanced insurance requirements for high-risk properties</li>
              <li>• Geographic diversification to reduce concentration risk</li>
              <li>• Lower LTV limits for climate-vulnerable locations</li>
              <li>• Dynamic pricing based on climate risk scoring</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions for calculations
function getBaselinePD(riskRating: string): number {
  const pdMap: Record<string, number> = {
    'AAA': 0.0001, 'AA': 0.0002, 'A': 0.0005, 'BBB': 0.0015,
    'BB': 0.0035, 'B': 0.008, 'CCC': 0.015, 'CC': 0.025, 'C': 0.035
  }
  return pdMap[riskRating] || 0.005
}

function getBaselineLGD(ltvRatio: number): number {
  return Math.max(0.3, Math.min(0.8, ltvRatio * 0.6))
}

function calculatePhysicalRiskMultiplier(loan: LoanPortfolio, scenario: ClimateScenario): number {
  const locationRisk = getLocationRiskFactors(loan.location.state)
  let multiplier = 1.0
  
  if (locationRisk.flood_prone) {
    multiplier += scenario.physical_risks.flood_probability_increase * 2
  }
  if (locationRisk.hurricane_prone) {
    multiplier += scenario.physical_risks.hurricane_probability_increase * 1.8
  }
  if (locationRisk.coastal) {
    multiplier += scenario.physical_risks.sea_level_rise * 0.5
  }
  
  return multiplier
}

function calculateTransitionRiskMultiplier(loan: LoanPortfolio, scenario: ClimateScenario): number {
  let multiplier = 1.0
  
  if (loan.type === 'CRE') {
    const energyIntensity = getEnergyIntensityFactor(loan.property_type)
    multiplier += scenario.transition_risks.energy_cost_increase * energyIntensity * 0.5
  }
  
  multiplier += (scenario.transition_risks.carbon_price / 1000) * 0.1
  
  return multiplier
}

function calculatePropertyValueChange(loan: LoanPortfolio, scenario: ClimateScenario): number {
  const physicalImpact = -Math.min(0.3, 
    (scenario.physical_risks.flood_probability_increase + 
     scenario.physical_risks.hurricane_probability_increase) * 0.15)
  
  const transitionImpact = loan.type === 'CRE' 
    ? -Math.min(0.2, scenario.transition_risks.energy_cost_increase * 0.3)
    : -Math.min(0.1, scenario.transition_risks.energy_cost_increase * 0.1)
  
  return physicalImpact + transitionImpact
}

function calculateInsurancePremium(loan: LoanPortfolio, scenarioId: string): number {
  const baseEL = getBaselinePD(loan.risk_rating) * getBaselineLGD(loan.ltv_ratio) * loan.outstanding_balance
  const riskLoading = scenarioId === 'baseline' ? 0.3 : 0.4
  const expenseRatio = 0.25
  
  return baseEL * (1 + riskLoading + expenseRatio)
}

function getRiskWeight(riskRating: string, ltv: number): number {
  const baseWeights: Record<string, number> = {
    'AAA': 0.2, 'AA': 0.2, 'A': 0.5, 'BBB': 0.5, 'BB': 1.0, 'B': 1.5, 'CCC': 1.5
  }
  const baseWeight = baseWeights[riskRating] || 1.0
  const ltvAdjustment = ltv > 0.8 ? 1.5 : 1.0
  return baseWeight * ltvAdjustment
}

function getRiskRatingChange(stressFactor: number): string {
  if (stressFactor < 1.2) return 'A'
  if (stressFactor < 1.5) return 'BBB'
  if (stressFactor < 2.0) return 'BB'
  return 'B'
}

function getLocationRiskFactors(state: string) {
  const highRiskStates = {
    flood_prone: ['FL', 'LA', 'TX', 'NC', 'SC', 'NJ', 'NY'],
    hurricane_prone: ['FL', 'LA', 'TX', 'AL', 'MS', 'NC', 'SC', 'GA'],
    coastal: ['FL', 'CA', 'TX', 'NY', 'NC', 'SC', 'GA', 'WA', 'OR', 'ME', 'NH', 'MA', 'RI', 'CT', 'NJ', 'DE', 'MD', 'VA'],
  }
  
  return {
    flood_prone: highRiskStates.flood_prone.includes(state),
    hurricane_prone: highRiskStates.hurricane_prone.includes(state),
    coastal: highRiskStates.coastal.includes(state),
  }
}

function getEnergyIntensityFactor(propertyType: string): number {
  const intensityMap: Record<string, number> = {
    'office': 1.2, 'retail': 1.0, 'industrial': 1.8, 'warehouse': 0.8, 'hotel': 1.5,
    'multifamily': 0.9, 'single_family': 0.7,
  }
  return intensityMap[propertyType] || 1.0
}