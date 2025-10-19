#!/usr/bin/env python3
"""
CatCar Wash Service - Device Lifecycle Simulator
Simulator สำหรับจำลอง device lifecycle แบบสมบูรณ์:
1. Register → 2. Sync Configs → 3. Stream State ผ่าน MQTT
"""

import requests
import paho.mqtt.client as mqtt
import json
import hashlib
import time
import random
import string
import threading
import signal
import sys
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum

# Secret key สำหรับ signature verification
SECRET_KEY = "modernchabackdoor"

class DeviceType(Enum):
    WASH = "WASH"
    DRYING = "DRYING"

class DeviceStatus(Enum):
    NORMAL = "NORMAL"
    ERROR = "ERROR"
    OFFLINE = "OFFLINE"

class DeviceLifecycleSimulator:
    def __init__(self, 
                 api_base_url: str = "http://localhost:3000/api/v1",
                 mqtt_broker: str = "localhost",
                 mqtt_port: int = 1883):
        """
        Initialize Device Lifecycle Simulator
        
        Args:
            api_base_url: Base URL ของ API server
            mqtt_broker: MQTT broker host
            mqtt_port: MQTT broker port
        """
        self.api_base_url = api_base_url.rstrip('/')
        self.mqtt_broker = mqtt_broker
        self.mqtt_port = mqtt_port
        
        # Device registry
        self.devices: Dict[str, Dict] = {}
        
        # HTTP Session
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # Streaming control
        self.running = False
        self.threads: List[threading.Thread] = []
        self.total_messages_sent = 0
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print(f"\n🛑 รับสัญญาณ {signum} กำลังปิด simulator...")
        self.stop_all_streaming()
        sys.exit(0)
    
    def _calculate_signature(self, payload: Dict) -> str:
        """
        คำนวณ signature สำหรับ HTTP request
        SHA256(payload_string + SECRET_KEY)
        
        Args:
            payload: Request payload
            
        Returns:
            str: SHA256 signature
        """
        # แปลง payload เป็น JSON string (ไม่มี whitespace)
        payload_string = json.dumps(payload, separators=(',', ':'), ensure_ascii=False)
        
        # คำนวณ SHA256(payload + SECRET_KEY)
        combined = payload_string + SECRET_KEY
        signature = hashlib.sha256(combined.encode('utf-8')).hexdigest()
        
        return signature
    
    def _generate_random_device_info(self, device_type: DeviceType) -> Dict:
        """
        สร้าง random device information
        
        Args:
            device_type: WASH หรือ DRYING
            
        Returns:
            Dict: {chip_id, mac_address, firmware_version}
        """
        # สร้าง Chip ID สุ่ม (8 ตัวอักษร hex)
        chip_id = ''.join(random.choices(string.hexdigits.upper()[:16], k=8))
        
        # สร้าง MAC Address สุ่ม
        mac_parts = [f"{random.randint(0, 255):02X}" for _ in range(6)]
        mac_address = ":".join(mac_parts)
        
        # สร้าง Firmware Version ตาม device type
        hw_major = random.randint(1, 3)
        hw_minor = random.randint(0, 9)
        sw_major = random.randint(1, 5)
        sw_minor = random.randint(0, 9)
        sw_patch = random.randint(0, 99)
        
        if device_type == DeviceType.WASH:
            firmware_prefix = "carwash"
        else:  # DRYING
            firmware_prefix = "helmet"
        
        firmware_version = f"{firmware_prefix}_HW_{hw_major}.{hw_minor}_V{sw_major}.{sw_minor}.{sw_patch}"
        
        return {
            "chip_id": chip_id,
            "mac_address": mac_address,
            "firmware_version": firmware_version
        }
    
    def _generate_random_wash_config(self) -> Dict:
        """
        สร้าง random config สำหรับ WASH device
        
        Returns:
            Dict: Config structure for WASH device
        """
        return {
            "configs": {
                "machine": {
                    "ACTIVE": random.choice([True, False]),
                    "BANKNOTE": random.choice([True, False]),
                    "COIN": random.choice([True, False]),
                    "QR": random.choice([True, False]),
                    "ON_TIME": random.choice(["06:00", "07:00", "08:00"]),
                    "OFF_TIME": random.choice(["20:00", "21:00", "22:00"]),
                    "SAVE_STATE": True
                },
                "pricing": {
                    "PROMOTION": random.randint(0, 20)  # 0-20%
                },
                "function": {
                    "sec_per_baht": {
                        "HP_WATER": random.randint(5, 30),
                        "FOAM": random.randint(5, 20),
                        "AIR": random.randint(5, 25),
                        "WATER": random.randint(5, 30),
                        "VACUUM": random.randint(10, 60),
                        "BLACK_TIRE": random.randint(5, 15),
                        "WAX": random.randint(3, 10),
                        "AIR_FRESHENER": random.randint(5, 20),
                        "PARKING_FEE": random.randint(0, 600)
                    }
                }
            }
        }
    
    def _generate_random_drying_config(self) -> Dict:
        """
        สร้าง random config สำหรับ DRYING device
        
        Returns:
            Dict: Config structure for DRYING device
        """
        return {
            "configs": {
                "machine": {
                    "ACTIVE": random.choice([True, False]),
                    "BANKNOTE": random.choice([True, False]),
                    "COIN": random.choice([True, False]),
                    "QR": random.choice([True, False]),
                    "ON_TIME": random.choice(["06:00", "07:00", "08:00"]),
                    "OFF_TIME": random.choice(["20:00", "21:00", "22:00"]),
                    "SAVE_STATE": True
                },
                "pricing": {
                    "BASE_FEE": random.randint(20, 50),
                    "PROMOTION": random.randint(0, 20),
                    "WORK_PERIOD": random.randint(300, 900)  # 5-15 minutes
                },
                "function_start": {
                    "DUST_BLOW": random.randint(0, 30),
                    "SANITIZE": random.randint(10, 60),
                    "UV": random.randint(10, 100),
                    "OZONE": random.randint(20, 200),
                    "DRY_BLOW": random.randint(30, 300),
                    "PERFUME": random.randint(3, 50)
                },
                "function_end": {
                    "DUST_BLOW": random.randint(30, 100),
                    "SANITIZE": random.randint(60, 150),
                    "UV": random.randint(100, 250),
                    "OZONE": random.randint(200, 400),
                    "DRY_BLOW": random.randint(300, 500),
                    "PERFUME": random.randint(50, 100)
                }
            }
        }
    
    def register_device(self, device_type: DeviceType, silent: bool = False) -> Optional[str]:
        """
        Step 1: Register device
        POST /api/v1/devices/need-register
        
        Args:
            device_type: WASH หรือ DRYING
            silent: ไม่แสดง message (สำหรับ bulk operations)
            
        Returns:
            str: device_id หรือ None ถ้าไม่สำเร็จ
        """
        try:
            # สร้าง random device info
            device_info = self._generate_random_device_info(device_type)
            
            url = f"{self.api_base_url}/devices/need-register"
            
            if not silent:
                print(f"\n📡 กำลัง Register Device ({device_type.value})...")
                print(f"   Chip ID: {device_info['chip_id']}")
                print(f"   MAC: {device_info['mac_address']}")
                print(f"   Firmware: {device_info['firmware_version']}")
            
            response = self.session.post(url, json=device_info)
            
            if 200 <= response.status_code <= 299:
                result = response.json()
                device_id = result['data']['device_id']
                pin = result['data']['pin']
                
                if not silent:
                    print(f"✅ Register สำเร็จ!")
                    print(f"   Device ID: {device_id}")
                    print(f"   PIN: {pin}")
                
                # เก็บข้อมูล device
                self.devices[device_id] = {
                    "type": device_type,
                    "info": device_info,
                    "pin": pin,
                    "status": DeviceStatus.NORMAL,
                    "uptime": 0,
                    "message_count": 0,
                    "start_time": time.time(),
                    "last_rssi": random.randint(-90, -40),
                    "client": None,
                    "registered": True,
                    "synced": False
                }
                
                return device_id
            else:
                if not silent:
                    print(f"❌ Register ไม่สำเร็จ: {response.status_code}")
                    print(f"   Response: {response.text}")
                return None
                
        except Exception as e:
            if not silent:
                print(f"❌ เกิดข้อผิดพลาดในการ register: {e}")
            return None
    
    def sync_device_configs(self, device_id: str, silent: bool = False) -> bool:
        """
        Step 2: Sync device configs
        POST /api/v1/devices/sync-configs/{device_id}
        
        Args:
            device_id: Device ID
            silent: ไม่แสดง message
            
        Returns:
            bool: True ถ้าสำเร็จ
        """
        if device_id not in self.devices:
            if not silent:
                print(f"❌ ไม่พบ Device ID: {device_id}")
            return False
        
        try:
            device = self.devices[device_id]
            device_type = device['type']
            
            # สร้าง random config ตาม device type
            if device_type == DeviceType.WASH:
                config_payload = self._generate_random_wash_config()
            else:  # DRYING
                config_payload = self._generate_random_drying_config()
            
            # คำนวณ signature
            signature = self._calculate_signature(config_payload)
            
            url = f"{self.api_base_url}/devices/sync-configs/{device_id}"
            headers = {
                'x-signature': signature
            }
            
            if not silent:
                print(f"\n🔄 กำลัง Sync Configs สำหรับ {device_id}...")
                print(f"   Device Type: {device_type.value}")
            
            response = self.session.post(url, json=config_payload, headers=headers)
            
            if 200 <= response.status_code <= 299:
                if not silent:
                    print(f"✅ Sync Configs สำเร็จ!")
                
                # อัพเดทสถานะ
                device['synced'] = True
                device['config'] = config_payload
                
                return True
            else:
                if not silent:
                    print(f"❌ Sync Configs ไม่สำเร็จ: {response.status_code}")
                    print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            if not silent:
                print(f"❌ เกิดข้อผิดพลาดในการ sync configs: {e}")
            return False
    
    def _create_device_client(self, device_id: str) -> mqtt.Client:
        """Create MQTT client for a specific device"""
        client = mqtt.Client()
        client.on_connect = lambda c, u, f, rc: self._on_connect(c, device_id, rc)
        client.on_disconnect = lambda c, u, rc: self._on_disconnect(c, device_id, rc)
        client.on_publish = lambda c, u, mid: self._on_publish(c, device_id, mid)
        return client
    
    def _on_connect(self, client, device_id, rc):
        """MQTT connection callback"""
        if rc == 0:
            print(f"✅ Device {device_id} เชื่อมต่อ MQTT broker สำเร็จ")
        else:
            print(f"❌ Device {device_id} เชื่อมต่อ MQTT broker ไม่สำเร็จ: {rc}")
    
    def _on_disconnect(self, client, device_id, rc):
        """MQTT disconnection callback"""
        if rc != 0:
            print(f"⚠️  Device {device_id} MQTT broker disconnected: {rc}")
    
    def _on_publish(self, client, device_id, mid):
        """MQTT publish callback"""
        self.total_messages_sent += 1
    
    def _connect_mqtt(self, device_id: str) -> bool:
        """Connect device to MQTT broker"""
        if device_id not in self.devices:
            return False
        
        try:
            device = self.devices[device_id]
            
            # Check if already connected
            if ('client' in device and 
                device['client'] is not None and 
                device['client'].is_connected()):
                return True
            
            # Create new MQTT client
            client = self._create_device_client(device_id)
            client.connect(self.mqtt_broker, self.mqtt_port, 60)
            client.loop_start()
            
            # Wait for connection
            time.sleep(1)
            
            if client.is_connected():
                device['client'] = client
                return True
            else:
                client.loop_stop()
                client.disconnect()
                return False
                
        except Exception as e:
            print(f"❌ Device {device_id} ไม่สามารถเชื่อมต่อ MQTT broker ได้: {e}")
            return False
    
    def _disconnect_mqtt(self, device_id: str):
        """Disconnect device from MQTT broker"""
        if device_id in self.devices and 'client' in self.devices[device_id]:
            client = self.devices[device_id]['client']
            if client is not None and client.is_connected():
                client.loop_stop()
                client.disconnect()
            self.devices[device_id]['client'] = None
    
    def _generate_device_state_payload(self, device_id: str) -> Dict:
        """
        สร้าง device state payload สำหรับ MQTT streaming
        
        Args:
            device_id: Device ID
            
        Returns:
            Dict: State payload
        """
        device = self.devices[device_id]
        
        # Update uptime (in minutes)
        device["uptime"] = int((time.time() - device["start_time"]) / 60)
        
        # Generate RSSI (slight variation from last value)
        last_rssi = device["last_rssi"]
        rssi_variation = random.randint(-5, 5)
        new_rssi = max(-90, min(-40, last_rssi + rssi_variation))
        device["last_rssi"] = new_rssi
        
        payload = {
            "rssi": new_rssi,
            "status": device["status"].value,
            "uptime": device["uptime"],
            "timestamp": int(time.time() * 1000)  # milliseconds
        }
        
        return payload
    
    def _device_streaming_thread(self, device_id: str, interval: int = 60):
        """
        Device streaming thread - sends state every interval seconds
        
        Args:
            device_id: Device ID
            interval: Streaming interval in seconds
        """
        print(f"🚀 เริ่ม streaming สำหรับ Device: {device_id}")
        
        # Connect MQTT first
        if not self._connect_mqtt(device_id):
            print(f"❌ ไม่สามารถเชื่อมต่อ Device {device_id}")
            return
        
        while self.running and device_id in self.devices:
            try:
                device = self.devices[device_id]
                
                # Check if device client is connected
                if ('client' not in device or 
                    device['client'] is None or 
                    not device['client'].is_connected()):
                    print(f"⚠️  Device {device_id} ไม่ได้เชื่อมต่อ กำลัง reconnect...")
                    if not self._connect_mqtt(device_id):
                        time.sleep(5)
                        continue
                
                # Generate and send payload
                payload = self._generate_device_state_payload(device_id)
                topic = f"server/{device_id}/streaming"
                
                # Publish to MQTT
                if device['client'] is None:
                    print(f"❌ Device {device_id} client is None")
                    continue
                    
                result = device['client'].publish(topic, json.dumps(payload), qos=1)
                
                if result.rc == mqtt.MQTT_ERR_SUCCESS:
                    device["message_count"] += 1
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    print(f"[{timestamp}] 📡 {device_id}: RSSI={payload['rssi']}dBm, "
                          f"Status={payload['status']}, Uptime={payload['uptime']}min")
                else:
                    print(f"❌ ส่งข้อมูล {device_id} ไม่สำเร็จ: {result.rc}")
                
                # Wait for next interval
                time.sleep(interval)
                
            except Exception as e:
                print(f"❌ เกิดข้อผิดพลาดใน thread {device_id}: {e}")
                time.sleep(5)  # Wait before retry
        
        print(f"🛑 หยุด streaming สำหรับ Device: {device_id}")
    
    def run_full_lifecycle(self, device_type: DeviceType, interval: int = 60, silent: bool = False) -> Optional[str]:
        """
        รัน lifecycle แบบสมบูรณ์: Register → Sync Configs → Stream
        
        Args:
            device_type: WASH หรือ DRYING
            interval: Streaming interval (seconds)
            silent: ไม่แสดง message
            
        Returns:
            str: device_id หรือ None ถ้าไม่สำเร็จ
        """
        # Step 1: Register
        device_id = self.register_device(device_type, silent=silent)
        if not device_id:
            return None
        
        # Step 2: Sync Configs
        if not self.sync_device_configs(device_id, silent=silent):
            return None
        
        # Step 3 จะทำตอน start_all_streaming()
        if not silent:
            print(f"✅ Device {device_id} พร้อมสำหรับ streaming!")
        
        return device_id
    
    def start_all_streaming(self, interval: int = 60):
        """
        เริ่ม streaming สำหรับ devices ทั้งหมด
        
        Args:
            interval: Streaming interval (seconds)
        """
        if self.running:
            print("⚠️  Streaming กำลังทำงานอยู่แล้ว")
            return
        
        if not self.devices:
            print("❌ ไม่มี device ที่จะ stream")
            return
        
        # Filter only synced devices
        synced_devices = [d_id for d_id, d in self.devices.items() if d.get('synced', False)]
        
        if not synced_devices:
            print("❌ ไม่มี device ที่ sync configs แล้ว")
            return
        
        self.running = True
        self.threads = []
        
        print(f"\n🚀 เริ่ม Streaming ({len(synced_devices)} devices, interval: {interval}s)")
        print("=" * 60)
        
        # Start thread for each device
        for device_id in synced_devices:
            thread = threading.Thread(
                target=self._device_streaming_thread,
                args=(device_id, interval),
                daemon=True
            )
            thread.start()
            self.threads.append(thread)
        
        print("✅ เริ่ม Streaming แล้ว! กด Ctrl+C เพื่อหยุด")
    
    def stop_all_streaming(self):
        """หยุด streaming ทั้งหมด"""
        if not self.running:
            print("⚠️  Streaming ไม่ได้ทำงานอยู่")
            return
        
        print("\n🛑 กำลังหยุด Streaming...")
        self.running = False
        
        # Wait for threads to finish
        for thread in self.threads:
            thread.join(timeout=5)
        
        self.threads = []
        
        # Disconnect all MQTT clients
        for device_id in self.devices:
            self._disconnect_mqtt(device_id)
        
        print("✅ หยุด Streaming แล้ว")
    
    def get_statistics(self) -> Dict:
        """Get simulation statistics"""
        total_device_messages = sum(device.get("message_count", 0) for device in self.devices.values())
        
        stats = {
            "total_devices": len(self.devices),
            "registered_devices": sum(1 for d in self.devices.values() if d.get('registered', False)),
            "synced_devices": sum(1 for d in self.devices.values() if d.get('synced', False)),
            "running": self.running,
            "total_messages_sent": self.total_messages_sent,
            "device_details": {
                device_id: {
                    "type": device['type'].value,
                    "registered": device.get('registered', False),
                    "synced": device.get('synced', False),
                    "messages": device.get('message_count', 0),
                    "uptime": device.get('uptime', 0),
                    "status": device.get('status', DeviceStatus.NORMAL).value
                }
                for device_id, device in self.devices.items()
            }
        }
        
        return stats
    
    def show_statistics(self):
        """Display simulation statistics"""
        stats = self.get_statistics()
        
        print("\n📊 Simulation Statistics")
        print("=" * 60)
        print(f"🔢 จำนวน Devices: {stats['total_devices']}")
        print(f"✅ Registered: {stats['registered_devices']}")
        print(f"🔄 Synced: {stats['synced_devices']}")
        print(f"📡 สถานะ: {'กำลัง Stream' if stats['running'] else 'หยุดแล้ว'}")
        print(f"📨 จำนวน Messages ทั้งหมด: {stats['total_messages_sent']}")
        print("\n📋 รายละเอียด Device:")
        
        for device_id, details in stats['device_details'].items():
            connected = "🟢" if (device_id in self.devices and 
                                'client' in self.devices[device_id] and 
                                self.devices[device_id]['client'] is not None and 
                                self.devices[device_id]['client'].is_connected()) else "🔴"
            print(f"\n  🆔 {device_id}")
            print(f"     Type: {details['type']}")
            print(f"     Registered: {'✅' if details['registered'] else '❌'}")
            print(f"     Synced: {'✅' if details['synced'] else '❌'}")
            print(f"     Messages: {details['messages']}")
            print(f"     Uptime: {details['uptime']} min")
            print(f"     Status: {details['status']} {connected}")

