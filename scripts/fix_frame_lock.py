#!/usr/bin/env python3
"""
Fix frame isLocked field for the first image element
"""

import requests
import json

SUPABASE_URL = "https://ytchxzitnustjwoiqxew.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Y2h4eml0bnVzdGp3b2lxeGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDk1NjcsImV4cCI6MjA4MDYyNTU2N30.wzodR_V-gNeZYqNY-nX2PK2axxQbgygTz_2cPvD8K3E"
FRAME_ID = "ac75ba82-e2d0-400b-bc27-ec2ef261a88d"

def get_frame():
    """Get frame from Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/frames?id=eq.{FRAME_ID}&select=id,name,design_data"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()[0] if response.json() else None
    return None

def update_frame(design_data):
    """Update frame in Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/frames?id=eq.{FRAME_ID}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    data = {"design_data": design_data}
    response = requests.patch(url, headers=headers, json=data)
    return response.status_code == 200 or response.status_code == 204

def main():
    print("Fetching frame...")
    frame = get_frame()
    if not frame:
        print("Frame not found!")
        return
    
    print(f"Frame: {frame['name']}")
    design_data = frame['design_data']
    elements = design_data.get('elements', [])
    
    print(f"Found {len(elements)} elements")
    
    # Fix isLocked for image elements
    updated = False
    for i, el in enumerate(elements):
        if el.get('type') == 'image':
            if not el.get('isLocked'):
                print(f"  [{i}] Fixing image '{el.get('name')}' - setting isLocked=true")
                elements[i]['isLocked'] = True
                updated = True
            else:
                print(f"  [{i}] Image '{el.get('name')}' already locked")
    
    if updated:
        design_data['elements'] = elements
        print("\nUpdating frame...")
        if update_frame(design_data):
            print("✅ Frame updated successfully!")
        else:
            print("❌ Failed to update frame")
    else:
        print("\nNo changes needed")

if __name__ == "__main__":
    main()
