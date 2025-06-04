"use client"

import { useState } from 'react'
import { LoanPortfolio, ClimateScenario } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PortfolioInput from '@/components/portfolio-input'
import ScenarioSelection from '@/components/scenario-selection'
import ResultsDashboard from '@/components/results-dashboard'
import AdvancedAnalytics from '@/components/advanced-analytics'
import RegulatoryReporting from '@/components/regulatory-reporting'

export default function Home() {
  const [portfolio, setPortfolio] = useState<LoanPortfolio[]>([])
  const [selectedScenarios, setSelectedScenarios] = useState<ClimateScenario[]>([])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-800">
            Climate Scenario Analysis Platform
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Assess climate risk impacts on RRE and CRE loan portfolios
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="portfolio">Portfolio Input</TabsTrigger>
            <TabsTrigger value="scenarios">Climate Scenarios</TabsTrigger>
            <TabsTrigger value="results">Analysis Results</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
            <TabsTrigger value="regulatory">Regulatory Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioInput onPortfolioUpdate={setPortfolio} />
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <ScenarioSelection onScenariosChange={setSelectedScenarios} />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <ResultsDashboard 
              portfolio={portfolio} 
              scenarios={selectedScenarios}
            />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <AdvancedAnalytics 
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