def show_menu():
    """Display main menu"""
    print("\n" + "=" * 60)
    print("🚗 CatCar Wash Service - Device Lifecycle Simulator")
    print("=" * 60)
    print("📋 เลือกคำสั่ง:")
    print("1. ➕ เพิ่ม Device (WASH)")
    print("2. ➕ เพิ่ม Device (DRYING)")
    print("3. 🎲 เพิ่ม 10 Random Devices (Mixed)")
    print("4. 🚀 เริ่ม Streaming ทั้งหมด")
    print("5. 🛑 หยุด Streaming")
    print("6. 📊 ดูสถิติ")
    print("7. 📋 ดูรายการ Devices")
    print("8. ❌ ออกจากโปรแกรม")
    print("=" * 60)

def handle_add_wash_device(simulator: DeviceLifecycleSimulator):
    """Handle add WASH device"""
    print("\n➕ เพิ่ม WASH Device")
    print("-" * 40)
    simulator.run_full_lifecycle(DeviceType.WASH)

def handle_add_drying_device(simulator: DeviceLifecycleSimulator):
    """Handle add DRYING device"""
    print("\n➕ เพิ่ม DRYING Device")
    print("-" * 40)
    simulator.run_full_lifecycle(DeviceType.DRYING)

def handle_add_random_devices(simulator: DeviceLifecycleSimulator):
    """Handle add 10 random devices"""
    print("\n🎲 เพิ่ม 10 Random Devices (Mixed)")
    print("-" * 40)
    
    success_count = 0
    failed_count = 0
    
    for i in range(10):
        device_type = random.choice([DeviceType.WASH, DeviceType.DRYING])
        print(f"\n📍 Device {i+1}/10 ({device_type.value})...")
        
        device_id = simulator.run_full_lifecycle(device_type, silent=True)
        if device_id:
            success_count += 1
            print(f"✅ Device {device_id} สร้างสำเร็จ")
        else:
            failed_count += 1
            print(f"❌ สร้าง device ไม่สำเร็จ")
    
    print(f"\n📊 สรุป:")
    print(f"   ✅ สำเร็จ: {success_count} devices")
    print(f"   ❌ ล้มเหลว: {failed_count} devices")

