#!/usr/bin/env python3
"""
CatCar Wash Service - MQTT Device State Simulator
Simulator สำหรับจำลองการส่ง device state streaming ผ่าน MQTT
ตาม specification ใน PLAN-COMUNICATION.md
"""

import paho.mqtt.client as mqtt
import json
import time
import random
import threading
import signal
import sys
import yaml
import os
from datetime import datetime
from typing import Dict, List, Optional
from enum import Enum

class DeviceStatus(Enum):
    NORMAL = "NORMAL"
    ERROR = "ERROR"
    OFFLINE = "OFFLINE"

class MQTTDeviceSimulator:
    def __init__(self, broker_host: str = "localhost", broker_port: int = 1883,
                 mqtt_username: Optional[str] = None, mqtt_password: Optional[str] = None):
        """
        Initialize MQTT Device Simulator
        
        Args:
            broker_host: MQTT broker host
            broker_port: MQTT broker port
            mqtt_username: MQTT username (optional)
            mqtt_password: MQTT password (optional)
        """
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.mqtt_username = mqtt_username or os.getenv("MQTT_USERNAME") or "mqtt"
        self.mqtt_password = mqtt_password or os.getenv("MQTT_PASSWORD") or "password"
        self.devices: Dict[str, Dict] = {}
        self.running = False
        self.threads: List[threading.Thread] = []
        self.total_messages_sent = 0
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _create_device_client(self, device_id: str) -> mqtt.Client:
        """Create MQTT client for a specific device"""
        client = mqtt.Client()
        # Set username/password for EMQX broker (EMQX_ALLOW_ANONYMOUS=false)
        if self.mqtt_username:
            client.username_pw_set(self.mqtt_username, self.mqtt_password)
        client.on_connect = lambda c, u, f, rc: self._on_connect(c, device_id, rc)
        client.on_disconnect = lambda c, u, rc: self._on_disconnect(c, device_id, rc)
        client.on_publish = lambda c, u, mid: self._on_publish(c, device_id, mid)
        client.on_log = self._on_log
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
    
    def _on_log(self, client, userdata, level, buf):
        """MQTT log callback (optional)"""
        # Uncomment for debug logging
        # print(f"MQTT Log: {buf}")
        pass
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print(f"\n🛑 รับสัญญาณ {signum} กำลังปิด simulator...")
        self.stop()
        sys.exit(0)
    
    def connect_device(self, device_id: str) -> bool:
        """
        Connect a specific device to MQTT broker
        
        Args:
            device_id: Device identifier
            
        Returns:
            bool: True if connected successfully
        """
        if device_id not in self.devices:
            return False
        
        try:
            device = self.devices[device_id]
            
            # Check if client exists and is connected
            if ('client' in device and 
                device['client'] is not None and 
                device['client'].is_connected()):
                return True
            
            # Create new client for this device
            client = self._create_device_client(device_id)
            client.connect(self.broker_host, self.broker_port, 60)
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
    
    def disconnect_device(self, device_id: str):
        """Disconnect a specific device from MQTT broker"""
        if device_id in self.devices and 'client' in self.devices[device_id]:
            client = self.devices[device_id]['client']
            if client is not None and client.is_connected():
                client.loop_stop()
                client.disconnect()
            self.devices[device_id]['client'] = None
    
    def disconnect_all(self):
        """Disconnect all devices from MQTT broker"""
        for device_id in list(self.devices.keys()):
            self.disconnect_device(device_id)
        print("🔌 ตัดการเชื่อมต่อ MQTT broker ทั้งหมดแล้ว")
    
    def add_device(self, device_id: str, status: DeviceStatus = DeviceStatus.NORMAL, silent: bool = False) -> bool:
        """
        Add a device to simulate
        
        Args:
            device_id: Device identifier
            status: Initial device status
            silent: If True, don't print success message (useful for bulk operations)
            
        Returns:
            bool: True if device added successfully
        """
        if device_id in self.devices:
            if not silent:
                print(f"⚠️  Device {device_id} มีอยู่แล้ว")
            return False
        
        self.devices[device_id] = {
            "status": status,
            "uptime": 0,  # minutes
            "message_count": 0,
            "start_time": time.time(),
            "last_rssi": random.randint(-90, -40),
            "client": None  # MQTT client for this device
        }
        
        if not silent:
            print(f"✅ เพิ่ม Device: {device_id} (Status: {status.value})")
        return True
    
    def remove_device(self, device_id: str) -> bool:
        """
        Remove a device from simulation
        
        Args:
            device_id: Device identifier
            
        Returns:
            bool: True if device removed successfully
        """
        if device_id not in self.devices:
            print(f"⚠️  Device {device_id} ไม่พบ")
            return False
        
        # Disconnect device before removing
        self.disconnect_device(device_id)
        del self.devices[device_id]
        print(f"✅ ลบ Device: {device_id}")
        return True
    
    def update_device_status(self, device_id: str, status: DeviceStatus) -> bool:
        """
        Update device status
        
        Args:
            device_id: Device identifier
            status: New device status
            
        Returns:
            bool: True if updated successfully
        """
        if device_id not in self.devices:
            print(f"⚠️  Device {device_id} ไม่พบ")
            return False
        
        self.devices[device_id]["status"] = status
        print(f"✅ อัพเดท Device {device_id} Status: {status.value}")
        return True
    
    def _generate_device_payload(self, device_id: str) -> Dict:
        """
        Generate device state payload
        
        Args:
            device_id: Device identifier
            
        Returns:
            Dict: Device state payload
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
            device_id: Device identifier
            interval: Streaming interval in seconds
        """
        print(f"🚀 เริ่ม streaming สำหรับ Device: {device_id}")
        
        # Connect this device first
        if not self.connect_device(device_id):
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
                    if not self.connect_device(device_id):
                        time.sleep(5)
                        continue
                
                # Generate and send payload
                payload = self._generate_device_payload(device_id)
                topic = f"server/{device_id}/streaming"
                
                # Publish to MQTT using device's own client
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
    
    def start(self, interval: int = 60):
        """
        Start device simulation
        
        Args:
            interval: Streaming interval in seconds (default: 60)
        """
        if self.running:
            print("⚠️  Simulator กำลังทำงานอยู่แล้ว")
            return
        
        if not self.devices:
            print("❌ ไม่มี device ที่จะจำลอง กรุณาเพิ่ม device ก่อน")
            return
        
        # Check if any devices are connected
        connected_devices = 0
        for device_id in self.devices:
            if self.connect_device(device_id):
                connected_devices += 1
        
        if connected_devices == 0:
            print("❌ ไม่มี device ที่เชื่อมต่อ MQTT broker ได้")
            return
        
        self.running = True
        self.threads = []
        
        print(f"🚀 เริ่ม Device Simulation ({len(self.devices)} devices, interval: {interval}s)")
        print("=" * 60)
        
        # Start thread for each device
        for device_id in self.devices:
            thread = threading.Thread(
                target=self._device_streaming_thread,
                args=(device_id, interval),
                daemon=True
            )
            thread.start()
            self.threads.append(thread)
        
        print("✅ เริ่ม Simulation แล้ว! กด Ctrl+C เพื่อหยุด")
    
    def stop(self):
        """Stop device simulation"""
        if not self.running:
            print("⚠️  Simulator ไม่ได้ทำงานอยู่")
            return
        
        print("\n🛑 กำลังหยุด Simulation...")
        self.running = False
        
        # Wait for threads to finish
        for thread in self.threads:
            thread.join(timeout=5)
        
        self.threads = []
        
        # Disconnect all devices
        self.disconnect_all()
        print("✅ หยุด Simulation แล้ว")
    
    def get_statistics(self) -> Dict:
        """
        Get simulation statistics
        
        Returns:
            Dict: Statistics information
        """
        total_device_messages = sum(device["message_count"] for device in self.devices.values())
        
        stats = {
            "total_devices": len(self.devices),
            "running": self.running,
            "total_messages_sent": self.total_messages_sent,
            "device_messages": {device_id: device["message_count"] 
                               for device_id, device in self.devices.items()},
            "uptime": {device_id: device["uptime"] 
                      for device_id, device in self.devices.items()}
        }
        
        return stats
    
    def show_statistics(self):
        """Display simulation statistics"""
        stats = self.get_statistics()
        
        print("\n📊 Simulation Statistics")
        print("=" * 40)
        print(f"🔢 จำนวน Devices: {stats['total_devices']}")
        print(f"🔄 สถานะ: {'กำลังทำงาน' if stats['running'] else 'หยุดแล้ว'}")
        print(f"📡 จำนวน Messages ทั้งหมด: {stats['total_messages_sent']}")
        print("\n📋 รายละเอียด Device:")
        
        for device_id in stats['device_messages']:
            messages = stats['device_messages'][device_id]
            uptime = stats['uptime'][device_id]
            status = self.devices[device_id]['status'].value
            connected = "🟢" if ('client' in self.devices[device_id] and 
                                self.devices[device_id]['client'] is not None and 
                                self.devices[device_id]['client'].is_connected()) else "🔴"
            print(f"  • {device_id}: {messages} messages, {uptime}min uptime, Status: {status} {connected}")

