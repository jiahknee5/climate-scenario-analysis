import { ClimateScenario } from '@/types';

export const DEFAULT_SCENARIOS: ClimateScenario[] = [
  {
    id: 'baseline',
    name: 'Baseline Scenario',
    description: 'Current climate conditions with minimal change',
    time_horizon: 30,
    physical_risks: {
      flood_probability_increase: 0,
      wildfire_probability_increase: 0,
      hurricane_probability_increase: 0,
      temperature_increase: 0,
      sea_level_rise: 0,
    },
    transition_risks: {
      carbon_price: 0,
      energy_cost_increase: 0,
      policy_stringency: 0,
      technology_disruption: 0,
    },
  },
  {
    id: 'orderly_transition',
    name: 'Orderly Transition (1.5°C)',
    description: 'Gradual transition to net-zero with immediate policy action',
    time_horizon: 30,
    physical_risks: {
      flood_probability_increase: 0.15,
      wildfire_probability_increase: 0.20,
      hurricane_probability_increase: 0.10,
      temperature_increase: 1.5,
      sea_level_rise: 0.3,
    },
    transition_risks: {
      carbon_price: 130,
      energy_cost_increase: 0.25,
      policy_stringency: 0.8,
      technology_disruption: 0.6,
    },
  },
  {
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
  },
  {
    id: 'hot_house',
    name: 'Hot House World (3°C+)',
    description: 'Failed transition with severe physical climate impacts',
    time_horizon: 30,
    physical_risks: {
      flood_probability_increase: 0.60,
      wildfire_probability_increase: 0.80,
      hurricane_probability_increase: 0.50,
      temperature_increase: 3.5,
      sea_level_rise: 1.2,
    },
    transition_risks: {
      carbon_price: 50,
      energy_cost_increase: 0.15,
      policy_stringency: 0.2,
      technology_disruption: 0.3,
    },
  },
];