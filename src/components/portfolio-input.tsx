"use client"

import { useState } from 'react'
import { LoanPortfolio } from '@/types'

// Realistic US metropolitan areas with climate risk profiles
const METRO_AREAS = [
  // High Climate Risk Areas
  { state: 'FL', county: 'Miami-Dade', zip_code: '33101', city: 'Miami', risk_profile: 'high' },
  { state: 'FL', county: 'Broward', zip_code: '33301', city: 'Fort Lauderdale', risk_profile: 'high' },
  { state: 'FL', county: 'Orange', zip_code: '32801', city: 'Orlando', risk_profile: 'medium' },
  { state: 'LA', county: 'Orleans', zip_code: '70112', city: 'New Orleans', risk_profile: 'high' },
  { state: 'TX', county: 'Harris', zip_code: '77001', city: 'Houston', risk_profile: 'high' },
  { state: 'TX', county: 'Galveston', zip_code: '77550', city: 'Galveston', risk_profile: 'high' },
  { state: 'CA', county: 'Los Angeles', zip_code: '90210', city: 'Beverly Hills', risk_profile: 'medium' },
  { state: 'CA', county: 'San Diego', zip_code: '92101', city: 'San Diego', risk_profile: 'medium' },
  { state: 'CA', county: 'Alameda', zip_code: '94501', city: 'Alameda', risk_profile: 'medium' },
  { state: 'NC', county: 'New Hanover', zip_code: '28401', city: 'Wilmington', risk_profile: 'high' },
  { state: 'SC', county: 'Charleston', zip_code: '29401', city: 'Charleston', risk_profile: 'high' },
  { state: 'NJ', county: 'Atlantic', zip_code: '08401', city: 'Atlantic City', risk_profile: 'high' },
  { state: 'NY', county: 'Nassau', zip_code: '11501', city: 'Mineola', risk_profile: 'medium' },
  
  // Medium Climate Risk Areas  
  { state: 'TX', county: 'Dallas', zip_code: '75201', city: 'Dallas', risk_profile: 'medium' },
  { state: 'TX', county: 'Travis', zip_code: '78701', city: 'Austin', risk_profile: 'medium' },
  { state: 'AZ', county: 'Maricopa', zip_code: '85001', city: 'Phoenix', risk_profile: 'medium' },
  { state: 'GA', county: 'Fulton', zip_code: '30301', city: 'Atlanta', risk_profile: 'medium' },
  { state: 'TN', county: 'Davidson', zip_code: '37201', city: 'Nashville', risk_profile: 'low' },
  { state: 'WA', county: 'King', zip_code: '98101', city: 'Seattle', risk_profile: 'medium' },
  { state: 'OR', county: 'Multnomah', zip_code: '97201', city: 'Portland', risk_profile: 'medium' },
  { state: 'CO', county: 'Denver', zip_code: '80201', city: 'Denver', risk_profile: 'medium' },
  
  // Lower Climate Risk Areas
  { state: 'IL', county: 'Cook', zip_code: '60601', city: 'Chicago', risk_profile: 'low' },
  { state: 'OH', county: 'Hamilton', zip_code: '45201', city: 'Cincinnati', risk_profile: 'low' },
  { state: 'MI', county: 'Wayne', zip_code: '48201', city: 'Detroit', risk_profile: 'low' },
  { state: 'PA', county: 'Philadelphia', zip_code: '19101', city: 'Philadelphia', risk_profile: 'low' },
  { state: 'MA', county: 'Suffolk', zip_code: '02101', city: 'Boston', risk_profile: 'low' },
  { state: 'MD', county: 'Baltimore', zip_code: '21201', city: 'Baltimore', risk_profile: 'low' },
  { state: 'VA', county: 'Arlington', zip_code: '22201', city: 'Arlington', risk_profile: 'low' },
  { state: 'MN', county: 'Hennepin', zip_code: '55401', city: 'Minneapolis', risk_profile: 'low' },
  { state: 'WI', county: 'Milwaukee', zip_code: '53201', city: 'Milwaukee', risk_profile: 'low' },
  { state: 'IN', county: 'Marion', zip_code: '46201', city: 'Indianapolis', risk_profile: 'low' },
]