def load_docker_compose_config() -> tuple:
    """
    Load MQTT configuration from docker-compose.develop.yml
    
    Returns:
        tuple: (broker_host, broker_port)
    """
    try:
        # Try to read docker-compose file
        compose_path = "../docker-compose.develop.yml"
        if not os.path.exists(compose_path):
            compose_path = "./docker-compose.develop.yml"
        
        if os.path.exists(compose_path):
            with open(compose_path, 'r', encoding='utf-8') as f:
                compose_data = yaml.safe_load(f)
            
            # Extract EMQX configuration
            if 'services' in compose_data and 'emqx' in compose_data['services']:
                emqx_config = compose_data['services']['emqx']
                ports = emqx_config.get('ports', [])
                
                # Find port 1883 mapping
                for port_mapping in ports:
                    if '1883:1883' in port_mapping:
                        return "localhost", 1883
                
                print("⚠️  ไม่พบ port 1883 ใน docker-compose")
        
        print("⚠️  ไม่พบ docker-compose.develop.yml ใช้ค่า default")
        return "localhost", 1883
        
    except Exception as e:
        print(f"⚠️  ไม่สามารถอ่าน docker-compose ได้: {e} ใช้ค่า default")
        return "localhost", 1883

def generate_device_id() -> str:
    """Generate a random device ID"""
    return f"device-{random.randint(1000, 9999)}"

