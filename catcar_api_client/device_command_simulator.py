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
import hashlib
from datetime import datetime
from typing import Dict, Optional, Callable
from enum import Enum

# Secret key สำหรับ signature verification
SECRET_KEY = "modernchabackdoor"

class CommandStatus(Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PROGRESS = "PROGRESS"

class DeviceCommandSimulator:
    def __init__(self, device_id: str, broker_host: str = "localhost", broker_port: int = 1883, 
                 failure_mode: str = "random"):
        """
        Initialize Device Command Simulator
        
        Args:
            device_id: Device identifier
            broker_host: MQTT broker host
            broker_port: MQTT broker port
            failure_mode: Error simulation mode - "none" (always success), 
                         "random" (random failures), "always" (always fail)
        """
        self.device_id = device_id
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.client: Optional[mqtt.Client] = None
        self.running = False
        self.commands_received = 0
        self.commands_acked = 0
        
        # Error simulation configuration
        self.failure_mode = failure_mode  # "none", "random", "always"
        self.error_rates = {
            'APPLY_CONFIG': 0.1,      # 10% failure rate
            'RESTART': 0.05,          # 5% failure rate
            'UPDATE_FIRMWARE': 0.15,  # 15% failure rate
            'RESET_CONFIG': 0.08,     # 8% failure rate
            'PAYMENT': 0.0,           # No failures for payment
            'MANUAL_PAYMENT': 0.05,   # 5% failure rate
        }
        
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
            'MANUAL_PAYMENT': self._handle_manual_payment,
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
    
    def _calculate_signature(self, payload: Dict) -> str:
        """
        คำนวณ signature สำหรับ ACK message
        
        Args:
            payload: ACK payload
            
        Returns:
            str: SHA256 signature
        """
        # แปลง payload เป็น JSON string (ไม่มี whitespace)
        payload_string = json.dumps(payload, separators=(',', ':'), ensure_ascii=False)
        
        # คำนวณ SHA256(payload + SECRET_KEY)
        combined = payload_string + SECRET_KEY
        signature = hashlib.sha256(combined.encode('utf-8')).hexdigest()
        
        return signature
    
    def _should_fail(self, command: str) -> bool:
        """
        กำหนดว่า command ควรจะ fail หรือไม่ ตาม failure_mode
        
        Args:
            command: Command name
            
        Returns:
            bool: True ถ้าควรจะ fail
        """
        if self.failure_mode == "always":
            return True
        elif self.failure_mode == "none":
            return False
        elif self.failure_mode == "random":
            error_rate = self.error_rates.get(command, 0.1)
            return random.random() < error_rate
        else:
            # Default to random
            error_rate = self.error_rates.get(command, 0.1)
            return random.random() < error_rate
    
    def set_failure_mode(self, mode: str):
        """
        เปลี่ยนโหมดการจำลอง error
        
        Args:
            mode: "none", "random", หรือ "always"
        """
        if mode in ["none", "random", "always"]:
            self.failure_mode = mode
            print(f"🔧 Failure mode changed to: {mode}")
        else:
            print(f"⚠️  Invalid failure mode: {mode}. Use 'none', 'random', or 'always'")
    
    def set_error_rate(self, command: str, rate: float):
        """
        ตั้งค่า error rate สำหรับ command เฉพาะ
        
        Args:
            command: Command name
            rate: Error rate (0.0 - 1.0)
        """
        if command in self.error_rates:
            self.error_rates[command] = max(0.0, min(1.0, rate))
            print(f"🔧 Error rate for {command} set to: {rate * 100:.1f}%")
        else:
            print(f"⚠️  Unknown command: {command}")
    
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
        
        # Check if should fail based on failure mode
        should_fail = self._should_fail('APPLY_CONFIG')
        
        if not should_fail:
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
        
        # Check if should fail based on failure mode
        should_fail = self._should_fail('RESTART')
        
        if not should_fail:
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
        version = firmware.get('version', '')
        reboot_after = firmware.get('reboot_after', True)

        # Extract HW and QR firmware variants
        hw_firmware = firmware.get('HW', {})
        qr_firmware = firmware.get('QR', {})

        print(f"   Version: {version}")
        print(f"   Reboot After: {reboot_after}")
        print(f"\n   📦 HW Firmware:")
        print(f"      URL: {hw_firmware.get('url', '')}")
        print(f"      SHA256: {hw_firmware.get('sha256', '')[:16]}...")
        print(f"      Size: {hw_firmware.get('size', 0)} bytes")
        print(f"\n   📦 QR Firmware:")
        print(f"      URL: {qr_firmware.get('url', '')}")
        print(f"      SHA256: {qr_firmware.get('sha256', '')[:16]}...")
        print(f"      Size: {qr_firmware.get('size', 0)} bytes")

        # Simulate download and verification time for both variants
        print("\n   ⏳ Downloading HW firmware...")
        time.sleep(random.uniform(1.0, 1.5))
        print("   ⏳ Downloading QR firmware...")
        time.sleep(random.uniform(1.0, 1.5))

        # Check if should fail based on failure mode
        should_fail = self._should_fail('UPDATE_FIRMWARE')

        if not should_fail:
            print("✅ Firmware update started for both HW and QR variants")
            return True, {
                "version": version,
                "download_started": True,
                "hw_firmware": hw_firmware.get('url', '').split('/')[-1],
                "qr_firmware": qr_firmware.get('url', '').split('/')[-1],
                "estimated_time": 600  # 10 minutes (longer for dual firmware)
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
        
        # Check if should fail based on failure mode
        should_fail = self._should_fail('RESET_CONFIG')
        
        if not should_fail:
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
    
    def _handle_manual_payment(self, payload: dict) -> tuple:
        """
        Handle MANUAL_PAYMENT command
        
        Returns:
            tuple: (success: bool, result_data: dict, error: str)
        """
        print("💰 Handling MANUAL_PAYMENT command...")
        
        payment_payload = payload.get('payload', {})
        amount = payment_payload.get('amount', 0)
        expire_at = payment_payload.get('expire_at', 0)
        
        print(f"   Amount: {amount} baht")
        print(f"   Expire at: {expire_at}")
        
        # Simulate processing time
        time.sleep(random.uniform(0.3, 0.8))
        
        # Check if should fail based on failure mode
        should_fail = self._should_fail('MANUAL_PAYMENT')
        
        if not should_fail:
            print("✅ Manual payment accepted")
            return True, {
                "amount": amount,
                "expire_at": expire_at,
                "accepted": True,
                "processed_at": int(time.time() * 1000)
            }, None
        else:
            error = "Failed to process manual payment: Device busy"
            print(f"❌ {error}")
            return False, None, error
    
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
        
        
        # เพิ่ม error message ถ้ามี
        if error:
            ack_payload["error"] = error
        
        # คำนวณ signature และเพิ่มเข้าไปใน payload
        signature = self._calculate_signature(ack_payload)
        ack_payload["sha256"] = signature
        
        try:
            result = self.client.publish(self.ack_topic, json.dumps(ack_payload), qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                self.commands_acked += 1
                timestamp = datetime.now().strftime("%H:%M:%S")
                status_emoji = "✅" if status == CommandStatus.SUCCESS else "❌"
                print(f"[{timestamp}] 📤 {status_emoji} ACK sent: {command_id} - {status.value}")
                print(f"   🔐 Signature: {signature[:16]}...")
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
        print(f"⚙️  Failure Mode: {self.failure_mode}")
        if self.failure_mode == "random":
            print(f"📊 Error Rates:")
            for cmd, rate in self.error_rates.items():
                print(f"   - {cmd}: {rate*100:.0f}%")
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
    
    # Select failure mode
    print("\n⚙️  Error Simulation Mode:")
    print("1. ❌ None - Always success (no errors)")
    print("2. 🎲 Random - Random failures based on error rates (default)")
    print("3. 💥 Always - Always fail (for testing error handling)")
    failure_choice = input("👉 Select mode (1-3, default: 2): ").strip() or "2"
    
    failure_modes = {
        "1": "none",
        "2": "random",
        "3": "always"
    }
    failure_mode = failure_modes.get(failure_choice, "random")
    
    # Load MQTT configuration
    broker_host, broker_port = load_docker_compose_config()
    print(f"🔗 MQTT Broker: {broker_host}:{broker_port}")
    
    # Initialize and start simulator
    simulator = DeviceCommandSimulator(device_id, broker_host, broker_port, failure_mode)
    simulator.start()

if __name__ == "__main__":
    main()

