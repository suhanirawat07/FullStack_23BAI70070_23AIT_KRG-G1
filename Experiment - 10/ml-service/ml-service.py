"""
ML Service for Disaster Relief System
Provides demand forecasting, resource matching, and NLP-based request classification
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import re
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# ==================== NLP FOR REQUEST CLASSIFICATION ====================

class RequestClassifier:
    """Simple NLP-based classifier for categorizing disaster requests"""
    
    def __init__(self):
        self.keywords = {
            'Food': ['food', 'meal', 'ration', 'hunger', 'eat', 'bread', 'rice', 'wheat'],
            'Medical': ['medical', 'medicine', 'doctor', 'hospital', 'injury', 'sick', 'health', 'first aid'],
            'Shelter': ['shelter', 'tent', 'house', 'roof', 'accommodation', 'stay', 'living'],
            'Water': ['water', 'drink', 'thirst', 'clean water', 'drinking water'],
            'Clothing': ['cloth', 'clothes', 'dress', 'wear', 'blanket', 'winter'],
            'Rescue': ['rescue', 'trapped', 'stuck', 'save', 'emergency', 'help']
        }
        
        self.urgency_keywords = {
            'critical': ['urgent', 'emergency', 'critical', 'immediately', 'dying', 'severe'],
            'high': ['soon', 'quickly', 'asap', 'important', 'needed'],
            'medium': ['need', 'require', 'want'],
            'low': ['maybe', 'if possible', 'when available']
        }
    
    def classify_request(self, text):
        """Classify request text into resource type and urgency"""
        text = text.lower()
        
        # Classify resource type
        scores = {}
        for category, keywords in self.keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            scores[category] = score
        
        resource_type = max(scores, key=scores.get) if max(scores.values()) > 0 else 'General'
        
        # Classify urgency
        urgency = 'medium'  # default
        for level, keywords in self.urgency_keywords.items():
            if any(keyword in text for keyword in keywords):
                urgency = level
                break
        
        # Extract quantity if mentioned
        quantity_match = re.search(r'(\d+)', text)
        quantity = int(quantity_match.group(1)) if quantity_match else None
        
        return {
            'resource_type': resource_type,
            'urgency': urgency,
            'quantity': quantity,
            'confidence': scores[resource_type] / (sum(scores.values()) + 1)
        }

# ==================== DEMAND FORECASTING ====================

class DemandForecaster:
    """Predict future resource demands based on historical data"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.resource_types = ['Food', 'Medical', 'Shelter', 'Water', 'Clothing']
    
    def train(self, historical_data):
        """Train forecasting models for each resource type"""
        for resource_type in self.resource_types:
            # Filter data for this resource type
            type_data = historical_data[historical_data['type'] == resource_type]
            
            if len(type_data) < 10:
                continue
            
            # Prepare features
            X = type_data[['day_of_week', 'month', 'affected_area', 'severity']].values
            y = type_data['quantity'].values
            
            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Train model
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X_scaled, y)
            
            self.models[resource_type] = model
            self.scalers[resource_type] = scaler
    
    def predict(self, resource_type, features):
        """Predict demand for a specific resource type"""
        if resource_type not in self.models:
            # Return default prediction if model not trained
            return self._get_default_prediction(resource_type)
        
        scaler = self.scalers[resource_type]
        model = self.models[resource_type]
        
        X_scaled = scaler.transform([features])
        prediction = model.predict(X_scaled)[0]
        
        return {
            'resource_type': resource_type,
            'predicted_demand': int(prediction),
            'confidence': 0.85,
            'timeframe': '24h'
        }
    
    def _get_default_prediction(self, resource_type):
        """Return default predictions when model is not trained"""
        defaults = {
            'Food': 800,
            'Medical': 350,
            'Shelter': 150,
            'Water': 1200,
            'Clothing': 250
        }
        return {
            'resource_type': resource_type,
            'predicted_demand': defaults.get(resource_type, 500),
            'confidence': 0.70,
            'timeframe': '24h'
        }

# ==================== VOLUNTEER CLUSTERING ====================

