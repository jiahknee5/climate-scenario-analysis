"use client"

import { useState } from 'react'
import { ClimateScenario } from '@/types'
import { DEFAULT_SCENARIOS } from '@/lib/climate-scenarios'

interface ScenarioSelectionProps {
  onScenariosChange: (scenarios: ClimateScenario[]) => void
}

export default function ScenarioSelection({ onScenariosChange }: ScenarioSelectionProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<ClimateScenario[]>([DEFAULT_SCENARIOS[0]])

  const toggleScenario = (scenario: ClimateScenario) => {
    const isSelected = selectedScenarios.some(s => s.id === scenario.id)
    let newSelection: ClimateScenario[]
    
    if (isSelected) {
      newSelection = selectedScenarios.filter(s => s.id !== scenario.id)
    } else {
      newSelection = [...selectedScenarios, scenario]
    }
    
    setSelectedScenarios(newSelection)
    onScenariosChange(newSelection)
  }

  const selectAllScenarios = () => {
    setSelectedScenarios(DEFAULT_SCENARIOS)
    onScenariosChange(DEFAULT_SCENARIOS)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Climate Scenarios</h2>
        <button
          onClick={selectAllScenarios}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Select All Scenarios
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DEFAULT_SCENARIOS.map((scenario) => {
          const isSelected = selectedScenarios.some(s => s.id === scenario.id)
          
          return (
            <div
              key={scenario.id}
              className={`border rounded-lg p-6 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleScenario(scenario)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{scenario.name}</h3>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleScenario(scenario)}
                  className="w-5 h-5"
                />
              </div>
              
              <p className="text-gray-600 mb-4">{scenario.description}</p>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-2">Physical Risks</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Temperature: +{scenario.physical_risks.temperature_increase}°C</div>
                    <div>Sea Level: +{scenario.physical_risks.sea_level_rise}m</div>
                    <div>Flood Risk: +{(scenario.physical_risks.flood_probability_increase * 100).toFixed(0)}%</div>
                    <div>Wildfire Risk: +{(scenario.physical_risks.wildfire_probability_increase * 100).toFixed(0)}%</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Transition Risks</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Carbon Price: ${scenario.transition_risks.carbon_price}/tCO2</div>
                    <div>Energy Cost: +{(scenario.transition_risks.energy_cost_increase * 100).toFixed(0)}%</div>
                    <div>Policy Stringency: {(scenario.transition_risks.policy_stringency * 100).toFixed(0)}%</div>
                    <div>Tech Disruption: {(scenario.transition_risks.technology_disruption * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedScenarios.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">
            Selected Scenarios ({selectedScenarios.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedScenarios.map((scenario) => (
              <span
                key={scenario.id}
                className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm"
              >
                {scenario.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}