def handle_start_streaming(simulator: DeviceLifecycleSimulator):
    """Handle start streaming"""
    print("\n🚀 เริ่ม Streaming")
    print("-" * 40)
    
    try:
        interval = int(input("⏱️  Interval (วินาที, default: 60): ").strip() or "60")
        if interval < 1:
            interval = 60
    except ValueError:
        interval = 60
    
    simulator.start_all_streaming(interval)

def handle_stop_streaming(simulator: DeviceLifecycleSimulator):
    """Handle stop streaming"""
    print("\n🛑 หยุด Streaming")
    print("-" * 40)
    simulator.stop_all_streaming()

def handle_show_statistics(simulator: DeviceLifecycleSimulator):
    """Handle show statistics"""
    simulator.show_statistics()

def handle_list_devices(simulator: DeviceLifecycleSimulator):
    """Handle list devices"""
    print("\n📋 รายการ Devices")
    print("-" * 60)
    
    if not simulator.devices:
        print("❌ ไม่มี device")
        return
    
    for device_id, device in simulator.devices.items():
        device_type = device['type'].value
        registered = "✅" if device.get('registered', False) else "❌"
        synced = "✅" if device.get('synced', False) else "❌"
        messages = device.get('message_count', 0)
        uptime = device.get('uptime', 0)
        status = device.get('status', DeviceStatus.NORMAL).value
        connected = "🟢" if ('client' in device and device['client'] is not None and device['client'].is_connected()) else "🔴"
        
        print(f"\n🆔 {device_id}")
        print(f"   Type: {device_type}")
        print(f"   Registered: {registered}")
        print(f"   Synced: {synced}")
        print(f"   Messages: {messages}")
        print(f"   Uptime: {uptime} min")
        print(f"   Status: {status} {connected}")