def generate_multiple_device_ids(count: int) -> List[str]:
    """Generate multiple unique device IDs"""
    device_ids = set()
    while len(device_ids) < count:
        device_id = generate_device_id()
        device_ids.add(device_id)
    return list(device_ids)

def show_menu():
    """Display main menu"""
    print("\n" + "=" * 60)
    print("🚗 CatCar Wash Service - MQTT Device State Simulator")
    print("=" * 60)
    print("📋 เลือกคำสั่ง:")
    print("1. ➕ เพิ่ม Device")
    print("2. ➖ ลบ Device")
    print("3. 🔄 เปลี่ยน Device Status")
    print("4. 🎲 เพิ่ม 100 Devices (Random Status)")
    print("5. 🚀 เริ่ม Simulation")
    print("6. 🛑 หยุด Simulation")
    print("7. 📊 ดูสถิติ")
    print("8. 📋 ดูรายการ Devices")
    print("9. ❌ ออกจากโปรแกรม")
    print("=" * 60)

def handle_add_device(simulator: MQTTDeviceSimulator):
    """Handle add device command"""
    print("\n➕ เพิ่ม Device")
    print("-" * 30)
    
    device_id = input("🆔 Device ID (Enter สำหรับ auto-generate): ").strip()
    if not device_id:
        device_id = generate_device_id()
        print(f"🎲 สร้าง Device ID อัตโนมัติ: {device_id}")
    
    print("\n📊 เลือก Status:")
    print("1. NORMAL")
    print("2. ERROR") 
    print("3. OFFLINE")
    
    status_choice = input("👉 เลือก (1-3, default: 1): ").strip()
    status_map = {
        "1": DeviceStatus.NORMAL,
        "2": DeviceStatus.ERROR,
        "3": DeviceStatus.OFFLINE
    }
    status = status_map.get(status_choice, DeviceStatus.NORMAL)
    
    simulator.add_device(device_id, status)

