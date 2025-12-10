export interface DeviceUpdateResult {
  device_id: string;
  device_name: string;
  device_type: 'WASH' | 'DRYING';
  status: 'success' | 'failed';
  error?: string;
}
