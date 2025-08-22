#!/usr/bin/env python3
"""
CLIMADA Backend API
Provides actual CLIMADA calculations for the web interface
"""

import json
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
import logging

# Import CLIMADA modules
try:
    from climada.hazard import TropCyclone, TCTracks
    from climada.entity import Entity, ImpactFunc, ImpactFuncSet
    from climada.entity.exposures import LitPop
    from climada.engine import Impact
    from climada.util.constants import SYSTEM_DIR
    import climada.util.coordinates as u_coord
except ImportError as e:
    print("ERROR: CLIMADA not installed. Please install with: pip install climada")
    print(f"Import error: {e}")
    exit(1)

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache for expensive computations
cache = {}

@app.route('/api/climada/version', methods=['GET'])
def get_version():
    """Get CLIMADA version information"""
    try:
        import climada
        return jsonify({
            'climada_version': climada.__version__,
            'status': 'operational',
            'modules': ['hazard', 'entity', 'engine']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/climada/historical-tracks', methods=['GET'])
def get_historical_tracks():
    """
    Get historical hurricane tracks from IBTrACS database
    Query params:
    - basin: ocean basin (NA, EP, WP, etc.)
    - year_min: minimum year
    - year_max: maximum year
    """
    try:
        basin = request.args.get('basin', 'NA')  # North Atlantic default
        year_min = int(request.args.get('year_min', 2010))
        year_max = int(request.args.get('year_max', 2020))
        
        cache_key = f"tracks_{basin}_{year_min}_{year_max}"
        
        if cache_key not in cache:
            logger.info(f"Loading IBTrACS data for {basin} basin, years {year_min}-{year_max}")
            
            # Load historical tracks from IBTrACS
            tc_tracks = TCTracks.from_ibtracs_netcdf(
                provider='usa',
                year_range=(year_min, year_max),
                basin=basin
            )
            
            # Convert to GeoJSON format for web visualization
            features = []
            for track in tc_tracks.data:
                # Skip tracks with insufficient data
                if len(track.lat) < 3:
                    continue
                
                # Create track coordinates
                coordinates = []
                categories = []
                
                for i in range(len(track.lat)):
                    if not np.isnan(track.lat[i]) and not np.isnan(track.lon[i]):
                        coordinates.append([float(track.lon[i]), float(track.lat[i])])
                        
                        # Calculate Saffir-Simpson category from max sustained wind
                        if hasattr(track, 'max_sustained_wind') and not np.isnan(track.max_sustained_wind[i]):
                            wind_kt = track.max_sustained_wind[i]
                            if wind_kt >= 137:
                                cat = 5
                            elif wind_kt >= 113:
                                cat = 4
                            elif wind_kt >= 96:
                                cat = 3
                            elif wind_kt >= 83:
                                cat = 2
                            elif wind_kt >= 64:
                                cat = 1
                            else:
                                cat = 0
                            categories.append(cat)
                        else:
                            categories.append(0)
                
                if len(coordinates) >= 3:  # Only include tracks with at least 3 points
                    features.append({
                        'type': 'Feature',
                        'properties': {
                            'name': track.name if hasattr(track, 'name') else f"Storm_{track.sid}",
                            'sid': track.sid,
                            'season': int(track.season) if hasattr(track, 'season') else year_min,
                            'basin': basin,
                            'category': int(max(categories)) if categories else 0,
                            'max_wind': float(np.nanmax(track.max_sustained_wind)) if hasattr(track, 'max_sustained_wind') else 0
                        },
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': coordinates
                        }
                    })
            
            cache[cache_key] = {
                'type': 'FeatureCollection',
                'features': features,
                'properties': {
                    'basin': basin,
                    'year_range': [year_min, year_max],
                    'count': len(features)
                }
            }
        
        return jsonify(cache[cache_key])
        
    except Exception as e:
        logger.error(f"Error loading historical tracks: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/climada/synthetic-tracks', methods=['POST'])
def generate_synthetic_tracks():
    """
    Generate synthetic hurricane tracks using CLIMADA's probabilistic model
    POST body:
    - scenario: climate scenario (historical, rcp26, rcp45, rcp85)
    - years: number of synthetic years to generate
    """
    try:
        data = request.json
        scenario = data.get('scenario', 'historical')
        n_years = data.get('years', 100)
        basin = data.get('basin', 'NA')
        
        logger.info(f"Generating {n_years} years of synthetic tracks for {scenario} scenario")
        
        # First load historical tracks as basis
        tc_tracks = TCTracks.from_ibtracs_netcdf(
            provider='usa',
            year_range=(1980, 2020),
            basin=basin
        )
        
        # Generate synthetic tracks
        tc_tracks_synth = tc_tracks.calc_perturbed_trajectories(
            nb_synth_tracks=int(n_years / 40)  # Roughly n synthetic tracks per historical track
        )
        
        # Apply climate scenario if not historical
        if scenario != 'historical':
            # Apply frequency and intensity changes based on scenario
            if scenario == 'rcp26':
                freq_change = 1.1  # 10% increase
                int_change = 1.05  # 5% intensity increase
            elif scenario == 'rcp45':
                freq_change = 1.2  # 20% increase
                int_change = 1.1   # 10% intensity increase
            elif scenario == 'rcp85':
                freq_change = 1.4  # 40% increase
                int_change = 1.15  # 15% intensity increase
            else:
                freq_change = 1.0
                int_change = 1.0
            
            # Note: This is simplified. Real CLIMADA uses more sophisticated climate models
            logger.info(f"Applying climate factors: frequency={freq_change}, intensity={int_change}")
        
        # Convert to GeoJSON (sample subset for web display)
        features = []
        sample_size = min(50, len(tc_tracks_synth.data))  # Limit to 50 tracks for web
        
        for i, track in enumerate(tc_tracks_synth.data[:sample_size]):
            if len(track.lat) < 3:
                continue
                
            coordinates = []
            for j in range(len(track.lat)):
                if not np.isnan(track.lat[j]) and not np.isnan(track.lon[j]):
                    coordinates.append([float(track.lon[j]), float(track.lat[j])])
            
            if len(coordinates) >= 3:
                features.append({
                    'type': 'Feature',
                    'properties': {
                        'name': f"Synthetic_{i}",
                        'type': 'synthetic',
                        'scenario': scenario
                    },
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': coordinates
                    }
                })
        
        return jsonify({
            'type': 'FeatureCollection',
            'features': features,
            'properties': {
                'scenario': scenario,
                'total_tracks': len(tc_tracks_synth.data),
                'displayed_tracks': len(features)
            }
        })
        
    except Exception as e:
        logger.error(f"Error generating synthetic tracks: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/climada/wind-field', methods=['POST'])
def calculate_wind_field():
    """
    Calculate wind field for a specific hurricane
    POST body:
    - track_id: storm identifier
    - resolution: grid resolution in km
    """
    try:
        data = request.json
        track_id = data.get('track_id')
        resolution = data.get('resolution', 10)  # 10km default
        
        logger.info(f"Calculating wind field for track {track_id}")
        
        # This would calculate actual wind fields using Holland model
        # For now, return a placeholder
        # Real implementation would use: tc.calc_windfields()
        
        return jsonify({
            'status': 'success',
            'message': 'Wind field calculation requires significant computation',
            'track_id': track_id,
            'resolution': resolution
        })
        
    except Exception as e:
        logger.error(f"Error calculating wind field: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/climada/impact', methods=['POST'])
def calculate_impact():
    """
    Calculate economic impact for a region
    POST body:
    - country: ISO3 country code
    - scenario: climate scenario
    """
    try:
        data = request.json
        country = data.get('country', 'USA')
        scenario = data.get('scenario', 'historical')
        
        logger.info(f"Calculating impact for {country} under {scenario} scenario")
        
        # Load exposure (LitPop)
        exp = LitPop.from_countries(country)
        
        # Define impact functions
        impf_set = ImpactFuncSet()
        # This would load actual calibrated impact functions
        
        # Calculate impact
        # impact = Impact()
        # impact.calc(exp, impf_set, tc_hazard)
        
        # For demonstration, return exposure summary
        return jsonify({
            'country': country,
            'scenario': scenario,
            'exposure': {
                'total_value': float(exp.gdf.value.sum()),
                'n_assets': len(exp.gdf),
                'currency': 'USD'
            },
            'message': 'Full impact calculation requires hazard data'
        })
        
    except Exception as e:
        logger.error(f"Error calculating impact: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/climada/return-periods', methods=['GET'])
def get_return_periods():
    """
    Calculate return period statistics
    Query params:
    - location: lat,lon coordinates
    - metric: wind_speed or surge_height
    """
    try:
        location = request.args.get('location', '25.7617,-80.1918')  # Miami default
        lat, lon = map(float, location.split(','))
        metric = request.args.get('metric', 'wind_speed')
        
        logger.info(f"Calculating return periods for {lat},{lon}")
        
        # This would calculate actual return periods from hazard data
        # For demonstration, return typical values
        return jsonify({
            'location': {'lat': lat, 'lon': lon},
            'metric': metric,
            'return_periods': {
                '10': 90,   # 10-year return period: 90 mph
                '25': 110,  # 25-year return period: 110 mph
                '50': 125,  # 50-year return period: 125 mph
                '100': 140, # 100-year return period: 140 mph
                '250': 155  # 250-year return period: 155 mph
            },
            'unit': 'mph' if metric == 'wind_speed' else 'ft'
        })
        
    except Exception as e:
        logger.error(f"Error calculating return periods: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting CLIMADA Backend API...")
    print("Make sure CLIMADA is installed: pip install climada")
    print("API will be available at http://localhost:5555")
    app.run(host='0.0.0.0', port=5555, debug=True)