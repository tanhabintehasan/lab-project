"""
Laboratory Marketplace API Tests
Tests for services, auth, admin, user dashboard, and enterprise endpoints
"""
import pytest
import requests
import os

BASE_URL = "http://localhost:3000"

class TestPublicAPIs:
    """Public API endpoints - no auth required"""
    
    def test_services_list(self):
        """Test services listing API returns 18 seeded services"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["total"] == 18
        assert len(data["data"]) == 18
        # Verify first service has required fields
        service = data["data"][0]
        assert "id" in service
        assert "slug" in service
        assert "nameZh" in service
        assert "category" in service
        print(f"✅ Services API: {data['total']} services returned")
    
    def test_service_detail(self):
        """Test single service detail API"""
        response = requests.get(f"{BASE_URL}/api/services/tensile-test")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        service = data["data"]
        assert service["slug"] == "tensile-test"
        assert service["nameZh"] == "拉伸试验"
        assert "category" in service
        assert "materials" in service
        assert "standards" in service
        assert "labServices" in service
        print(f"✅ Service detail API: {service['nameZh']}")
    
    def test_service_not_found(self):
        """Test 404 for non-existent service"""
        response = requests.get(f"{BASE_URL}/api/services/non-existent-service")
        assert response.status_code == 200  # API returns 200 with error
        data = response.json()
        assert data["success"] == False
        print("✅ Service not found returns error correctly")
    
    def test_categories_list(self):
        """Test categories API returns 4 categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        categories = data["data"]["data"]
        assert len(categories) == 4
        # Verify category structure
        cat = categories[0]
        assert "id" in cat
        assert "name" in cat
        assert "slug" in cat
        print(f"✅ Categories API: {len(categories)} categories")
    
    def test_materials_list(self):
        """Test materials API"""
        response = requests.get(f"{BASE_URL}/api/materials")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Materials API: {len(data['data'])} materials")
    
    def test_industries_list(self):
        """Test industries API"""
        response = requests.get(f"{BASE_URL}/api/industries")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Industries API: {len(data['data'])} industries")
    
    def test_standards_list(self):
        """Test standards API"""
        response = requests.get(f"{BASE_URL}/api/standards")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Standards API: {len(data['data'])} standards")
    
    def test_services_filter_by_category(self):
        """Test services filtering by category"""
        # First get a category ID
        cat_response = requests.get(f"{BASE_URL}/api/categories")
        categories = cat_response.json()["data"]["data"]
        cat_id = categories[0]["id"]
        
        # Filter services by category
        response = requests.get(f"{BASE_URL}/api/services?category={cat_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Services filter by category: {data['total']} services")
    
    def test_services_search(self):
        """Test services search functionality"""
        response = requests.get(f"{BASE_URL}/api/services?query=拉伸")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["total"] >= 1
        print(f"✅ Services search: {data['total']} results for '拉伸'")