def handle_remove_device(simulator: MQTTDeviceSimulator):
    """Handle remove device command"""
    print("\n➖ ลบ Device")
    print("-" * 30)
    
    if not simulator.devices:
        print("❌ ไม่มี device ที่จะลบ")
        return
    
    print("📋 Devices ที่มีอยู่:")
    for i, device_id in enumerate(simulator.devices.keys(), 1):
        print(f"{i}. {device_id}")
    
    device_id = input("🆔 Device ID ที่จะลบ: ").strip()
    simulator.remove_device(device_id)

def handle_change_status(simulator: MQTTDeviceSimulator):
    """Handle change device status command"""
    print("\n🔄 เปลี่ยน Device Status")
    print("-" * 30)
    
    if not simulator.devices:
        print("❌ ไม่มี device")
        return
    
    print("📋 Devices ที่มีอยู่:")
    for i, device_id in enumerate(simulator.devices.keys(), 1):
        current_status = simulator.devices[device_id]['status'].value
        print(f"{i}. {device_id} (Status: {current_status})")
    
    device_id = input("🆔 Device ID: ").strip()
    if device_id not in simulator.devices:
        print("❌ ไม่พบ Device ID")
        return
    
    print("\n📊 เลือก Status ใหม่:")
    print("1. NORMAL")
    print("2. ERROR")
    print("3. OFFLINE")
    
    status_choice = input("👉 เลือก (1-3): ").strip()
    status_map = {
        "1": DeviceStatus.NORMAL,
        "2": DeviceStatus.ERROR,
        "3": DeviceStatus.OFFLINE
    }
    
    if status_choice in status_map:
        simulator.update_device_status(device_id, status_map[status_choice])
    else:
        print("❌ เลือกไม่ถูกต้อง")

def handle_add_random_devices(simulator: MQTTDeviceSimulator):
    """Handle add 100 random devices command"""
    print("\n🎲 เพิ่ม 100 Devices (Random Status)")
    print("-" * 40)
    
    try:
        # สร้าง 100 device IDs ที่ไม่ซ้ำกัน
        device_ids = generate_multiple_device_ids(100)
        
        print(f"🔄 กำลังสร้าง {len(device_ids)} devices...")
        
        success_count = 0
        failed_count = 0
        
        for i, device_id in enumerate(device_ids, 1):
            # สุ่ม status
            random_status = random.choice(list(DeviceStatus))
            
            # เพิ่ม device (silent mode เพื่อไม่ให้แสดง message มากเกินไป)
            if simulator.add_device(device_id, random_status, silent=True):
                success_count += 1
            else:
                failed_count += 1
            
            # แสดง progress ทุก 10 devices
            if i % 10 == 0:
                print(f"📊 Progress: {i}/100 devices processed...")
        
        print(f"\n✅ เสร็จสิ้น!")
        print(f"📈 สำเร็จ: {success_count} devices")
        print(f"❌ ล้มเหลว: {failed_count} devices")
        print(f"📊 รวม: {len(simulator.devices)} devices ในระบบ")
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

