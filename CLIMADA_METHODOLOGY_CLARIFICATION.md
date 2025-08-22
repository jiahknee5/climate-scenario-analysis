# CLIMADA Methodology Clarification

## Important Disclaimer

**This demo does NOT use actual CLIMADA methodology**. It's a visualization demo that generates synthetic hurricane tracks for demonstration purposes only.

## What is CLIMADA?

CLIMADA (CLIMate ADAptation) is a sophisticated, peer-reviewed scientific framework developed by ETH Zurich that:

1. **Uses Real Scientific Models**:
   - Emanuel hurricane model for tropical cyclone generation
   - Holland parametric wind field model
   - Actual historical track data from IBTrACS
   - Statistical downscaling of climate models
   - Calibrated damage functions based on historical events

2. **Provides Quantitative Risk Assessment**:
   - Probabilistic hazard modeling (10,000+ year synthetic catalogs)
   - Vulnerability curves for different asset types
   - Economic impact modeling
   - Uncertainty quantification

3. **Key CLIMADA Components**:
   ```python
   # Real CLIMADA usage example
   from climada.hazard import TropCyclone
   from climada.entity import ImpactFuncSet, Entity
   from climada.engine import Impact
   
   # Load historical tracks
   tc_hist = TropCyclone.from_ibtracs_netcdf(
       provider='usa',
       year_range=(1980, 2020),
       basin='NA'
   )
   
   # Generate probabilistic events
   tc_prob = tc_hist.calc_perturbed_trajectories(
       nb_synth_tracks=10
   )
   
   # Calculate wind fields
   tc_prob.calc_windfields()
   
   # Compute impacts with real vulnerability curves
   impact = Impact()
   impact.calc(exposure, impf_set, tc_prob)
   ```

## What This Demo Actually Does

This demonstration:
- Generates **synthetic/fake** hurricane tracks using simple mathematical functions
- Creates visually plausible paths with Coriolis-like curves
- Does **NOT** use CLIMADA's scientific models
- Does **NOT** provide real risk assessment
- Is for **visualization and UI demonstration only**

## Key Differences

| Aspect | Real CLIMADA | This Demo |
|--------|--------------|-----------|
| Track Generation | Statistical model based on historical data | Random generation with basic physics |
| Wind Fields | Holland model with terrain effects | Not implemented |
| Damage Functions | Calibrated curves from real events | Not implemented |
| Climate Projections | CMIP6 model integration | Simple multipliers |
| Validation | Peer-reviewed, validated against observations | None |
| Purpose | Scientific risk assessment | UI/UX demonstration |

## Why This Matters

1. **Scientific Integrity**: Real climate risk assessment requires rigorous methodology
2. **Decision Making**: This demo should NOT be used for actual risk decisions
3. **Accuracy**: Real CLIMADA provides quantitative uncertainty bounds
4. **Liability**: Using proper tools matters for insurance and planning

## To Use Real CLIMADA

```bash
# Install actual CLIMADA
pip install climada

# Or from source
git clone https://github.com/CLIMADA-project/climada_python.git
cd climada_python
pip install -e .
```

Then follow their tutorials at: https://climada-python.readthedocs.io/

## Recommendation

If you need actual climate risk assessment:
1. Use the real CLIMADA framework
2. Work with climate scientists
3. Validate results against observations
4. Include uncertainty quantification
5. Follow peer-reviewed methodologies

This demo is purely for showing how a web interface might work, not for actual climate risk analysis.