class TestAuthAPIs:
    """Authentication API tests"""
    
    def test_login_admin(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.com",
            "password": "demo123456"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["user"]["role"] == "SUPER_ADMIN"
        assert data["data"]["user"]["email"] == "admin@demo.com"
        print(f"✅ Admin login: {data['data']['user']['name']}")
    
    def test_login_customer(self):
        """Test customer login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@demo.com",
            "password": "demo123456"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["user"]["role"] == "CUSTOMER"
        print(f"✅ Customer login: {data['data']['user']['name']}")
    
    def test_login_enterprise(self):
        """Test enterprise user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "enterprise@demo.com",
            "password": "demo123456"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["user"]["role"] == "ENTERPRISE_MEMBER"
        print(f"✅ Enterprise login: {data['data']['user']['name']}")
    
    def test_login_finance(self):
        """Test finance admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "finance@demo.com",
            "password": "demo123456"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["user"]["role"] == "FINANCE_ADMIN"
        print(f"✅ Finance admin login: {data['data']['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 200  # API returns 200 with error
        data = response.json()
        assert data["success"] == False
        print("✅ Invalid login returns error correctly")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@demo.com",
            "password": "demo123456"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        print("✅ Non-existent user login returns error correctly")


class TestAdminAPIs:
    """Admin API tests - requires admin authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get session"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.com",
            "password": "demo123456"
        })
        assert response.status_code == 200
        assert response.json()["success"] == True
    
    def test_admin_stats(self):
        """Test admin dashboard stats"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        stats = data["data"]
        assert "totalOrders" in stats
        assert "totalUsers" in stats
        assert "totalLabs" in stats
        assert "activeServices" in stats
        assert stats["totalOrders"] == 5
        assert stats["totalUsers"] == 8
        assert stats["activeServices"] == 18
        print(f"✅ Admin stats: {stats['totalOrders']} orders, {stats['totalUsers']} users")
    
    def test_admin_users_list(self):
        """Test admin users listing"""
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["total"] == 8
        print(f"✅ Admin users: {data['total']} users")
    
    def test_admin_finance(self):
        """Test admin finance endpoint"""
        response = self.session.get(f"{BASE_URL}/api/admin/finance")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Admin finance API working")
    
    def test_admin_referrals(self):
        """Test admin referrals endpoint"""
        response = self.session.get(f"{BASE_URL}/api/admin/referrals")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Admin referrals API working")
    
    def test_admin_translations(self):
        """Test admin translations endpoint"""
        response = self.session.get(f"{BASE_URL}/api/admin/translations")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Admin translations API working")
    
    def test_admin_services(self):
        """Test admin services management"""
        response = self.session.get(f"{BASE_URL}/api/admin/services")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Admin services API working")
    
    def test_admin_labs(self):
        """Test admin labs management"""
        response = self.session.get(f"{BASE_URL}/api/admin/labs")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Admin labs API working")


class TestUserDashboardAPIs:
    """User dashboard API tests - requires customer authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as customer and get session"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@demo.com",
            "password": "demo123456"
        })
        assert response.status_code == 200
        assert response.json()["success"] == True
    
    def test_dashboard_stats(self):
        """Test user dashboard stats"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ User dashboard stats API working")
    
    def test_user_orders(self):
        """Test user orders listing"""
        response = self.session.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ User orders API: {data.get('total', len(data.get('data', [])))} orders")
    
    def test_user_wallet(self):
        """Test user wallet endpoint"""
        response = self.session.get(f"{BASE_URL}/api/wallet")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "balance" in data["data"]
        print(f"✅ User wallet API: balance = {data['data']['balance']}")
    
    def test_user_wallet_transactions(self):
        """Test user wallet transactions"""
        response = self.session.get(f"{BASE_URL}/api/wallet/transactions")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ User wallet transactions API working")
    
    def test_user_profile(self):
        """Test user profile endpoint"""
        response = self.session.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["email"] == "customer@demo.com"
        print(f"✅ User profile API: {data['data']['name']}")
    
    def test_user_addresses(self):
        """Test user addresses endpoint"""
        response = self.session.get(f"{BASE_URL}/api/addresses")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ User addresses API working")
    
    def test_user_notifications(self):
        """Test user notifications endpoint"""
        response = self.session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ User notifications API working")
    
    def test_user_referrals(self):
        """Test user referrals endpoint"""
        response = self.session.get(f"{BASE_URL}/api/referrals")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ User referrals API working")


class TestEnterpriseAPIs:
    """Enterprise API tests - requires enterprise user authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as enterprise user and get session"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "enterprise@demo.com",
            "password": "demo123456"
        })
        assert response.status_code == 200
        assert response.json()["success"] == True
    
    def test_enterprise_members(self):
        """Test enterprise members listing"""
        response = self.session.get(f"{BASE_URL}/api/enterprise/members")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Enterprise members API working")
    
    def test_enterprise_wallet(self):
        """Test enterprise wallet endpoint"""
        response = self.session.get(f"{BASE_URL}/api/enterprise/wallet")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Enterprise wallet API working")
    
    def test_enterprise_approvals(self):
        """Test enterprise approvals endpoint"""
        response = self.session.get(f"{BASE_URL}/api/enterprise/approvals")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Enterprise approvals API working")


class TestRFQAPIs:
    """RFQ (Request for Quote) API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as customer and get session"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@demo.com",
            "password": "demo123456"
        })
        assert response.status_code == 200
    
    def test_rfq_list(self):
        """Test RFQ listing"""
        response = self.session.get(f"{BASE_URL}/api/rfq")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ RFQ list API working")


class TestLabsAPIs:
    """Labs API tests"""
    
    def test_labs_list(self):
        """Test labs listing"""
        response = requests.get(f"{BASE_URL}/api/labs")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Labs list API working")
    
    def test_lab_detail(self):
        """Test lab detail"""
        response = requests.get(f"{BASE_URL}/api/labs/demo-testing-lab")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["slug"] == "demo-testing-lab"
        print(f"✅ Lab detail API: {data['data']['nameZh']}")


class TestEquipmentAPIs:
    """Equipment API tests"""
    
    def test_equipment_list(self):
        """Test equipment listing"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✅ Equipment list API working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
