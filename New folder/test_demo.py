# AI Fitness Trainer - Pre-Demo Test Script

import requests
import time
import sys

def test_backend():
    """Test backend server connectivity"""
    print("\n🔍 Testing Backend Server...")
    print("=" * 50)
    
    try:
        # Test health endpoint
        print("1. Testing health endpoint...")
        r = requests.get("http://127.0.0.1:8002/api/health", timeout=5)
        if r.status_code == 200:
            print("   ✅ Backend server is running")
            print(f"   Response: {r.json()}")
        else:
            print(f"   ❌ Backend returned status {r.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to backend server")
        print("   Please start backend: cd backend && start_backend.bat")
        return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False
    
    # Test exercises endpoint
    print("\n2. Testing exercises endpoint...")
    try:
        r = requests.get("http://127.0.0.1:8002/api/workout/exercises?limit=10", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('success'):
                print(f"   ✅ Exercises API working")
                print(f"   Retrieved: {data.get('total', 0)} exercises")
                if data.get('exercises'):
                    ex = data['exercises'][0]
                    print(f"   Sample: {ex.get('name', 'Unknown')}")
            else:
                print(f"   ⚠️  API returned success=false")
                return False
        else:
            print(f"   ❌ Exercises API returned status {r.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False
    
    # Test body parts endpoint
    print("\n3. Testing body parts endpoint...")
    try:
        r = requests.get("http://127.0.0.1:8002/api/workout/bodyparts", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('success'):
                print(f"   ✅ Body parts API working")
                print(f"   Available: {data.get('total', 0)} body parts")
                if data.get('bodyParts'):
                    print(f"   Examples: {', '.join(data['bodyParts'][:5])}")
            else:
                print(f"   ⚠️  API returned success=false")
        else:
            print(f"   ⚠️  Body parts returned status {r.status_code}")
    except Exception as e:
        print(f"   ⚠️  Error: {str(e)}")
    
    # Test equipments endpoint
    print("\n4. Testing equipments endpoint...")
    try:
        r = requests.get("http://127.0.0.1:8002/api/workout/equipments", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('success'):
                print(f"   ✅ Equipments API working")
                print(f"   Available: {data.get('total', 0)} equipment types")
                if data.get('equipments'):
                    print(f"   Examples: {', '.join(data['equipments'][:5])}")
            else:
                print(f"   ⚠️  API returned success=false")
        else:
            print(f"   ⚠️  Equipments returned status {r.status_code}")
    except Exception as e:
        print(f"   ⚠️  Error: {str(e)}")
    
    # Test search endpoint
    print("\n5. Testing search endpoint...")
    try:
        r = requests.get("http://127.0.0.1:8002/api/workout/exercises/search?query=squat&limit=5", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('success'):
                print(f"   ✅ Search API working")
                print(f"   Found: {data.get('total', 0)} exercises matching 'squat'")
            else:
                print(f"   ⚠️  Search returned success=false")
        else:
            print(f"   ⚠️  Search returned status {r.status_code}")
    except Exception as e:
        print(f"   ⚠️  Error: {str(e)}")
    
    print("\n" + "=" * 50)
    return True

def test_frontend():
    """Test frontend server connectivity"""
    print("\n🌐 Testing Frontend Server...")
    print("=" * 50)
    
    try:
        r = requests.get("http://localhost:3000", timeout=5)
        if r.status_code == 200:
            print("   ✅ Frontend server is running")
            print("   URL: http://localhost:3000")
        else:
            print(f"   ❌ Frontend returned status {r.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to frontend server")
        print("   Please start frontend: cd frontend && start_frontend.bat")
        return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False
    
    print("=" * 50)
    return True

def main():
    print("\n" + "=" * 50)
    print("  AI FITNESS TRAINER - PRE-DEMO TEST")
    print("=" * 50)
    
    backend_ok = test_backend()
    time.sleep(1)
    frontend_ok = test_frontend()
    
    print("\n" + "=" * 50)
    print("  TEST SUMMARY")
    print("=" * 50)
    
    if backend_ok and frontend_ok:
        print("\n  ✅ All systems operational!")
        print("  🎯 Ready for demo presentation")
        print("\n  Frontend: http://localhost:3000")
        print("  Backend:  http://127.0.0.1:8002")
        print("  API Docs: http://127.0.0.1:8002/docs")
        return 0
    elif backend_ok:
        print("\n  ⚠️  Backend OK, but frontend not running")
        print("  Start frontend: cd frontend && start_frontend.bat")
        return 1
    elif frontend_ok:
        print("\n  ⚠️  Frontend OK, but backend not running")
        print("  Start backend: cd backend && start_backend.bat")
        return 1
    else:
        print("\n  ❌ Both servers need to be started")
        print("  Quick start: Run START_DEMO.bat → Option 3")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
