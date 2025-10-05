#!/usr/bin/env python3
"""
CatCar Wash Service - API Client
Script สำหรับเรียกใช้ API endpoints ของ CatCar Wash Service
"""

import requests
import json
import sys
import random
import string
from typing import Dict, Optional

class CatCarClient:
    def __init__(self, base_url: str = "http://localhost:3000/api/v1"):
        """
        Initialize the client
        
        Args:
            base_url: Base URL ของ API server
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # เก็บผลลัพธ์จาก API
        self.last_result: Optional[Dict] = None
        
    def need_register(self, chip_id: str, mac_address: str, firmware_version: str) -> Dict:
        """
        เรียกใช้ API /devices/need-register
        
        Args:
            chip_id: Chip ID ของอุปกรณ์
            mac_address: MAC Address ของอุปกรณ์
            firmware_version: เวอร์ชัน firmware
            
        Returns:
            Dict: ผลลัพธ์จาก API
        """
        url = f"{self.base_url}/devices/need-register"
        
        payload = {
            "chip_id": chip_id,
            "mac_address": mac_address,
            "firmware_version": firmware_version
        }
        
        try:
            print(f"📡 กำลังส่ง request ไปยัง: {url}")
            print(f"📋 ข้อมูลที่ส่ง: {json.dumps(payload, indent=2, ensure_ascii=False)}")
            
            response = self.session.post(url, json=payload)
            
            print(f"📊 Status Code: {response.status_code}")
            
            if 200 <= response.status_code <= 299:
                result = response.json()
                self.last_result = result  # เก็บผลลัพธ์ไว้
                
                print("✅ สำเร็จ!")
                print(f"📌 PIN: {result['data']['pin']}")
                print(f"🆔 Device ID: {result['data']['device_id']}")
                print(f"💬 Message: {result['message']}")
                
                return result
            else:
                print(f"❌ เกิดข้อผิดพลาด: {response.status_code}")
                print(f"📝 Response: {response.text}")
                return {"error": f"HTTP {response.status_code}", "message": response.text}
                
        except requests.exceptions.ConnectionError:
            print("❌ ไม่สามารถเชื่อมต่อกับ server ได้")
            print(f"🔗 ตรวจสอบว่า server ทำงานอยู่ที่: {self.base_url}")
            return {"error": "Connection Error"}
        except requests.exceptions.RequestException as e:
            print(f"❌ เกิดข้อผิดพลาดในการส่ง request: {e}")
            return {"error": str(e)}
        except json.JSONDecodeError:
            print("❌ ไม่สามารถ parse response ได้")
            return {"error": "Invalid JSON response"}
    
    def get_last_result(self) -> Optional[Dict]:
        """
        ดึงผลลัพธ์ล่าสุด
        
        Returns:
            Dict: ผลลัพธ์ล่าสุด หรือ None หากยังไม่มีการเรียก API
        """
        return self.last_result
    
    def get_pin(self) -> Optional[str]:
        """
        ดึง PIN จากผลลัพธ์ล่าสุด
        
        Returns:
            str: PIN หรือ None หากไม่มี
        """
        if self.last_result and 'data' in self.last_result:
            return self.last_result['data'].get('pin')
        return None
    
    def get_device_id(self) -> Optional[str]:
        """
        ดึง Device ID จากผลลัพธ์ล่าสุด
        
        Returns:
            str: Device ID หรือ None หากไม่มี
        """
        if self.last_result and 'data' in self.last_result:
            return self.last_result['data'].get('device_id')
        return None

def generate_random_data():
    """
    สร้างข้อมูลสุ่มสำหรับ registration
    
    Returns:
        tuple: (chip_id, mac_address, firmware_version)
    """
    # สร้าง Chip ID สุ่ม (รูปแบบ: ESP32-XXXXXXXX)
    chip_id = f"ESP32-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"
    
    # สร้าง MAC Address สุ่ม (รูปแบบ: XX:XX:XX:XX:XX:XX)
    mac_parts = [f"{random.randint(0, 255):02x}" for _ in range(6)]
    mac_address = ":".join(mac_parts).upper()
    
    # สร้าง Firmware Version สุ่ม (รูปแบบ: vX.X.X)
    major = random.randint(1, 5)
    minor = random.randint(0, 9)
    patch = random.randint(0, 99)
    firmware_version = f"v{major}.{minor}.{patch}"
    
    return chip_id, mac_address, firmware_version

def show_menu():
    """แสดงเมนูเลือก command"""
    print("\n" + "=" * 50)
    print("🚗 CatCar Wash Service - API Client")
    print("=" * 50)
    print("📋 เลือก Command ที่ต้องการ:")
    print("1. 🔧 Need Register - สร้าง registration session")
    print("2. 🎲 Random Register - สร้าง registration session ด้วยข้อมูลสุ่ม")
    print("3. 📊 View Last Result - ดูผลลัพธ์ล่าสุด")
    print("4. 🔄 Change Base URL - เปลี่ยน URL")
    print("5. ❌ Exit - ออกจากโปรแกรม")
    print("=" * 50)

def handle_need_register(client: CatCarClient):
    """จัดการ command need-register"""
    print("\n🔧 Need Register Command")
    print("-" * 30)
    
    try:
        chip_id = input("🔧 Chip ID: ").strip()
        if not chip_id:
            print("❌ Chip ID ไม่สามารถว่างได้")
            return
            
        mac_address = input("🌐 MAC Address: ").strip()
        if not mac_address:
            print("❌ MAC Address ไม่สามารถว่างได้")
            return
            
        firmware_version = input("⚙️  Firmware Version: ").strip()
        if not firmware_version:
            print("❌ Firmware Version ไม่สามารถว่างได้")
            return
        
        print("\n🔄 กำลังประมวลผล...")
        result = client.need_register(chip_id, mac_address, firmware_version)
        
        if 'error' not in result:
            print("\n💾 ผลลัพธ์ถูกเก็บไว้แล้ว สามารถใช้ได้ในครั้งต่อไป")
            print(f"📌 PIN ที่ได้: {client.get_pin()}")
            print(f"🆔 Device ID ที่ได้: {client.get_device_id()}")
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

def handle_random_register(client: CatCarClient):
    """จัดการ command random-register"""
    print("\n🎲 Random Register Command")
    print("-" * 30)
    
    try:
        # สร้างข้อมูลสุ่ม
        chip_id, mac_address, firmware_version = generate_random_data()
        
        print(f"🔧 Chip ID: {chip_id}")
        print(f"🌐 MAC Address: {mac_address}")
        print(f"⚙️  Firmware Version: {firmware_version}")
        
        print("\n🔄 กำลังประมวลผล...")
        result = client.need_register(chip_id, mac_address, firmware_version)
        
        if 'error' not in result:
            print("\n💾 ผลลัพธ์ถูกเก็บไว้แล้ว สามารถใช้ได้ในครั้งต่อไป")
            print(f"📌 PIN ที่ได้: {client.get_pin()}")
            print(f"🆔 Device ID ที่ได้: {client.get_device_id()}")
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

def handle_view_result(client: CatCarClient):
    """จัดการ command view last result"""
    print("\n📊 Last Result")
    print("-" * 30)
    
    result = client.get_last_result()
    if result:
        print("✅ มีผลลัพธ์ล่าสุด:")
        print(f"📌 PIN: {client.get_pin()}")
        print(f"🆔 Device ID: {client.get_device_id()}")
        print(f"💬 Message: {result.get('message', 'N/A')}")
    else:
        print("❌ ยังไม่มีผลลัพธ์ กรุณาเรียกใช้ command อื่นก่อน")

def handle_change_url():
    """จัดการ command change base URL"""
    print("\n🔄 Change Base URL")
    print("-" * 30)
    
    new_url = input("🌐 ใส่ Base URL ใหม่: ").strip()
    if new_url:
        return new_url
    else:
        print("❌ URL ไม่สามารถว่างได้")
        return None

def main():
    """Main function สำหรับรัน script"""
    print("🚗 CatCar Wash Service - API Client")
    print("=" * 50)
    
    # ตั้งค่า URL เริ่มต้น
    base_url = input("🌐 ใส่ Base URL (default: http://localhost:3000/api/v1): ").strip()
    if not base_url:
        base_url = "http://localhost:3000/api/v1"
    
    client = CatCarClient(base_url)
    
    while True:
        try:
            show_menu()
            choice = input("👉 เลือก command (1-5): ").strip()
            
            if choice == "1":
                handle_need_register(client)
            elif choice == "2":
                handle_random_register(client)
            elif choice == "3":
                handle_view_result(client)
            elif choice == "4":
                new_url = handle_change_url()
                if new_url:
                    client = CatCarClient(new_url)
                    print(f"✅ เปลี่ยน Base URL เป็น: {new_url}")
            elif choice == "5":
                print("👋 ออกจากโปรแกรม")
                break
            else:
                print("❌ กรุณาเลือกหมายเลข 1-5")
                
        except KeyboardInterrupt:
            print("\n\n👋 ออกจากโปรแกรม")
            break
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาด: {e}")
        
        # ถามว่าจะทำต่อหรือไม่ (ยกเว้นเมื่อเลือก exit)
        if choice != "5":
            try:
                input("\n⏸️  กด Enter เพื่อกลับไปเมนูหลัก...")
            except KeyboardInterrupt:
                print("\n👋 ออกจากโปรแกรม")
                break

if __name__ == "__main__":
    main()
