import { GlobalSetup, WashSetup } from 'src/types/internal.type';

export class DeviceWashConfig {
  public configs: {
    system: GlobalSetup;
    sale: WashSetup;
  } | null;
  constructor(
    public readonly payload: {
      hp_water: number;
      foam: number;
      air: number;
      water: number;
      vacuum: number;
      black_tire: number;
      wax: number;
      air_conditioner: number;
      parking_fee: number;
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
        hp_water: {
          value: this.payload.hp_water,
          unit: 'วินาที',
          description: 'ปริมาณน้ำ',
        },
        foam: {
          value: this.payload.foam,
          unit: 'วินาที',
          description: 'โฟม',
        },
        air: {
          value: this.payload.air,
          unit: 'วินาที',
          description: 'ลม',
        },
        water: {
          value: this.payload.water,
          unit: 'วินาที',
          description: 'น้ำยาปรับอากาศ',
        },
        vacuum: {
          value: this.payload.vacuum,
          unit: 'วินาที',
          description: 'ดูดฝุ่น',
        },
        black_tire: {
          value: this.payload.black_tire,
          unit: 'วินาที',
          description: 'ล้างล้อ',
        },
        wax: {
          value: this.payload.wax,
          unit: 'วินาที',
          description: 'ลง wax',
        },
        air_conditioner: {
          value: this.payload.air_conditioner,
          unit: 'วินาที',
          description: 'ปรับอากาศ',
        },
        parking_fee: {
          value: this.payload.parking_fee,
          unit: 'วินาที',
          description: 'ค่าปรับที่จอดรถ',
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
