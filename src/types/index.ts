export interface LoanPortfolio {
  id: string;
  type: 'RRE' | 'CRE';
  property_type: string;
  outstanding_balance: number;
  ltv_ratio: number;
  location: {
    state: string;
    county: string;
    zip_code: string;
  };
  property_value: number;
  origination_date: string;
  maturity_date: string;
  interest_rate: number;
  risk_rating: string;
}

export interface ClimateScenario {
  id: string;
  name: string;
  description: string;
  time_horizon: number;
  physical_risks: {
    flood_probability_increase: number;
    wildfire_probability_increase: number;
    hurricane_probability_increase: number;
    temperature_increase: number;
    sea_level_rise: number;
  };
  transition_risks: {
    carbon_price: number;
    energy_cost_increase: number;
    policy_stringency: number;
    technology_disruption: number;
  };
}

export interface ScenarioResult {
  loan_id: string;
  scenario_id: string;
  probability_of_default: number;
  loss_given_default: number;
  expected_loss: number;
  property_value_change: number;
  risk_rating_change: string;
  stress_factor: number;
}

export interface PortfolioSummary {
  total_loans: number;
  total_exposure: number;
  expected_loss: number;
  expected_loss_rate: number;
  high_risk_loans: number;
  property_value_decline: number;
}