export interface HazardData {
  property_id: string;
  latitude: number;
  longitude: number;
  county: string;
  state: string;
  zip_code: string;
  hazard_type: 'flood' | 'wildfire' | 'hurricane' | 'hail' | 'tornado';
  return_periods: {
    rp_10: number;    // 10-year return period AAL
    rp_25: number;    // 25-year return period AAL
    rp_50: number;    // 50-year return period AAL
    rp_100: number;   // 100-year return period AAL
    rp_250: number;   // 250-year return period AAL
    rp_500: number;   // 500-year return period AAL
    rp_1000: number;  // 1000-year return period AAL
  };
  confidence_interval: {
    p5: number;   // 5th percentile
    p50: number;  // 50th percentile (median)
    p95: number;  // 95th percentile
  };
}

export interface ClimateXData {
  property_id: string;
  baseline_year: number;
  projection_years: number[];
  rcp_scenarios: {
    rcp_26: HazardProjection;
    rcp_45: HazardProjection;
    rcp_60: HazardProjection;
    rcp_85: HazardProjection;
  };
  hazards: HazardData[];
}

export interface HazardProjection {
  scenario: string;
  description: string;
  temperature_change: number; // degrees C
  precipitation_change: number; // percentage
  sea_level_rise: number; // meters
  hazard_multipliers: {
    flood: number;
    wildfire: number;
    hurricane: number;
    hail: number;
    tornado: number;
  };
}

export interface ExceedanceCurve {
  property_id: string;
  hazard_type: string;
  scenario: string;
  year: number;
  data_points: {
    return_period: number;
    annual_loss: number;
    probability: number;
  }[];
}

export interface PortfolioGeography {
  region: string;
  state: string;
  county: string;
  exposure_amount: number;
  loan_count: number;
  avg_hazard_score: number;
  risk_concentration: number;
}

export interface InsurancePremium {
  loan_id: string;
  hazard_insurance: {
    coverage_amount: number;
    premium_annual: number;
    deductible: number;
    coverage_type: 'basic' | 'extended' | 'comprehensive';
  };
  flood_insurance: {
    coverage_amount: number;
    premium_annual: number;
    deductible: number;
    nfip_eligible: boolean;
  };
  young_2004_metrics: {
    expected_loss: number;
    risk_loading: number;
    expense_ratio: number;
    profit_margin: number;
  };
}

export interface PortfolioExceedanceCurve {
  scenario: string;
  year: number;
  curve_points: {
    exceedance_probability: number;
    aggregate_loss: number;
    return_period: number;
  }[];
  metrics: {
    var_95: number;
    var_99: number;
    tvar_95: number;
    tvar_99: number;
    expected_loss: number;
    max_probable_loss: number;
  };
  concentration_risk: {
    geographic_concentration: number;
    hazard_concentration: number;
    diversification_benefit: number;
  };
}