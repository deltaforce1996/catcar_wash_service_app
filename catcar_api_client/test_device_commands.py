#!/usr/bin/env python3
"""
CatCar Wash Service - Device Commands API Tester
Script สำหรับทดสอบส่งคำสั่งไปยัง Device Commands API
"""

import requests
import json
import time
from typing import Dict, Optional
from datetime import datetime

class DeviceCommandsTester:
    def __init__(self, api_base_url: str = "http://localhost:3000"):
        """
        Initialize Device Commands Tester
        
        Args:
            api_base_url: Base URL of the API server
        """
        self.api_base_url = api_base_url
        self.api_endpoint = f"{api_base_url}/api/v1/device-commands"
        
    def _print_response(self, response: requests.Response, command_name: str):
        """Print formatted response"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"\n[{timestamp}] 📤 Sent: {command_name}")
        print(f"Status Code: {response.status_code}")
        
        try:
            data = response.json()
            print(f"Response:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            if response.status_code >= 200 and response.status_code < 300  and data.get('success'):
                status = data.get('data', {}).get('status', 'UNKNOWN')
                if status == 'SUCCESS':
                    print("✅ Command executed successfully")
                elif status == 'SENT':
                    print("📨 Command sent, waiting for ACK...")
                elif status == 'TIMEOUT':
                    print("⏱️  Command timeout - device did not respond")
                elif status == 'FAILED':
                    print("❌ Command failed")
                else:
                    print(f"ℹ️  Status: {status}")
            else:
                print("❌ Request failed")
        except Exception as e:
            print(f"Response Text: {response.text}")
            print(f"Error parsing response: {e}")
    
    def test_apply_config(self, device_id: str):
        """Test APPLY_CONFIG command"""
        print("\n" + "="*60)
        print("🔧 Testing APPLY_CONFIG Command")
        print("="*60)
        
        url = f"{self.api_endpoint}/{device_id}/apply-config"
        
        print(f"Target Device: {device_id}")
        print(f"Endpoint: {url}")
        print("ℹ️  Config will be loaded from database")
        
        try:
            response = requests.post(url, timeout=35)
            self._print_response(response, "APPLY_CONFIG")
        except requests.exceptions.Timeout:
            print("⏱️  Request timeout (35s)")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    def test_restart_device(self, device_id: str, delay_seconds: int = 5):
        """Test RESTART command"""
        print("\n" + "="*60)
        print("🔄 Testing RESTART Command")
        print("="*60)
        
        url = f"{self.api_endpoint}/{device_id}/restart"
        payload = {
            "delay_seconds": delay_seconds
        }
        
        print(f"Target Device: {device_id}")
        print(f"Delay: {delay_seconds} seconds")
        print(f"Endpoint: {url}")
        
        try:
            response = requests.post(url, json=payload, timeout=35)
            self._print_response(response, "RESTART")
        except requests.exceptions.Timeout:
            print("⏱️  Request timeout (35s)")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    def test_update_firmware(self, device_id: str):
        """Test UPDATE_FIRMWARE command"""
        print("\n" + "="*60)
        print("📦 Testing UPDATE_FIRMWARE Command")
        print("="*60)
        
        url = f"{self.api_endpoint}/{device_id}/update-firmware"
        payload = {
            "url": "https://example.com/firmware/v2.0.0.bin",
            "version": "2.0.0",
            "sha256": "abc123def456789abc123def456789abc123def456789abc123def456789abcd",
            "size": 2048576,
            "reboot_after": True
        }
        
        print(f"Target Device: {device_id}")
        print(f"Firmware Version: {payload['version']}")
        print(f"Endpoint: {url}")
        
        try:
            response = requests.post(url, json=payload, timeout=35)
            self._print_response(response, "UPDATE_FIRMWARE")
        except requests.exceptions.Timeout:
            print("⏱️  Request timeout (35s)")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    def test_reset_config(self, device_id: str):
        """Test RESET_CONFIG command"""
        print("\n" + "="*60)
        print("♻️ Testing RESET_CONFIG Command")
        print("="*60)
        
        url = f"{self.api_endpoint}/{device_id}/reset-config"
        
        print(f"Target Device: {device_id}")
        print(f"Endpoint: {url}")
        print("ℹ️  Config will be loaded from database")
        
        try:
            response = requests.post(url, timeout=35)
            self._print_response(response, "RESET_CONFIG")
        except requests.exceptions.Timeout:
            print("⏱️  Request timeout (35s)")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    def test_custom_command(self, device_id: str):
        """Test CUSTOM command"""
        print("\n" + "="*60)
        print("⚙️  Testing CUSTOM Command")
        print("="*60)
        
        url = f"{self.api_endpoint}/{device_id}/custom"
        payload = {
            "command": "MY_CUSTOM_COMMAND",
            "payload": {
                "param1": "test_value",
                "param2": 12345,
                "param3": True
            },
            "require_ack": True
        }
        
        print(f"Target Device: {device_id}")
        print(f"Custom Command: {payload['command']}")
        print(f"Endpoint: {url}")
        
        try:
            response = requests.post(url, json=payload, timeout=35)
            self._print_response(response, "CUSTOM")
        except requests.exceptions.Timeout:
            print("⏱️  Request timeout (35s)")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    def test_all_commands(self, device_id: str, delay_between_tests: float = 2.0):
        """Test all commands sequentially"""
        print("\n" + "="*70)
        print("🚀 Testing All Device Commands")
        print("="*70)
        print(f"Target Device: {device_id}")
        print(f"API Base URL: {self.api_base_url}")
        print("="*70)
        
        tests = [
            ("APPLY_CONFIG", lambda: self.test_apply_config(device_id)),
            ("RESTART", lambda: self.test_restart_device(device_id)),
            ("UPDATE_FIRMWARE", lambda: self.test_update_firmware(device_id)),
            ("RESET_CONFIG", lambda: self.test_reset_config(device_id)),
            ("CUSTOM", lambda: self.test_custom_command(device_id)),
        ]
        
        total = len(tests)
        passed = 0
        failed = 0
        
        for i, (name, test_func) in enumerate(tests, 1):
            print(f"\n📝 Test {i}/{total}: {name}")
            try:
                test_func()
                passed += 1
                time.sleep(delay_between_tests)
            except Exception as e:
                print(f"❌ Test failed: {e}")
                failed += 1
        
        # Summary
        print("\n" + "="*70)
        print("📊 Test Summary")
        print("="*70)
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print("="*70)

def show_menu():
    """Display main menu"""
    print("\n" + "="*60)
    print("🚗 CatCar Wash Service - Device Commands API Tester")
    print("="*60)
    print("📋 เลือกคำสั่งที่ต้องการทดสอบ:")
    print("1. 🔧 APPLY_CONFIG - ส่ง configuration ใหม่")
    print("2. 🔄 RESTART - รีสตาร์ทอุปกรณ์")
    print("3. 📦 UPDATE_FIRMWARE - อัพเดท firmware")
    print("4. ♻️  RESET_CONFIG - รีเซ็ต configuration")
    print("5. ⚙️  CUSTOM - ส่งคำสั่งกำหนดเอง")
    print("6. 🚀 TEST ALL - ทดสอบทุกคำสั่ง")
    print("7. ⚙️  SETTINGS - ตั้งค่า API URL")
    print("8. ❌ EXIT - ออกจากโปรแกรม")
    print("="*60)

def main():
    """Main function"""
    print("🚗 CatCar Wash Service - Device Commands API Tester")
    print("="*60)
    
    # Initialize tester
    api_url = "http://localhost:3000"
    tester = DeviceCommandsTester(api_url)
    
    print(f"🔗 API URL: {api_url}")
    print("ℹ️  No authentication required")
    
    # Get device ID
    device_id = input("\n🆔 Enter Device ID (e.g., D001): ").strip()
    
    if not device_id:
        print("❌ Device ID is required")
        return
    
    while True:
        show_menu()
        choice = input("👉 เลือกคำสั่ง (1-8): ").strip()
        
        try:
            if choice == "1":
                tester.test_apply_config(device_id)
            elif choice == "2":
                delay_input = input("⏱️  Delay seconds (default: 5): ").strip()
                delay = int(delay_input) if delay_input else 5
                tester.test_restart_device(device_id, delay)
            elif choice == "3":
                tester.test_update_firmware(device_id)
            elif choice == "4":
                tester.test_reset_config(device_id)
            elif choice == "5":
                tester.test_custom_command(device_id)
            elif choice == "6":
                delay_input = input("⏱️  Delay between tests (seconds, default: 2): ").strip()
                delay = float(delay_input) if delay_input else 2.0
                tester.test_all_commands(device_id, delay)
            elif choice == "7":
                new_url = input(f"🔗 Enter API URL (current: {api_url}): ").strip()
                if new_url:
                    api_url = new_url
                    tester = DeviceCommandsTester(api_url)
                    print(f"✅ API URL updated to: {api_url}")
            elif choice == "8":
                print("👋 ออกจากโปรแกรม")
                break
            else:
                print("❌ กรุณาเลือกหมายเลข 1-8")
            
            # Pause before showing menu again
            if choice not in ["7", "8"]:
                input("\n⏸️  กด Enter เพื่อกลับไปเมนูหลัก...")
        
        except KeyboardInterrupt:
            print("\n\n👋 ออกจากโปรแกรม")
            break
        except Exception as e:
            print(f"\n❌ เกิดข้อผิดพลาด: {e}")
            input("\n⏸️  กด Enter เพื่อกลับไปเมนูหลัก...")

if __name__ == "__main__":
    main()

