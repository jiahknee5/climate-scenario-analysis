"use client"

import { useMemo } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { ExceedanceCurve, PortfolioExceedanceCurve } from '@/types/climate-data'
import { LoanData } from '@/types/loan-data'
import { ExceedanceCurveAnalyzer } from '@/lib/exceedance-curve-analyzer'

interface ExceedanceCurveChartProps {
  loans: LoanData[]
  scenarios: string[]
  selectedYear: number
  chartType: 'individual' | 'portfolio'
  selectedProperty?: string
}

export default function ExceedanceCurveChart({ 
  loans, 
  scenarios, 
  selectedYear, 
  chartType, 
  selectedProperty 
}: ExceedanceCurveChartProps) {

  const portfolioData = useMemo(() => {
    if (!loans.length || !scenarios.length) return []

    const data: PortfolioExceedanceCurve[] = []
    
    scenarios.forEach(scenario => {
      // Mock hazard data generation for demo
      const mockHazardData = loans.map(loan => ({
        property_id: loan.property_id,
        latitude: 0,
        longitude: 0,
        county: loan.address.county,
        state: loan.address.state,
        zip_code: loan.address.zip_code,
        hazard_type: 'flood' as const,
        return_periods: {
          rp_10: loan.outstanding_balance * 0.001,
          rp_25: loan.outstanding_balance * 0.003,
          rp_50: loan.outstanding_balance * 0.006,
          rp_100: loan.outstanding_balance * 0.012,
          rp_250: loan.outstanding_balance * 0.025,
          rp_500: loan.outstanding_balance * 0.045,
          rp_1000: loan.outstanding_balance * 0.08,
        },
        confidence_interval: {
          p5: loan.outstanding_balance * 0.0005,
          p50: loan.outstanding_balance * 0.001,
          p95: loan.outstanding_balance * 0.002
        }
      }))

      // Generate individual property curves
      const individualCurves: ExceedanceCurve[] = []
      mockHazardData.forEach(hazard => {
        const loan = loans.find(l => l.property_id === hazard.property_id)
        if (loan) {
          const curve = ExceedanceCurveAnalyzer.generatePropertyExceedanceCurve(
            [hazard],
            loan.property_value,
            scenario,
            selectedYear
          )
          individualCurves.push(...curve)
        }
      })

      // Generate portfolio curve
      const portfolioCurve = ExceedanceCurveAnalyzer.generatePortfolioExceedanceCurve(
        individualCurves,
        loans,
        scenario,
        selectedYear
      )

      data.push(portfolioCurve)
    })

    return data
  }, [loans, scenarios, selectedYear])

  const chartData = useMemo(() => {
    if (chartType === 'portfolio') {
      const returnPeriods = [10, 25, 50, 100, 250, 500, 1000]
      
      return returnPeriods.map(rp => {
        const dataPoint: Record<string, number | string> = { 
          returnPeriod: rp,
          probability: ((1 / rp) * 100).toFixed(2) + '%'
        }
        
        scenarios.forEach(scenario => {
          const portfolioCurve = portfolioData.find(p => p.scenario === scenario)
          const point = portfolioCurve?.curve_points.find(cp => cp.return_period === rp)
          dataPoint[scenario] = point ? point.aggregate_loss / 1000000 : 0 // Convert to millions
        })
        
        return dataPoint
      })
    } else {
      // Individual property curve - simplified for demo
      if (!selectedProperty) return []
      
      const returnPeriods = [10, 25, 50, 100, 250, 500, 1000]
      const selectedLoan = loans.find(l => l.property_id === selectedProperty)
      if (!selectedLoan) return []
      
      return returnPeriods.map(rp => {
        const baseLoss = selectedLoan.outstanding_balance * (0.001 * Math.log(rp / 10 + 1))
        
        const dataPoint: Record<string, number | string> = { 
          returnPeriod: rp,
          probability: ((1 / rp) * 100).toFixed(2) + '%'
        }
        
        scenarios.forEach(scenario => {
          const multiplier = getScenarioMultiplier(scenario)
          dataPoint[scenario] = (baseLoss * multiplier) / 1000 // Convert to thousands
        })
        
        return dataPoint
      })
    }
  }, [chartType, portfolioData, scenarios, selectedProperty, loans])

  const riskMetrics = useMemo(() => {
    if (chartType !== 'portfolio' || !portfolioData.length) return null
    
    const baselineScenario = portfolioData.find(p => p.scenario === 'rcp_26') || portfolioData[0]
    return baselineScenario.metrics
  }, [chartType, portfolioData])

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1']

  if (!chartData.length) {
    return (
      <div className="text-center py-8 text-black">
        No data available for exceedance curve analysis
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">
          {chartType === 'portfolio' ? 'Portfolio' : 'Property'} Exceedance Curve - {selectedYear}
        </h3>
        
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="returnPeriod" 
              label={{ value: 'Return Period (Years)', position: 'insideBottom', offset: -5 }}
              scale="log"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis 
              label={{ 
                value: chartType === 'portfolio' ? 'Loss ($M)' : 'Loss ($K)', 
                angle: -90, 
                position: 'insideLeft' 
              }}
            />
            <Tooltip 
              formatter={(value, name) => [
                chartType === 'portfolio' 
                  ? `$${Number(value).toFixed(2)}M` 
                  : `$${Number(value).toFixed(0)}K`,
                name
              ]}
              labelFormatter={(label) => `${label}-Year Event`}
            />
            <Legend />
            
            {scenarios.map((scenario, index) => (
              <Area
                key={scenario}
                type="monotone"
                dataKey={scenario}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {riskMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-900 font-medium">VaR (95%)</div>
            <div className="text-lg font-bold text-blue-900">
              ${(riskMetrics.var_95 / 1000000).toFixed(1)}M
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-900 font-medium">VaR (99%)</div>
            <div className="text-lg font-bold text-red-900">
              ${(riskMetrics.var_99 / 1000000).toFixed(1)}M
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-900 font-medium">TVaR (95%)</div>
            <div className="text-lg font-bold text-yellow-900">
              ${(riskMetrics.tvar_95 / 1000000).toFixed(1)}M
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-900 font-medium">Expected Loss</div>
            <div className="text-lg font-bold text-green-900">
              ${(riskMetrics.expected_loss / 1000000).toFixed(1)}M
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-900 font-medium">Max Probable Loss</div>
            <div className="text-lg font-bold text-purple-900">
              ${(riskMetrics.max_probable_loss / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-gray-50 border rounded-lg p-4">
        <h4 className="font-medium mb-2">Key Insights</h4>
        <div className="text-sm text-black space-y-1">
          <p>• The exceedance curve shows the relationship between loss amounts and their probability of occurrence</p>
          <p>• Steeper curves indicate higher concentration of risk in extreme events</p>
          <p>• VaR metrics show potential losses at different confidence levels for regulatory reporting</p>
          {chartType === 'portfolio' && (
            <p>• Portfolio diversification benefits are reflected in the curve shape and tail metrics</p>
          )}
        </div>
      </div>
    </div>
  )
}

function getScenarioMultiplier(scenario: string): number {
  const multipliers: Record<string, number> = {
    'rcp_26': 1.1,
    'rcp_45': 1.25,
    'rcp_60': 1.35,
    'rcp_85': 1.6,
    'baseline': 1.0,
    'orderly_transition': 1.15,
    'disorderly_transition': 1.35,
    'hot_house': 1.75
  }
  
  return multipliers[scenario] || 1.0
}