def main():
    """Main function"""
    print("🚗 CatCar Wash Service - Device Lifecycle Simulator")
    print("=" * 60)
    
    # Configuration
    api_url = input("🌐 API Base URL (default: http://localhost:3000/api/v1): ").strip()
    if not api_url:
        api_url = "http://localhost:3000/api/v1"
    
    mqtt_host = input("🔗 MQTT Broker Host (default: localhost): ").strip()
    if not mqtt_host:
        mqtt_host = "localhost"
    
    mqtt_port_str = input("🔗 MQTT Broker Port (default: 1883): ").strip()
    mqtt_port = int(mqtt_port_str) if mqtt_port_str else 1883
    
    # Initialize simulator
    simulator = DeviceLifecycleSimulator(api_url, mqtt_host, mqtt_port)
    
    print(f"\n✅ Simulator initialized")
    print(f"   API: {api_url}")
    print(f"   MQTT: {mqtt_host}:{mqtt_port}")
    
    try:
        while True:
            show_menu()
            choice = input("👉 เลือกคำสั่ง (1-8): ").strip()
            
            if choice == "1":
                handle_add_wash_device(simulator)
            elif choice == "2":
                handle_add_drying_device(simulator)
            elif choice == "3":
                handle_add_random_devices(simulator)
            elif choice == "4":
                handle_start_streaming(simulator)
            elif choice == "5":
                handle_stop_streaming(simulator)
            elif choice == "6":
                handle_show_statistics(simulator)
            elif choice == "7":
                handle_list_devices(simulator)
            elif choice == "8":
                print("👋 ออกจากโปรแกรม")
                break
            else:
                print("❌ กรุณาเลือกหมายเลข 1-8")
            
            # Pause before showing menu again
            if choice not in ["4", "5"] and not simulator.running:
                input("\n⏸️  กด Enter เพื่อกลับไปเมนูหลัก...")
    
    except KeyboardInterrupt:
        print("\n\n👋 ออกจากโปรแกรม")
    finally:
        simulator.stop_all_streaming()

if __name__ == "__main__":
    main()