class VolunteerMatcher:
    """Match volunteers to requests based on skills and location"""
    
    def __init__(self):
        self.kmeans = None
        self.scaler = StandardScaler()
    
    def cluster_volunteers(self, volunteers_data):
        """Cluster volunteers based on location and skills"""
        if len(volunteers_data) < 3:
            return volunteers_data
        
        # Prepare features: [lat, lng, skill_count]
        X = volunteers_data[['lat', 'lng', 'skill_count']].values
        X_scaled = self.scaler.fit_transform(X)
        
        # Perform clustering
        n_clusters = min(3, len(volunteers_data))
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = self.kmeans.fit_predict(X_scaled)
        
        volunteers_data['cluster'] = clusters
        return volunteers_data
    
    def match_volunteer(self, request_location, required_skills, volunteers):
        """Match best volunteer for a request"""
        scores = []
        
        for volunteer in volunteers:
            # Calculate distance score
            distance = self._calculate_distance(
                request_location['lat'], 
                request_location['lng'],
                volunteer['lat'], 
                volunteer['lng']
            )
            distance_score = max(0, 100 - distance * 10)
            
            # Calculate skill match score
            skill_match = len(set(required_skills) & set(volunteer['skills']))
            skill_score = (skill_match / max(len(required_skills), 1)) * 100
            
            # Availability bonus
            availability_bonus = 20 if volunteer.get('available', False) else 0
            
            # Total score
            total_score = (distance_score * 0.4) + (skill_score * 0.4) + (availability_bonus * 0.2)
            
            scores.append({
                'volunteer_id': volunteer['id'],
                'name': volunteer['name'],
                'score': total_score,
                'distance_km': distance,
                'skill_match': skill_match
            })
        
        # Sort by score
        scores.sort(key=lambda x: x['score'], reverse=True)
        return scores
    
    def _calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates in km"""
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # Earth's radius in km
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c

# ==================== RESOURCE OPTIMIZATION ====================

class ResourceOptimizer:
    """Optimize resource allocation across multiple requests"""
    
    def optimize_allocation(self, requests, resources):
        """Find optimal resource allocation"""
        allocations = []
        
        for req in requests:
            # Find matching resources
            matching_resources = [
                r for r in resources 
                if r['type'] == req['type'] and r['quantity'] >= req['quantity']
            ]
            
            if not matching_resources:
                continue
            
            # Score each resource
            best_resource = None
            best_score = -1
            
            for resource in matching_resources:
                distance = self._calculate_distance(
                    req['location']['lat'], req['location']['lng'],
                    resource['location']['lat'], resource['location']['lng']
                )
                
                # Score based on distance and excess quantity
                score = 100 - (distance * 5)
                excess = resource['quantity'] - req['quantity']
                score += min(excess / 10, 20)  # Bonus for having extra
                
                if score > best_score:
                    best_score = score
                    best_resource = resource
            
            if best_resource:
                allocations.append({
                    'request_id': req['id'],
                    'resource_id': best_resource['id'],
                    'match_score': best_score,
                    'distance_km': self._calculate_distance(
                        req['location']['lat'], req['location']['lng'],
                        best_resource['location']['lat'], best_resource['location']['lng']
                    )
                })
        
        return allocations
    
    def _calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates"""
        from math import radians, sin, cos, sqrt, atan2
        R = 6371
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        return R * c

# ==================== INITIALIZE SERVICES ====================

classifier = RequestClassifier()
forecaster = DemandForecaster()
volunteer_matcher = VolunteerMatcher()
optimizer = ResourceOptimizer()

# ==================== API ENDPOINTS ====================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'ML Service'}), 200

@app.route('/api/ml/classify-request', methods=['POST'])
def classify_request():
    """Classify a text request into resource type and urgency"""
    try:
        data = request.json
        text = data.get('text', '')
        
        result = classifier.classify_request(text)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/forecast-demand', methods=['POST'])
def forecast_demand():
    """Forecast resource demand"""
    try:
        data = request.json
        resource_type = data.get('resource_type')
        
        # Current date features
        now = datetime.now()
        features = [
            now.weekday(),  # day of week
            now.month,      # month
            data.get('affected_area', 5),  # affected area (default)
            data.get('severity', 3)        # severity (1-5)
        ]
        
        result = forecaster.predict(resource_type, features)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/forecast-all', methods=['GET'])
def forecast_all_demands():
    """Forecast demand for all resource types"""
    try:
        now = datetime.now()
        features = [now.weekday(), now.month, 5, 3]
        
        forecasts = []
        for resource_type in ['Food', 'Medical', 'Shelter', 'Water', 'Clothing']:
            forecast = forecaster.predict(resource_type, features)
            forecasts.append(forecast)
        
        return jsonify(forecasts), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/match-volunteers', methods=['POST'])
def match_volunteers():
    """Match volunteers to a request"""
    try:
        data = request.json
        request_location = data.get('request_location')
        required_skills = data.get('required_skills', [])
        volunteers = data.get('volunteers', [])
        
        matches = volunteer_matcher.match_volunteer(
            request_location, 
            required_skills, 
            volunteers
        )
        
        return jsonify(matches), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/optimize-allocation', methods=['POST'])
def optimize_allocation():
    """Optimize resource allocation"""
    try:
        data = request.json
        requests = data.get('requests', [])
        resources = data.get('resources', [])
        
        allocations = optimizer.optimize_allocation(requests, resources)
        
        return jsonify(allocations), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/analyze-disaster', methods=['POST'])
def analyze_disaster():
    """Comprehensive disaster analysis"""
    try:
        data = request.json
        
        # Get all predictions
        now = datetime.now()
        features = [now.weekday(), now.month, 
                   data.get('affected_area', 5), 
                   data.get('severity', 3)]
        
        forecasts = []
        for resource_type in ['Food', 'Medical', 'Shelter', 'Water', 'Clothing']:
            forecast = forecaster.predict(resource_type, features)
            forecasts.append(forecast)
        
        # Calculate total predicted demand
        total_demand = sum(f['predicted_demand'] for f in forecasts)
        
        # Risk assessment
        severity = data.get('severity', 3)
        risk_level = 'High' if severity >= 4 else 'Medium' if severity >= 3 else 'Low'
        
        analysis = {
            'forecasts': forecasts,
            'total_predicted_demand': total_demand,
            'risk_level': risk_level,
            'severity_score': severity,
            'recommended_response_time': '2-4 hours' if severity >= 4 else '4-8 hours',
            'priority_resources': sorted(forecasts, 
                                        key=lambda x: x['predicted_demand'], 
                                        reverse=True)[:3]
        }
        
        return jsonify(analysis), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🤖 Starting ML Service...")
    print("📊 Endpoints:")
    print("  - POST /api/ml/classify-request")
    print("  - POST /api/ml/forecast-demand")
    print("  - GET  /api/ml/forecast-all")
    print("  - POST /api/ml/match-volunteers")
    print("  - POST /api/ml/optimize-allocation")
    print("  - POST /api/ml/analyze-disaster")
    app.run(debug=True, port=5001)