def handle_start_simulation(simulator: MQTTDeviceSimulator):
    """Handle start simulation command"""
    print("\n🚀 เริ่ม Simulation")
    print("-" * 30)
    
    if not simulator.devices:
        print("❌ ไม่มี device ที่จะจำลอง")
        return
    
    try:
        interval = int(input("⏱️  Interval (วินาที, default: 60): ").strip() or "60")
        if interval < 1:
            interval = 60
    except ValueError:
        interval = 60
    
    simulator.start(interval)

def handle_stop_simulation(simulator: MQTTDeviceSimulator):
    """Handle stop simulation command"""
    print("\n🛑 หยุด Simulation")
    print("-" * 30)
    simulator.stop()

def handle_show_statistics(simulator: MQTTDeviceSimulator):
    """Handle show statistics command"""
    simulator.show_statistics()

def handle_list_devices(simulator: MQTTDeviceSimulator):
    """Handle list devices command"""
    print("\n📋 รายการ Devices")
    print("-" * 30)
    
    if not simulator.devices:
        print("❌ ไม่มี device")
        return
    
    for device_id, device in simulator.devices.items():
        status = device['status'].value
        uptime = device['uptime']
        messages = device['message_count']
        connected = "🟢 Connected" if ('client' in device and device['client'] is not None and device['client'].is_connected()) else "🔴 Disconnected"
        print(f"🆔 {device_id}")
        print(f"   Status: {status}")
        print(f"   Uptime: {uptime} minutes")
        print(f"   Messages: {messages}")
        print(f"   Connection: {connected}")
        print()

def main():
    """Main function"""
    print("🚗 CatCar Wash Service - MQTT Device State Simulator")
    print("=" * 60)
    
    # Load MQTT configuration
    broker_host, broker_port = load_docker_compose_config()
    print(f"🔗 MQTT Broker: {broker_host}:{broker_port}")
    
    # Get MQTT username and password
    print("\n🔐 MQTT Authentication:")
    mqtt_username = input("👉 Enter MQTT Username (default: mqtt): ").strip() or "mqtt"
    mqtt_password = input("👉 Enter MQTT Password (default: password): ").strip() or "password"
    
    # Initialize simulator
    simulator = MQTTDeviceSimulator(broker_host, broker_port, mqtt_username, mqtt_password)
    
    # Test MQTT broker connection (no need to connect all devices yet)
    print("🔗 MQTT Broker configuration loaded")
    print("💡 Devices จะเชื่อมต่อ MQTT broker อัตโนมัติเมื่อเริ่ม simulation")
    
    try:
        while True:
            show_menu()
            choice = input("👉 เลือกคำสั่ง (1-9): ").strip()
            
            if choice == "1":
                handle_add_device(simulator)
            elif choice == "2":
                handle_remove_device(simulator)
            elif choice == "3":
                handle_change_status(simulator)
            elif choice == "4":
                handle_add_random_devices(simulator)
            elif choice == "5":
                handle_start_simulation(simulator)
            elif choice == "6":
                handle_stop_simulation(simulator)
            elif choice == "7":
                handle_show_statistics(simulator)
            elif choice == "8":
                handle_list_devices(simulator)
            elif choice == "9":
                print("👋 ออกจากโปรแกรม")
                break
            else:
                print("❌ กรุณาเลือกหมายเลข 1-9")
            
            # Pause before showing menu again (except for simulation running)
            if choice not in ["5", "6"] and not simulator.running:
                input("\n⏸️  กด Enter เพื่อกลับไปเมนูหลัก...")
    
    except KeyboardInterrupt:
        print("\n\n👋 ออกจากโปรแกรม")
    finally:
        simulator.stop()
        simulator.disconnect_all()

if __name__ == "__main__":
    main()
