#!/usr/bin/env python3
"""
CatCar Wash Service - Device Command Simulator
Simulator สำหรับจำลองอุปกรณ์ที่รับและตอบคำสั่งผ่าน MQTT
รองรับคำสั่ง: APPLY_CONFIG, RESTART, UPDATE_FIRMWARE, RESET_CONFIG, PAYMENT
"""

import paho.mqtt.client as mqtt
import json
import time
import random
import signal
import sys
import yaml
import os
from datetime import datetime
from typing import Dict, Optional, Callable
from enum import Enum

class CommandStatus(Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PROGRESS = "PROGRESS"

class DeviceCommandSimulator:
    def __init__(self, device_id: str, broker_host: str = "localhost", broker_port: int = 1883):
        """
        Initialize Device Command Simulator
        
        Args:
            device_id: Device identifier
            broker_host: MQTT broker host
            broker_port: MQTT broker port
        """
        self.device_id = device_id
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.client: Optional[mqtt.Client] = None
        self.running = False
        self.commands_received = 0
        self.commands_acked = 0
        
        # Command topics
        self.command_topic = f"device/{device_id}/command"
        self.payment_topic = f"device/{device_id}/payment-status"
        self.ack_topic = f"server/{device_id}/ack"
        
        # Command handlers
        self.command_handlers: Dict[str, Callable] = {
            'APPLY_CONFIG': self._handle_apply_config,
            'RESTART': self._handle_restart,
            'UPDATE_FIRMWARE': self._handle_update_firmware,
            'RESET_CONFIG': self._handle_reset_config,
            'PAYMENT': self._handle_payment,
        }
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _create_client(self) -> mqtt.Client:
        """Create MQTT client"""
        client = mqtt.Client()
        client.on_connect = self._on_connect
        client.on_disconnect = self._on_disconnect
        client.on_message = self._on_message
        client.on_log = self._on_log
        return client
    
    def _on_connect(self, client, userdata, flags, rc):
        """MQTT connection callback"""
        if rc == 0:
            print(f"✅ Device {self.device_id} เชื่อมต่อ MQTT broker สำเร็จ")
            # Subscribe to command topics
            client.subscribe(self.command_topic, qos=1)
            client.subscribe(self.payment_topic, qos=1)
            print(f"📡 Subscribed to: {self.command_topic}")
            print(f"📡 Subscribed to: {self.payment_topic}")
        else:
            print(f"❌ Device {self.device_id} เชื่อมต่อ MQTT broker ไม่สำเร็จ: {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """MQTT disconnection callback"""
        if rc != 0:
            print(f"⚠️  Device {self.device_id} MQTT broker disconnected: {rc}")
    
    def _on_message(self, client, userdata, msg):
        """MQTT message callback"""
        try:
            self.commands_received += 1
            payload_str = msg.payload.decode('utf-8')
            payload = json.loads(payload_str)
            
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"\n[{timestamp}] 📥 Received message on {msg.topic}")
            print(f"   Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
            
            # Extract command info
            command = payload.get('command', 'UNKNOWN')
            command_id = payload.get('command_id', 'unknown')
            require_ack = payload.get('require_ack', False)
            
            # Handle command
            if command in self.command_handlers:
                handler = self.command_handlers[command]
                success, result_data, error_msg = handler(payload)
                
                # Send ACK if required
                if require_ack:
                    self._send_ack(
                        command_id=command_id,
                        command=command,
                        status=CommandStatus.SUCCESS if success else CommandStatus.FAILED,
                        result_data=result_data,
                        error=error_msg
                    )
            else:
                print(f"⚠️  Unknown command: {command}")
                if require_ack:
                    self._send_ack(
                        command_id=command_id,
                        command=command,
                        status=CommandStatus.FAILED,
                        result_data=None,
                        error=f"Unknown command: {command}"
                    )
        
        except Exception as e:
            print(f"❌ Error processing message: {e}")
    
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
    
    def _handle_apply_config(self, payload: dict) -> tuple:
        """
        Handle APPLY_CONFIG command
        
        Returns:
            tuple: (success: bool, result_data: dict, error: str)
        """
        print("🔧 Handling APPLY_CONFIG command...")
        
        config = payload.get('payload', {})
        
        # Simulate processing time
        time.sleep(random.uniform(0.5, 1.5))
        
        # Simulate 90% success rate
        success = random.random() < 0.9
        
        if success:
            print("✅ Configuration applied successfully")
            return True, {
                "config_applied": config,
                "timestamp": int(time.time() * 1000)
            }, None
        else:
            error = "Failed to apply configuration: Validation error"
            print(f"❌ {error}")
            return False, None, error
    
    def _handle_restart(self, payload: dict) -> tuple:
        """
        Handle RESTART command
        
        Returns:
            tuple: (success: bool, result_data: dict, error: str)
        """
        print("🔄 Handling RESTART command...")
        
        restart_payload = payload.get('payload', {})
        delay_seconds = restart_payload.get('delay_seconds', 5)
        
        print(f"   Device will restart in {delay_seconds} seconds...")
        
        # Simulate processing time
        time.sleep(0.5)
        
        # Simulate 95% success rate
        success = random.random() < 0.95
        
        if success:
            print("✅ Restart command accepted")
            return True, {
                "delay_seconds": delay_seconds,
                "restart_at": int(time.time() * 1000) + (delay_seconds * 1000)
            }, None
        else:
            error = "Failed to restart: System busy"
            print(f"❌ {error}")
            return False, None, error
    
    def _handle_update_firmware(self, payload: dict) -> tuple:
        """
        Handle UPDATE_FIRMWARE command
        
        Returns:
            tuple: (success: bool, result_data: dict, error: str)
        """
        print("📦 Handling UPDATE_FIRMWARE command...")
        
        firmware = payload.get('payload', {})
        url = firmware.get('url', '')
        version = firmware.get('version', '')
        sha256 = firmware.get('sha256', '')
        size = firmware.get('size', 0)
        
        print(f"   URL: {url}")
        print(f"   Version: {version}")
        print(f"   SHA256: {sha256}")
        print(f"   Size: {size} bytes")
        
        # Simulate download and verification time
        print("   ⏳ Downloading firmware...")
        time.sleep(random.uniform(1.0, 2.0))
        
        # Simulate 85% success rate
        success = random.random() < 0.85
        
        if success:
            print("✅ Firmware update started")
            return True, {
                "version": version,
                "download_started": True,
                "estimated_time": 300  # 5 minutes
            }, None
        else:
            error = "Failed to update firmware: Download failed"
            print(f"❌ {error}")
            return False, None, error
    
    def _handle_reset_config(self, payload: dict) -> tuple:
        """
        Handle RESET_CONFIG command
        
        Returns:
            tuple: (success: bool, result_data: dict, error: str)
        """
        print("♻️ Handling RESET_CONFIG command...")
        
        config = payload.get('payload', {})
        
        # Simulate processing time
        time.sleep(random.uniform(0.5, 1.5))
        
        # Simulate 92% success rate
        success = random.random() < 0.92
        
        if success:
            print("✅ Configuration reset successfully")
            return True, {
                "config_reset": config,
                "timestamp": int(time.time() * 1000)
            }, None
        else:
            error = "Failed to reset configuration: Invalid config"
            print(f"❌ {error}")
            return False, None, error
    
    def _handle_payment(self, payload: dict) -> tuple:
        """
        Handle PAYMENT status notification
        
        Returns:
            tuple: (success: bool, result_data: dict, error: str)
        """
        print("💳 Handling PAYMENT status...")
        
        payment_payload = payload.get('payload', {})
        charge_id = payment_payload.get('chargeId', '')
        status = payment_payload.get('status', '')
        
        print(f"   Charge ID: {charge_id}")
        print(f"   Status: {status}")
        
        # Payment notifications don't require ACK
        print("✅ Payment status received")
        return True, {
            "charge_id": charge_id,
            "status": status,
            "processed_at": int(time.time() * 1000)
        }, None
    
    def _send_ack(
        self,
        command_id: str,
        command: str,
        status: CommandStatus,
        result_data: Optional[dict] = None,
        error: Optional[str] = None
    ):
        """
        Send ACK response to server
        
        Args:
            command_id: Command identifier
            command: Command name
            status: Command execution status
            result_data: Result data from command execution
            error: Error message if failed
        """
        ack_payload = {
            "command_id": command_id,
            "device_id": self.device_id,
            "command": command,
            "status": status.value,
            "timestamp": int(time.time() * 1000)
        }
        
        if result_data:
            ack_payload["result"] = result_data
        
        if error:
            ack_payload["error"] = error
        
        try:
            result = self.client.publish(self.ack_topic, json.dumps(ack_payload), qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                self.commands_acked += 1
                timestamp = datetime.now().strftime("%H:%M:%S")
                status_emoji = "✅" if status == CommandStatus.SUCCESS else "❌"
                print(f"[{timestamp}] 📤 {status_emoji} ACK sent: {command_id} - {status.value}")
            else:
                print(f"❌ Failed to send ACK: {result.rc}")
        
        except Exception as e:
            print(f"❌ Error sending ACK: {e}")
    
    def connect(self) -> bool:
        """
        Connect to MQTT broker
        
        Returns:
            bool: True if connected successfully
        """
        try:
            self.client = self._create_client()
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
            
            # Wait for connection
            time.sleep(1)
            
            if self.client.is_connected():
                return True
            else:
                self.client.loop_stop()
                self.client.disconnect()
                return False
        
        except Exception as e:
            print(f"❌ Failed to connect to MQTT broker: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.client and self.client.is_connected():
            self.client.loop_stop()
            self.client.disconnect()
            print(f"🔌 Device {self.device_id} disconnected from MQTT broker")
    
    def start(self):
        """Start listening for commands"""
        if self.running:
            print("⚠️  Simulator is already running")
            return
        
        if not self.connect():
            print("❌ Failed to connect to MQTT broker")
            return
        
        self.running = True
        print(f"\n{'='*60}")
        print(f"🚀 Device Command Simulator Started")
        print(f"{'='*60}")
        print(f"📱 Device ID: {self.device_id}")
        print(f"🔗 MQTT Broker: {self.broker_host}:{self.broker_port}")
        print(f"📡 Listening on: {self.command_topic}")
        print(f"📡 Listening on: {self.payment_topic}")
        print(f"{'='*60}")
        print("✅ Waiting for commands... (Press Ctrl+C to stop)")
        
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n👋 Stopping simulator...")
        finally:
            self.stop()
    
    def stop(self):
        """Stop simulator"""
        if not self.running:
            return
        
        self.running = False
        self.disconnect()
        
        print(f"\n{'='*60}")
        print("📊 Simulator Statistics")
        print(f"{'='*60}")
        print(f"📥 Commands received: {self.commands_received}")
        print(f"📤 Commands acknowledged: {self.commands_acked}")
        print(f"{'='*60}")
        print("✅ Simulator stopped")

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

def main():
    """Main function"""
    print("🚗 CatCar Wash Service - Device Command Simulator")
    print("="*60)
    
    # Get device ID from user
    device_id = input("🆔 Enter Device ID (e.g., D001): ").strip()
    
    if not device_id:
        print("❌ Device ID is required")
        return
    
    # Load MQTT configuration
    broker_host, broker_port = load_docker_compose_config()
    print(f"🔗 MQTT Broker: {broker_host}:{broker_port}")
    
    # Initialize and start simulator
    simulator = DeviceCommandSimulator(device_id, broker_host, broker_port)
    simulator.start()

if __name__ == "__main__":
    main()

