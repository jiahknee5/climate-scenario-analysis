"use client"

import { useState } from 'react'
import { LoanPortfolio } from '@/types'

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
    const sampleLoans: LoanPortfolio[] = [
      {
        id: 'loan_001',
        type: 'RRE',
        property_type: 'single_family',
        outstanding_balance: 500000,
        ltv_ratio: 0.8,
        location: { state: 'FL', county: 'Miami-Dade', zip_code: '33101' },
        property_value: 625000,
        origination_date: '2020-01-15',
        maturity_date: '2050-01-15',
        interest_rate: 3.5,
        risk_rating: 'A',
      },
      {
        id: 'loan_002',
        type: 'CRE',
        property_type: 'office',
        outstanding_balance: 2000000,
        ltv_ratio: 0.75,
        location: { state: 'CA', county: 'Los Angeles', zip_code: '90210' },
        property_value: 2666667,
        origination_date: '2019-06-01',
        maturity_date: '2029-06-01',
        interest_rate: 4.0,
        risk_rating: 'BBB',
      },
      {
        id: 'loan_003',
        type: 'CRE',
        property_type: 'industrial',
        outstanding_balance: 1500000,
        ltv_ratio: 0.7,
        location: { state: 'TX', county: 'Harris', zip_code: '77001' },
        property_value: 2142857,
        origination_date: '2021-03-10',
        maturity_date: '2031-03-10',
        interest_rate: 4.5,
        risk_rating: 'BB',
      },
    ]
    
    setLoans(sampleLoans)
    onPortfolioUpdate(sampleLoans)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portfolio Input</h2>
        <button
          onClick={loadSamplePortfolio}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Load Sample Portfolio
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
          <h3 className="text-lg font-semibold mb-4">Current Portfolio ({loans.length} loans)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border text-left">ID</th>
                  <th className="px-4 py-2 border text-left">Type</th>
                  <th className="px-4 py-2 border text-left">Property Type</th>
                  <th className="px-4 py-2 border text-left">Balance</th>
                  <th className="px-4 py-2 border text-left">LTV</th>
                  <th className="px-4 py-2 border text-left">State</th>
                  <th className="px-4 py-2 border text-left">Risk Rating</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-4 py-2 border">{loan.id}</td>
                    <td className="px-4 py-2 border">{loan.type}</td>
                    <td className="px-4 py-2 border">{loan.property_type}</td>
                    <td className="px-4 py-2 border">${loan.outstanding_balance.toLocaleString()}</td>
                    <td className="px-4 py-2 border">{(loan.ltv_ratio * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2 border">{loan.location.state}</td>
                    <td className="px-4 py-2 border">{loan.risk_rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}