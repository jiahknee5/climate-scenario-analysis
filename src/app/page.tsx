"use client"

import { useState } from 'react'
import { LoanPortfolio, ClimateScenario } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PortfolioInput from '@/components/portfolio-input'
import ScenarioSelection from '@/components/scenario-selection'
import ResultsDashboard from '@/components/results-dashboard'
import RegulatoryReporting from '@/components/regulatory-reporting'
import CalculationWalkthrough from '@/components/calculation-walkthrough'
import RiskManagementDashboard from '@/components/risk-management-dashboard'

export default function Home() {
  const [portfolio, setPortfolio] = useState<LoanPortfolio[]>([])
  const [selectedScenarios, setSelectedScenarios] = useState<ClimateScenario[]>([])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-800">
            CCAR Climate Risk Analysis Platform
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Comprehensive Stress Testing & Climate Risk Modeling for Banking Portfolios
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">CCAR Compliant</span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">Basel III</span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">Fed Scenarios</span>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">IFRS 9</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="portfolio">Portfolio Input</TabsTrigger>
            <TabsTrigger value="scenarios">Climate Scenarios</TabsTrigger>
            <TabsTrigger value="calculations">Calculation Details</TabsTrigger>
            <TabsTrigger value="results">Risk Analysis</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
            <TabsTrigger value="regulatory">CCAR Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioInput onPortfolioUpdate={setPortfolio} />
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <ScenarioSelection onScenariosChange={setSelectedScenarios} />
          </TabsContent>

          <TabsContent value="calculations" className="space-y-6">
            <CalculationWalkthrough 
              portfolio={portfolio} 
              scenarios={selectedScenarios}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <ResultsDashboard 
              portfolio={portfolio} 
              scenarios={selectedScenarios}
            />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <RiskManagementDashboard 
              portfolio={portfolio} 
              scenarios={selectedScenarios}
            />
          </TabsContent>

          <TabsContent value="regulatory" className="space-y-6">
            <RegulatoryReporting 
              portfolio={portfolio} 
              scenarios={selectedScenarios}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-slate-800 border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-300 text-sm">
            <p>Climate Scenario Analysis Platform for Banking Risk Management</p>
            <p className="mt-2">
              Built for regulatory compliance and strategic planning
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}