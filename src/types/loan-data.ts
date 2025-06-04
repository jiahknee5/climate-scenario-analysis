export interface LoanData {
  loan_id: string;
  loan_number: string;
  property_id: string;
  loan_amount: number;
  outstanding_balance: number;
  original_term_months: number;
  remaining_term_months: number;
  interest_rate: number;
  monthly_payment: number;
  loan_type: 'conventional' | 'fha' | 'va' | 'usda' | 'jumbo';
  property_type: 'single_family' | 'condo' | 'townhouse' | 'multifamily';
  property_value: number;
  ltv_ratio: number;
  combined_ltv: number;
  borrower_income: number;
  dti_ratio: number;
  credit_score: number;
  origination_date: string;
  maturity_date: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    county: string;
    latitude: number;
    longitude: number;
  };
  risk_metrics: {
    pd_baseline: number;    // Probability of Default (baseline)
    lgd_baseline: number;   // Loss Given Default (baseline)
    ead: number;           // Exposure at Default
    expected_loss: number; // EL = PD × LGD × EAD
  };
  insurance_coverage: {
    hazard_insurance_amount: number;
    flood_insurance_amount: number;
    hazard_premium_annual: number;
    flood_premium_annual: number;
    total_insurance_premium: number;
  };
}

export interface ClimateImpactedMetrics {
  loan_id: string;
  scenario: string;
  year: number;
  climate_adjustments: {
    property_value_change: number;    // percentage change
    ltv_adjustment: number;           // new LTV after property value change
    dti_adjustment: number;           // DTI change due to insurance premium increases
    insurance_premium_increase: number; // percentage increase in premiums
  };
  adjusted_risk_metrics: {
    pd_climate_adjusted: number;      // Climate-adjusted PD
    lgd_climate_adjusted: number;     // Climate-adjusted LGD
    ead_climate_adjusted: number;     // Climate-adjusted EAD
    expected_loss_climate: number;    // Climate-adjusted EL
    stress_factor: number;            // Overall stress multiplier
  };
}

export interface TimeframedAnalysis {
  timeframe: 'ccar_3yr' | 'ccar_5yr' | 'medium_term_2050' | 'long_term_2100';
  description: string;
  analysis_year: number;
  regulatory_context: string;
}

export interface PortfolioSummary {
  scenario: string;
  timeframe: TimeframedAnalysis;
  total_loans: number;
  total_exposure: number;
  baseline_expected_loss: number;
  climate_expected_loss: number;
  climate_impact: number;           // percentage increase in expected loss
  high_risk_loans: number;          // loans with stress factor > 1.5
  geographical_concentration: {
    high_risk_regions: string[];
    diversification_score: number;
  };
  insurance_analysis: {
    total_premium_increase: number;
    underinsured_loans: number;
    flood_coverage_gap: number;
  };
}

export interface BusinessObjective {
  primary_goal: string;
  regulatory_requirements: string[];
  risk_appetite: {
    max_climate_loss_increase: number;  // percentage
    max_geographic_concentration: number; // percentage of portfolio
    target_diversification_score: number;
  };
  business_metrics: {
    target_roe: number;
    target_net_interest_margin: number;
    max_provision_expense_ratio: number;
  };
}