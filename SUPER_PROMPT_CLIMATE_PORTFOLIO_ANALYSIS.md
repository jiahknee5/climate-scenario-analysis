# SUPER PROMPT: Climate Scenario Analysis for Loan Portfolios

## Objective
Create a comprehensive step-by-step climate scenario analysis system for loan portfolios (CRE/RRE) that shows how CLIMADA, Climate-OS, and C-bottle calculate impacts on AAL (Average Annual Loss), exceedance curves, PD (Probability of Default), and LGD (Loss Given Default).

## Workflow Steps

### Step 1: Portfolio Data Ingestion
- Load loan portfolio (CRE or RRE)
- Fields: Loan ID, Property Address, Property Value, Loan Amount, LTV, Current PD, Current LGD, Insurance Coverage
- Geocode properties for climate exposure analysis
- Show sample of 10 loans with all fields

### Step 2: Climate Hazard Mapping
- Map each property to climate hazards (hurricanes, floods, wildfires, etc.)
- Show hazard intensity at each location
- Display how each framework (CLIMADA, Climate-OS, C-bottle) assesses hazard exposure
- Table showing: Property ID | Location | Hurricane Risk | Flood Risk | Other Risks

### Step 3: Physical Damage Calculation
- Calculate expected physical damage for each property under different scenarios
- Baseline (current climate)
- 2°C warming scenario
- 4°C warming scenario
- Show damage functions used by each framework
- Table: Property ID | Scenario | CLIMADA Damage | Climate-OS Damage | C-bottle Damage

### Step 4: Insurance Premium Impact
- Calculate insurance premium changes under each scenario
- Show how increased premiums affect borrower cash flows
- Display premium calculations for each framework
- Table: Property ID | Current Premium | Future Premium | Premium Increase | Cash Flow Impact

### Step 5: PD (Probability of Default) Adjustment
- Show how climate risks and insurance costs impact PD
- Original PD → Climate-Adjusted PD
- Different methodologies for each framework
- Table: Loan ID | Original PD | Climate Stress | Insurance Stress | New PD (CLIMADA) | New PD (Climate-OS) | New PD (C-bottle)

### Step 6: LGD (Loss Given Default) Adjustment  
- Calculate how property damage affects recovery values
- Show LGD increase due to physical damage
- Include repair costs and market value impacts
- Table: Loan ID | Original LGD | Damage Impact | Market Impact | New LGD (CLIMADA) | New LGD (Climate-OS) | New LGD (C-bottle)

### Step 7: Expected Loss Calculation
- Calculate EL = PD × LGD × EAD for each loan
- Show portfolio-level expected losses
- Compare across scenarios and frameworks
- Table: Loan ID | EAD | Climate-Adjusted PD | Climate-Adjusted LGD | Expected Loss

### Step 8: AAL (Average Annual Loss) Computation
- Aggregate losses to portfolio level
- Calculate AAL for each scenario
- Show year-by-year projections
- Summary table: Scenario | AAL (CLIMADA) | AAL (Climate-OS) | AAL (C-bottle)

### Step 9: Exceedance Curves Generation
- Build loss exceedance curves
- Show 1-in-10, 1-in-100, 1-in-250 year losses
- Display curves for each framework
- Table: Return Period | Loss (CLIMADA) | Loss (Climate-OS) | Loss (C-bottle)

### Step 10: Portfolio Risk Metrics
- Calculate portfolio VaR and CVaR
- Show risk drift from baseline to severe scenarios
- Economic capital requirements
- Summary dashboard with all key metrics

## Technical Requirements

### Each Step Page Should Include:
1. **Explanation Section**
   - What this step calculates
   - Why it's important
   - Key assumptions

2. **Methodology Comparison**
   - CLIMADA approach (scientific models)
   - Climate-OS approach (statistical trends)  
   - C-bottle approach (property-level assessment)

3. **Calculation Details**
   - Mathematical formulas
   - Parameters used
   - Data transformations

4. **Interactive Elements**
   - Dropdowns to select scenario
   - Toggle between CRE/RRE portfolios
   - Adjust key parameters

5. **Data Table**
   - Sample of 10 loans showing transformations
   - Download as CSV option
   - Sortable columns

6. **Visualization**
   - Charts showing the calculations
   - Before/after comparisons
   - Framework differences

7. **Navigation**
   - Progress bar showing current step
   - Previous/Next buttons
   - Jump to any step

## Sample Portfolio Data Structure

```javascript
const samplePortfolio = [
  {
    loanId: "CRE001",
    propertyType: "Office Building",
    address: "100 Park Ave, Miami, FL",
    propertyValue: 50000000,
    loanAmount: 35000000,
    ltv: 0.70,
    currentPD: 0.02,
    currentLGD: 0.35,
    insuranceCoverage: 0.80,
    lat: 25.7617,
    lng: -80.1918
  },
  // ... more loans
];
```

## Key Metrics to Track

1. **Portfolio Level**
   - Total Exposure
   - Weighted Average PD
   - Weighted Average LGD
   - Expected Loss
   - Unexpected Loss
   - Economic Capital

2. **Scenario Comparison**
   - Baseline vs 2°C vs 4°C
   - Risk drift percentage
   - Capital requirement changes

3. **Framework Differences**
   - Why estimates differ
   - Confidence intervals
   - Model assumptions

## Deliverables

1. Main overview page with workflow diagram
2. 10 step pages with detailed calculations
3. Summary dashboard comparing all frameworks
4. Data export functionality
5. Technical documentation
6. Interactive scenario selector

## Color Coding
- CLIMADA: #2196F3 (Blue)
- Climate-OS: #A23B72 (Purple)
- C-bottle: #4285F4 (Light Blue)
- Baseline: #4CAF50 (Green)
- 2°C Scenario: #FF9800 (Orange)
- 4°C Scenario: #F44336 (Red)

This comprehensive system will clearly show how climate scenarios impact loan portfolios through each calculation step, with full transparency on methodologies and assumptions.