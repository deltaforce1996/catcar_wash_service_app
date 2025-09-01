interface DeviceConfig {
  unit: string;
  value: number;
  description: string;
}

interface Device {
  id: string;
  name: string;
  type: "WASH" | "DRYING";
  status: "DEPLOYED" | "MAINTENANCE" | "ERROR";
  information: unknown;
  configs: {
    sale: Record<string, DeviceConfig>;
    system: {
      on_time: string;
      off_time: string;
      payment_method: {
        coin: boolean;
        bank_note: boolean;
        promptpay: boolean;
      };
    };
  };
  created_at: string;
  updated_at: string;
  owner: {
    id: string;
    fullname: string;
    email: string;
  };
  registered_by: {
    id: string;
    name: string;
    email: string;
  };
}

export const devicesData: Device[] = [
  {
    id: "cmejzo4ul000hzsg80ht79g2i",
    name: "Device 7",
    type: "WASH",
    status: "DEPLOYED",
    information: null,
    configs: {
      sale: {
        uv: {
          unit: "วินาที",
          value: 10,
          description: "UV",
        },
        ozone: {
          unit: "วินาที",
          value: 10,
          description: "Ozone",
        },
        drying: {
          unit: "วินาที",
          value: 10,
          description: "เป่าแห้ง",
        },
        perfume: {
          unit: "วินาที",
          value: 10,
          description: "น้ำหอม",
        },
        blow_dust: {
          unit: "วินาที",
          value: 10,
          description: "เป่าฝุ่น",
        },
        promotion: {
          unit: "(%) เปอร์เซ็นต์",
          value: 10,
          description: "โปรโมชั่น",
        },
        sterilize: {
          unit: "วินาที",
          value: 10,
          description: "ฆ่าเชื้อ",
        },
        start_service_fee: {
          unit: "บาท",
          value: 10,
          description: "ค่าบริการเริ่มต้น",
        },
      },
      system: {
        on_time: "00:00",
        off_time: "23:59",
        payment_method: {
          coin: true,
          bank_note: true,
          promptpay: true,
        },
      },
    },
    created_at: "2025-08-20T13:08:52.749Z",
    updated_at: "2025-08-20T13:08:52.749Z",
    owner: {
      id: "cmejzo4tm000azsg8j89hef6e",
      fullname: "User 2",
      email: "user2@catcarwash.com",
    },
    registered_by: {
      id: "cmejzo4ta0006zsg8wmq9uk1q",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
  {
    id: "cmejzo4ul000gzsg8hqzd9k7h",
    name: "Device 6",
    type: "WASH",
    status: "DEPLOYED",
    information: null,
    configs: {
      sale: {
        air: {
          unit: "วินาที",
          value: 10,
          description: "ลม",
        },
        wax: {
          unit: "วินาที",
          value: 10,
          description: "ลง wax",
        },
        foam: {
          unit: "วินาที",
          value: 10,
          description: "โฟม",
        },
        water: {
          unit: "วินาที",
          value: 10,
          description: "น้ำยาปรับอากาศ",
        },
        vacuum: {
          unit: "วินาที",
          value: 10,
          description: "ดูดฝุ่น",
        },
        hp_water: {
          unit: "วินาที",
          value: 10,
          description: "ปริมาณน้ำ",
        },
        promotion: {
          unit: "(%) เปอร์เซ็นต์",
          value: 10,
          description: "โปรโมชั่น",
        },
        black_tire: {
          unit: "วินาที",
          value: 10,
          description: "ล้างล้อ",
        },
        parking_fee: {
          unit: "วินาที",
          value: 10,
          description: "ค่าปรับที่จอดรถ",
        },
        air_conditioner: {
          unit: "วินาที",
          value: 10,
          description: "ปรับอากาศ",
        },
      },
      system: {
        on_time: "00:00",
        off_time: "23:59",
        payment_method: {
          coin: true,
          bank_note: true,
          promptpay: true,
        },
      },
    },
    created_at: "2025-08-20T13:08:52.749Z",
    updated_at: "2025-08-20T13:08:52.749Z",
    owner: {
      id: "cmejzo4tm000azsg8j89hef6e",
      fullname: "User 2",
      email: "user2@catcarwash.com",
    },
    registered_by: {
      id: "cmejzo4ta0006zsg8wmq9uk1q",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
  {
    id: "cmejzo4uk000fzsg8a4y8ohnk",
    name: "Device 5",
    type: "DRYING",
    status: "DEPLOYED",
    information: null,
    configs: {
      sale: {
        uv: {
          unit: "วินาที",
          value: 10,
          description: "UV",
        },
        ozone: {
          unit: "วินาที",
          value: 10,
          description: "Ozone",
        },
        drying: {
          unit: "วินาที",
          value: 10,
          description: "เป่าแห้ง",
        },
        perfume: {
          unit: "วินาที",
          value: 10,
          description: "น้ำหอม",
        },
        blow_dust: {
          unit: "วินาที",
          value: 10,
          description: "เป่าฝุ่น",
        },
        promotion: {
          unit: "(%) เปอร์เซ็นต์",
          value: 10,
          description: "โปรโมชั่น",
        },
        sterilize: {
          unit: "วินาที",
          value: 10,
          description: "ฆ่าเชื้อ",
        },
        start_service_fee: {
          unit: "บาท",
          value: 10,
          description: "ค่าบริการเริ่มต้น",
        },
      },
      system: {
        on_time: "00:00",
        off_time: "23:59",
        payment_method: {
          coin: true,
          bank_note: true,
          promptpay: true,
        },
      },
    },
    created_at: "2025-08-20T13:08:52.749Z",
    updated_at: "2025-08-20T13:08:52.749Z",
    owner: {
      id: "cmejzo4tm000azsg8j89hef6e",
      fullname: "User 2",
      email: "user2@catcarwash.com",
    },
    registered_by: {
      id: "cmejzo4ta0006zsg8wmq9uk1q",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
  {
    id: "cmejzo4tx000dzsg8v8gd267n",
    name: "Device 3",
    type: "DRYING",
    status: "DEPLOYED",
    information: null,
    configs: {
      sale: {
        uv: {
          unit: "วินาที",
          value: 10,
          description: "UV",
        },
        ozone: {
          unit: "วินาที",
          value: 10,
          description: "Ozone",
        },
        drying: {
          unit: "วินาที",
          value: 10,
          description: "เป่าแห้ง",
        },
        perfume: {
          unit: "วินาที",
          value: 10,
          description: "น้ำหอม",
        },
        blow_dust: {
          unit: "วินาที",
          value: 10,
          description: "เป่าฝุ่น",
        },
        promotion: {
          unit: "(%) เปอร์เซ็นต์",
          value: 10,
          description: "โปรโมชั่น",
        },
        sterilize: {
          unit: "วินาที",
          value: 10,
          description: "ฆ่าเชื้อ",
        },
        start_service_fee: {
          unit: "บาท",
          value: 10,
          description: "ค่าบริการเริ่มต้น",
        },
      },
      system: {
        on_time: "00:00",
        off_time: "23:59",
        payment_method: {
          coin: true,
          bank_note: true,
          promptpay: true,
        },
      },
    },
    created_at: "2025-08-20T13:08:52.725Z",
    updated_at: "2025-08-20T13:08:52.725Z",
    owner: {
      id: "cmejzo4tg0008zsg8ld2unelz",
      fullname: "User",
      email: "user@catcarwash.com",
    },
    registered_by: {
      id: "cmejzo4ta0006zsg8wmq9uk1q",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
  {
    id: "cmejzo4tx000bzsg8sj2mjztd",
    name: "Device 1",
    type: "WASH",
    status: "DEPLOYED",
    information: null,
    configs: {
      sale: {
        air: {
          unit: "วินาที",
          value: 10,
          description: "ลม",
        },
        wax: {
          unit: "วินาที",
          value: 10,
          description: "ลง wax",
        },
        foam: {
          unit: "วินาที",
          value: 10,
          description: "โฟม",
        },
        water: {
          unit: "วินาที",
          value: 10,
          description: "น้ำยาปรับอากาศ",
        },
        vacuum: {
          unit: "วินาที",
          value: 10,
          description: "ดูดฝุ่น",
        },
        hp_water: {
          unit: "วินาที",
          value: 10,
          description: "ปริมาณน้ำ",
        },
        promotion: {
          unit: "(%) เปอร์เซ็นต์",
          value: 10,
          description: "โปรโมชั่น",
        },
        black_tire: {
          unit: "วินาที",
          value: 10,
          description: "ล้างล้อ",
        },
        parking_fee: {
          unit: "วินาที",
          value: 10,
          description: "ค่าปรับที่จอดรถ",
        },
        air_conditioner: {
          unit: "วินาที",
          value: 10,
          description: "ปรับอากาศ",
        },
      },
      system: {
        on_time: "00:00",
        off_time: "23:59",
        payment_method: {
          coin: true,
          bank_note: true,
          promptpay: true,
        },
      },
    },
    created_at: "2025-08-20T13:08:52.725Z",
    updated_at: "2025-08-20T13:08:52.725Z",
    owner: {
      id: "cmejzo4tg0008zsg8ld2unelz",
      fullname: "User",
      email: "user@catcarwash.com",
    },
    registered_by: {
      id: "cmejzo4ta0006zsg8wmq9uk1q",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
];

export type { Device, DeviceConfig };