const RRE_PROPERTY_TYPES = ['single_family', 'multifamily']
const CRE_PROPERTY_TYPES = ['office', 'retail', 'industrial', 'warehouse', 'hotel']
const RISK_RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC']

function generateRealisticPortfolio(size: number): LoanPortfolio[] {
  const loans: LoanPortfolio[] = []
  
  for (let i = 0; i < size; i++) {
    const isRRE = Math.random() > 0.3 // 70% RRE, 30% CRE
    const metro = METRO_AREAS[Math.floor(Math.random() * METRO_AREAS.length)]
    const propertyType = isRRE 
      ? RRE_PROPERTY_TYPES[Math.floor(Math.random() * RRE_PROPERTY_TYPES.length)]
      : CRE_PROPERTY_TYPES[Math.floor(Math.random() * CRE_PROPERTY_TYPES.length)]
    
    // Realistic property values based on type and location
    let basePropertyValue: number
    if (isRRE) {
      // RRE values: $200K - $2M depending on location
      const locationMultiplier = metro.risk_profile === 'high' ? 1.5 : metro.risk_profile === 'medium' ? 1.2 : 1.0
      basePropertyValue = (200000 + Math.random() * 800000) * locationMultiplier
      if (propertyType === 'multifamily') {
        basePropertyValue *= (2 + Math.random() * 3) // 2-5x for multifamily
      }
    } else {
      // CRE values: $500K - $20M depending on type and location
      const typeMultipliers = {
        office: 3,
        retail: 2,
        industrial: 2.5,
        warehouse: 1.5,
        hotel: 4
      }
      const locationMultiplier = metro.risk_profile === 'high' ? 1.3 : metro.risk_profile === 'medium' ? 1.1 : 1.0
      basePropertyValue = (500000 + Math.random() * 2000000) * 
        typeMultipliers[propertyType as keyof typeof typeMultipliers] * 
        locationMultiplier
    }
    
    const propertyValue = Math.round(basePropertyValue)
    
    // LTV ratios: more conservative for higher risk areas
    const riskAdjustment = metro.risk_profile === 'high' ? -0.05 : metro.risk_profile === 'medium' ? 0 : 0.05
    const baseLTV = isRRE ? 0.8 : 0.75
    const ltvRatio = Math.max(0.6, Math.min(0.9, baseLTV + riskAdjustment + (Math.random() - 0.5) * 0.2))
    
    const outstandingBalance = Math.round(propertyValue * ltvRatio)
    
    // Interest rates: higher for riskier locations and properties
    const baseRate = isRRE ? 3.5 : 4.0
    const riskPremium = metro.risk_profile === 'high' ? 0.5 : metro.risk_profile === 'medium' ? 0.25 : 0
    const interestRate = baseRate + riskPremium + (Math.random() - 0.5) * 1.0
    
    // Risk ratings: worse for higher risk areas
    const riskRatingIndex = metro.risk_profile === 'high' 
      ? Math.floor(Math.random() * 4) + 3 // BB to CCC
      : metro.risk_profile === 'medium'
      ? Math.floor(Math.random() * 4) + 2 // A to BB  
      : Math.floor(Math.random() * 4) // AAA to BBB
    
    // Origination and maturity dates
    const originationYear = 2018 + Math.floor(Math.random() * 6) // 2018-2023
    const originationMonth = 1 + Math.floor(Math.random() * 12)
    const originationDay = 1 + Math.floor(Math.random() * 28)
    const originationDate = `${originationYear}-${originationMonth.toString().padStart(2, '0')}-${originationDay.toString().padStart(2, '0')}`
    
    const termYears = isRRE ? 30 : (5 + Math.floor(Math.random() * 15)) // RRE: 30yr, CRE: 5-20yr
    const maturityYear = originationYear + termYears
    const maturityDate = `${maturityYear}-${originationMonth.toString().padStart(2, '0')}-${originationDay.toString().padStart(2, '0')}`
    
    loans.push({
      id: `loan_${String(i + 1).padStart(4, '0')}`,
      type: isRRE ? 'RRE' : 'CRE',
      property_type: propertyType,
      outstanding_balance: outstandingBalance,
      ltv_ratio: Math.round(ltvRatio * 1000) / 1000,
      location: {
        state: metro.state,
        county: metro.county,
        zip_code: metro.zip_code,
      },
      property_value: propertyValue,
      origination_date: originationDate,
      maturity_date: maturityDate,
      interest_rate: Math.round(interestRate * 100) / 100,
      risk_rating: RISK_RATINGS[riskRatingIndex],
    })
  }
  
  return loans
}

