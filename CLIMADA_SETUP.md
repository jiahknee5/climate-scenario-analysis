# CLIMADA Setup Guide

This application uses the actual CLIMADA Python package from ETH Zurich to provide real climate risk analysis data.

## Prerequisites

- Python 3.8 or higher
- Conda (recommended) or pip
- At least 8GB RAM
- 10GB free disk space (for climate data)

## Installation

### Option 1: Using Conda (Recommended)

```bash
# Create a new conda environment
conda create -n climada_env python=3.9
conda activate climada_env

# Install CLIMADA
conda install -c conda-forge climada

# Install additional dependencies for the web backend
pip install flask flask-cors
```

### Option 2: Using pip

```bash
# Create virtual environment
python -m venv climada_venv
source climada_venv/bin/activate  # On Windows: climada_venv\Scripts\activate

# Install CLIMADA
pip install climada

# Install web backend dependencies
pip install flask flask-cors
```

## Setup CLIMADA Data

CLIMADA needs to download climate data on first use:

```python
# Run this once to download required data
python -c "from climada.util.constants import SYSTEM_DIR; print(f'CLIMADA data directory: {SYSTEM_DIR}')"
```

## Running the Backend

1. Start the CLIMADA backend API:
```bash
cd /Users/johnnychung/claude/Development/web-apps/climate-scenario-analysis
python climada_backend.py
```

2. The API will be available at `http://localhost:5555`

3. Test the API:
```bash
# Check version
curl http://localhost:5555/api/climada/version

# Get historical tracks
curl "http://localhost:5555/api/climada/historical-tracks?basin=NA&year_min=2015&year_max=2020"
```

## API Endpoints

### GET `/api/climada/version`
Returns CLIMADA version and status

### GET `/api/climada/historical-tracks`
Get real historical hurricane tracks from IBTrACS
- Query params: `basin`, `year_min`, `year_max`

### POST `/api/climada/synthetic-tracks`
Generate synthetic hurricane tracks
- Body: `{"scenario": "rcp85", "years": 100, "basin": "NA"}`

### POST `/api/climada/wind-field`
Calculate wind fields for a hurricane
- Body: `{"track_id": "2017242N14283", "resolution": 10}`

### POST `/api/climada/impact`
Calculate economic impact
- Body: `{"country": "USA", "scenario": "historical"}`

### GET `/api/climada/return-periods`
Get return period statistics
- Query params: `location=25.76,-80.19`, `metric=wind_speed`

## Frontend Integration

The frontend now needs to be updated to use the real CLIMADA API instead of synthetic data:

```javascript
// Instead of synthetic data
const hurricaneData = await generateSyntheticData();

// Use real CLIMADA data
const response = await fetch('http://localhost:5555/api/climada/historical-tracks?basin=NA');
const hurricaneData = await response.json();
```

## Important Notes

1. **First Run**: CLIMADA will download several GB of climate data on first use
2. **Performance**: Some calculations (especially wind fields) can take several minutes
3. **Memory**: Large calculations may require 8GB+ RAM
4. **Caching**: The backend caches expensive calculations

## Troubleshooting

### ImportError: No module named 'climada'
- Make sure you've activated the conda/virtual environment
- Try: `conda install -c conda-forge climada` or `pip install climada`

### Connection refused on port 5555
- Make sure the backend is running: `python climada_backend.py`
- Check firewall settings

### Out of memory errors
- Reduce the number of synthetic tracks
- Use a smaller geographic region
- Increase system RAM or use a cloud instance

## References

- [CLIMADA Documentation](https://climada-python.readthedocs.io/)
- [CLIMADA GitHub](https://github.com/CLIMADA-project/climada_python)
- [CLIMADA Paper](https://doi.org/10.5194/gmd-16-2169-2023)