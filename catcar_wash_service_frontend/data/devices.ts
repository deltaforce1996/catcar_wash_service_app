interface DeviceConfig {
  unit: string;
  value: number;
  description: string;
}

interface Device {
  id: string;
  name: string;
  type: "WASH" | "DRYING";
  status: "DEPLOYED" | "MAINTENANCE" | "ERROR" | "DISABLED";
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
    id: "cmf2icd86000hzsp84qie4eo8",
    name: "Device 7",
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
    created_at: "2025-09-02T12:11:27.606Z",
    updated_at: "2025-09-02T12:11:27.606Z",
    owner: {
      id: "cmf2icd7v000azsp8alq3bsub",
      fullname: "User 2",
      email: "user2@catcarwash.com",
    },
    registered_by: {
      id: "cmf2icd7q0006zsp8qph8jj80",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
  {
    id: "cmf2icd86000gzsp8glc9kfpt",
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
    created_at: "2025-09-02T12:11:27.606Z",
    updated_at: "2025-09-02T12:11:27.606Z",
    owner: {
      id: "cmf2icd7v000azsp8alq3bsub",
      fullname: "User 2",
      email: "user2@catcarwash.com",
    },
    registered_by: {
      id: "cmf2icd7q0006zsp8qph8jj80",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
  {
    id: "cmf2icd86000fzsp8m2pxkgdn",
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
    created_at: "2025-09-02T12:11:27.606Z",
    updated_at: "2025-09-02T12:11:27.606Z",
    owner: {
      id: "cmf2icd7v000azsp8alq3bsub",
      fullname: "User 2",
      email: "user2@catcarwash.com",
    },
    registered_by: {
      id: "cmf2icd7q0006zsp8qph8jj80",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
  {
    id: "cmf2icd86000ezsp8hihrg1ft",
    name: "Device 4",
    type: "WASH",
    status: "DISABLED",
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
    created_at: "2025-09-02T12:11:27.606Z",
    updated_at: "2025-09-02T12:11:27.606Z",
    owner: {
      id: "cmf2icd7v000azsp8alq3bsub",
      fullname: "User 2",
      email: "user2@catcarwash.com",
    },
    registered_by: {
      id: "cmf2icd7q0006zsp8qph8jj80",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
  {
    id: "cmf2icd7z000dzsp8m1jhb4xp",
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
    created_at: "2025-09-02T12:11:27.599Z",
    updated_at: "2025-09-02T12:11:27.599Z",
    owner: {
      id: "cmf2icd7s0008zsp8i1eruapr",
      fullname: "User",
      email: "user@catcarwash.com",
    },
    registered_by: {
      id: "cmf2icd7q0006zsp8qph8jj80",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
  {
    id: "cmf2icd7z000czsp8lfee15kl",
    name: "Device 2",
    type: "DRYING",
    status: "DISABLED",
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
    created_at: "2025-09-02T12:11:27.599Z",
    updated_at: "2025-09-02T12:11:27.599Z",
    owner: {
      id: "cmf2icd7s0008zsp8i1eruapr",
      fullname: "User",
      email: "user@catcarwash.com",
    },
    registered_by: {
      id: "cmf2icd7q0006zsp8qph8jj80",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
  {
    id: "cmf2icd7z000bzsp86t6xiri2",
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
    created_at: "2025-09-02T12:11:27.599Z",
    updated_at: "2025-09-02T12:11:27.599Z",
    owner: {
      id: "cmf2icd7s0008zsp8i1eruapr",
      fullname: "User",
      email: "user@catcarwash.com",
    },
    registered_by: {
      id: "cmf2icd7q0006zsp8qph8jj80",
      name: "Technician",
      email: "technician@catcarwash.com",
    },
  },
];

export type { Device, DeviceConfig };