interface PortfolioInputProps {
  onPortfolioUpdate: (portfolio: LoanPortfolio[]) => void
}

export default function PortfolioInput({ onPortfolioUpdate }: PortfolioInputProps) {
  const [loans, setLoans] = useState<LoanPortfolio[]>([])
  const [newLoan, setNewLoan] = useState<Partial<LoanPortfolio>>({
    type: 'RRE',
    property_type: 'single_family',
    outstanding_balance: 0,
    ltv_ratio: 0.8,
    location: {
      state: '',
      county: '',
      zip_code: '',
    },
    property_value: 0,
    origination_date: '',
    maturity_date: '',
    interest_rate: 0,
    risk_rating: 'BBB',
  })

  const addLoan = () => {
    if (newLoan.outstanding_balance && newLoan.property_value && newLoan.location?.state) {
      const loan: LoanPortfolio = {
        id: `loan_${Date.now()}`,
        type: newLoan.type as 'RRE' | 'CRE',
        property_type: newLoan.property_type!,
        outstanding_balance: newLoan.outstanding_balance,
        ltv_ratio: newLoan.ltv_ratio!,
        location: newLoan.location!,
        property_value: newLoan.property_value,
        origination_date: newLoan.origination_date!,
        maturity_date: newLoan.maturity_date!,
        interest_rate: newLoan.interest_rate!,
        risk_rating: newLoan.risk_rating!,
      }
      
      const updatedLoans = [...loans, loan]
      setLoans(updatedLoans)
      onPortfolioUpdate(updatedLoans)
      
      setNewLoan({
        type: 'RRE',
        property_type: 'single_family',
        outstanding_balance: 0,
        ltv_ratio: 0.8,
        location: { state: '', county: '', zip_code: '' },
        property_value: 0,
        origination_date: '',
        maturity_date: '',
        interest_rate: 0,
        risk_rating: 'BBB',
      })
    }
  }

  const loadSamplePortfolio = () => {
    const sampleLoans: LoanPortfolio[] = generateRealisticPortfolio(500)
    
    setLoans(sampleLoans)
    onPortfolioUpdate(sampleLoans)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portfolio Input</h2>
        <button
          onClick={loadSamplePortfolio}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
        >
          Load 500-Property Sample Portfolio
        </button>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Add New Loan</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Loan Type</label>
            <select
              value={newLoan.type}
              onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value as 'RRE' | 'CRE' })}
              className="w-full p-2 border rounded"
            >
              <option value="RRE">RRE</option>
              <option value="CRE">CRE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Property Type</label>
            <select
              value={newLoan.property_type}
              onChange={(e) => setNewLoan({ ...newLoan, property_type: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {newLoan.type === 'RRE' ? (
                <>
                  <option value="single_family">Single Family</option>
                  <option value="multifamily">Multifamily</option>
                </>
              ) : (
                <>
                  <option value="office">Office</option>
                  <option value="retail">Retail</option>
                  <option value="industrial">Industrial</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="hotel">Hotel</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Outstanding Balance ($)</label>
            <input
              type="number"
              value={newLoan.outstanding_balance}
              onChange={(e) => setNewLoan({ ...newLoan, outstanding_balance: Number(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Property Value ($)</label>
            <input
              type="number"
              value={newLoan.property_value}
              onChange={(e) => setNewLoan({ ...newLoan, property_value: Number(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">LTV Ratio</label>
            <input
              type="number"
              step="0.01"
              max="1"
              value={newLoan.ltv_ratio}
              onChange={(e) => setNewLoan({ ...newLoan, ltv_ratio: Number(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input
              type="text"
              value={newLoan.location?.state}
              onChange={(e) => setNewLoan({ 
                ...newLoan, 
                location: { ...newLoan.location!, state: e.target.value }
              })}
              className="w-full p-2 border rounded"
              placeholder="e.g., CA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Risk Rating</label>
            <select
              value={newLoan.risk_rating}
              onChange={(e) => setNewLoan({ ...newLoan, risk_rating: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="AAA">AAA</option>
              <option value="AA">AA</option>
              <option value="A">A</option>
              <option value="BBB">BBB</option>
              <option value="BB">BB</option>
              <option value="B">B</option>
              <option value="CCC">CCC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={newLoan.interest_rate}
              onChange={(e) => setNewLoan({ ...newLoan, interest_rate: Number(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <button
          onClick={addLoan}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Loan
        </button>
      </div>

      {loans.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Current Portfolio ({loans.length} loans)</h3>
            <div className="text-sm text-slate-600">
              Total Exposure: ${loans.reduce((sum, loan) => sum + loan.outstanding_balance, 0).toLocaleString()}
            </div>
          </div>
          
          {/* Portfolio Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">RRE Loans</div>
              <div className="text-2xl font-bold text-blue-800">
                {loans.filter(l => l.type === 'RRE').length}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">CRE Loans</div>
              <div className="text-2xl font-bold text-green-800">
                {loans.filter(l => l.type === 'CRE').length}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-600 font-medium">Avg LTV</div>
              <div className="text-2xl font-bold text-yellow-800">
                {(loans.reduce((sum, l) => sum + l.ltv_ratio, 0) / loans.length * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-medium">States</div>
              <div className="text-2xl font-bold text-purple-800">
                {new Set(loans.map(l => l.location.state)).size}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-slate-200 rounded-lg">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-4 py-3 border-b text-left text-sm font-semibold text-slate-700">ID</th>
                  <th className="px-4 py-3 border-b text-left text-sm font-semibold text-slate-700">Type</th>
                  <th className="px-4 py-3 border-b text-left text-sm font-semibold text-slate-700">Property Type</th>
                  <th className="px-4 py-3 border-b text-left text-sm font-semibold text-slate-700">Location</th>
                  <th className="px-4 py-3 border-b text-left text-sm font-semibold text-slate-700">Balance</th>
                  <th className="px-4 py-3 border-b text-left text-sm font-semibold text-slate-700">LTV</th>
                  <th className="px-4 py-3 border-b text-left text-sm font-semibold text-slate-700">Rate</th>
                  <th className="px-4 py-3 border-b text-left text-sm font-semibold text-slate-700">Risk Rating</th>
                </tr>
              </thead>
              <tbody>
                {loans.slice(0, 50).map((loan, index) => (
                  <tr key={loan.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-2 border-b text-sm text-slate-600">{loan.id}</td>
                    <td className="px-4 py-2 border-b text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        loan.type === 'RRE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {loan.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b text-sm text-slate-700 capitalize">{loan.property_type.replace('_', ' ')}</td>
                    <td className="px-4 py-2 border-b text-sm text-slate-600">{loan.location.state}, {loan.location.county}</td>
                    <td className="px-4 py-2 border-b text-sm font-medium text-slate-800">${loan.outstanding_balance.toLocaleString()}</td>
                    <td className="px-4 py-2 border-b text-sm text-slate-600">{(loan.ltv_ratio * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2 border-b text-sm text-slate-600">{loan.interest_rate.toFixed(2)}%</td>
                    <td className="px-4 py-2 border-b text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ['AAA', 'AA', 'A'].includes(loan.risk_rating) ? 'bg-green-100 text-green-800' :
                        loan.risk_rating === 'BBB' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {loan.risk_rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loans.length > 50 && (
              <div className="mt-4 text-center text-sm text-slate-500 bg-slate-50 py-3 rounded-b-lg">
                Showing first 50 loans. Total portfolio: {loans.length} loans
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}