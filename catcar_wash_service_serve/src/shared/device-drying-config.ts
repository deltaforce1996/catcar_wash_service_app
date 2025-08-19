import { DryingSetup, GlobalSetup } from 'src/types/internal.type';

export class DeviceDryingConfig {
  public configs: {
    system: GlobalSetup;
    sale: DryingSetup;
  } | null;

  constructor(
    public readonly payload: {
      blow_dust: number;
      sterilize: number;
      uv: number;
      ozone: number;
      drying: number;
      perfume: number;
      start_service_fee: number;
      promotion: number;
      on_time: string;
      off_time: string;
      coin: boolean;
      promptpay: boolean;
      bank_note: boolean;
    },
  ) {
    this.parsePayload();
  }

  private parsePayload() {
    this.configs = {
      system: {
        on_time: this.payload.on_time,
        off_time: this.payload.off_time,
        payment_method: {
          coin: this.payload.coin,
          promptpay: this.payload.promptpay,
          bank_note: this.payload.bank_note,
        },
      },
      sale: {
        blow_dust: {
          value: this.payload.blow_dust,
          unit: 'วินาที',
          description: 'เป่าฝุ่น',
        },
        sterilize: {
          value: this.payload.sterilize,
          unit: 'วินาที',
          description: 'ฆ่าเชื้อ',
        },
        uv: {
          value: this.payload.uv,
          unit: 'วินาที',
          description: 'UV',
        },
        ozone: {
          value: this.payload.ozone,
          unit: 'วินาที',
          description: 'Ozone',
        },
        drying: {
          value: this.payload.drying,
          unit: 'วินาที',
          description: 'เป่าแห้ง',
        },
        perfume: {
          value: this.payload.perfume,
          unit: 'วินาที',
          description: 'น้ำหอม',
        },
        start_service_fee: {
          value: this.payload.start_service_fee,
          unit: 'บาท',
          description: 'ค่าบริการเริ่มต้น',
        },
        promotion: {
          value: this.payload.promotion,
          unit: '(%) เปอร์เซ็นต์',
          description: 'โปรโมชั่น',
        },
      },
    };
  }
}
