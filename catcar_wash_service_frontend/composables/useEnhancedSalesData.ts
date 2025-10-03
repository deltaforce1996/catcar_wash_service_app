interface QRPayload {
  ref1: string | null;
  ref2: string | null;
  net_amount: number;
  transaction_id: string;
}

interface BankPayload {
  "20": number;
  "50": number;
  "300": number;
  "500": number;
  "1000": number;
}

interface CoinPayload {
  "1": number;
  "2": number;
  "5": number;
  "10": number;
}

interface PaymentPayload {
  qr: QRPayload;
  bank: BankPayload;
  coin: CoinPayload;
  type: string;
  status: string;
  timestemp: number;
  total_amount: number;
}

interface Device {
  id: string;
  name: string;
  type: string;
  owner: {
    id: string;
    fullname: string;
    email: string;
  };
}

interface SaleItem {
  id: string;
  device_id: string;
  payload: PaymentPayload;
  created_at: string;
  device: Device;
}

// Enhanced sales data with varied QR, bank notes, and coins (embedded to avoid import issues)
const enhancedSalesDataArray: SaleItem[] = [
  {
    "id": "cmf2icd8i000jzsp8cc39yr0w",
    "device_id": "cmf2icd7z000bzsp86t6xiri2",
    "payload": {
      "qr": {
        "ref1": "TXN123456001",
        "ref2": "REF000000001",
        "net_amount": 25,
        "transaction_id": "QR202409020001"
      },
      "bank": {
        "20": 1,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 2,
        "2": 1,
        "5": 1,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1725264687000,
      "total_amount": 54
    },
    "created_at": "2024-09-02 08:30:45",
    "device": {
      "id": "cmf2icd7z000bzsp86t6xiri2",
      "name": "เครื่องล้างรถ A1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8i000kzsp8eae9jxnv",
    "device_id": "cmf2icd7z000czsp8lfee15kl",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": ""
      },
      "bank": {
        "20": 2,
        "50": 1,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 5,
        "2": 2,
        "5": 1,
        "10": 1
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1725268287000,
      "total_amount": 114
    },
    "created_at": "2024-09-02 09:45:30",
    "device": {
      "id": "cmf2icd7z000czsp8lfee15kl",
      "name": "เครื่องอบแห้ง B1",
      "type": "DRYING",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8i000lzsp8o8bpjvx0",
    "device_id": "cmf2icd7z000bzsp86t6xiri2",
    "payload": {
      "qr": {
        "ref1": "TXN123456002",
        "ref2": "REF000000002",
        "net_amount": 80,
        "transaction_id": "QR202409020002"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 15,
        "2": 5,
        "5": 2,
        "10": 2
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1725271887000,
      "total_amount": 125
    },
    "created_at": "2024-09-02 10:15:20",
    "device": {
      "id": "cmf2icd7z000bzsp86t6xiri2",
      "name": "เครื่องล้างรถ A1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j000mzsp8olw9iub0",
    "device_id": "cmf2icd7z000dzsp8newdevice",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": ""
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 1,
        "500": 1,
        "1000": 0
      },
      "coin": {
        "1": 8,
        "2": 6,
        "5": 4,
        "10": 3
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1725275487000,
      "total_amount": 870
    },
    "created_at": "2024-09-02 11:30:10",
    "device": {
      "id": "cmf2icd7z000dzsp8newdevice",
      "name": "เครื่องล้างรถ A2",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j000nzsp86x91l0uz",
    "device_id": "cmf2icd7z000czsp8lfee15kl",
    "payload": {
      "qr": {
        "ref1": "TXN123456003",
        "ref2": "REF000000003",
        "net_amount": 45,
        "transaction_id": "QR202409020003"
      },
      "bank": {
        "20": 1,
        "50": 1,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 3,
        "2": 1,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "FAILED",
      "timestemp": 1725279087000,
      "total_amount": 120
    },
    "created_at": "2024-09-02 12:45:55",
    "device": {
      "id": "cmf2icd7z000czsp8lfee15kl",
      "name": "เครื่องอบแห้ง B1",
      "type": "DRYING",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j000ozsp8ufp0tf8g",
    "device_id": "cmf2icd7z000ezsp8premium01",
    "payload": {
      "qr": {
        "ref1": "TXN123456004",
        "ref2": "REF000000004",
        "net_amount": 150,
        "transaction_id": "QR202409020004"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 1,
        "1000": 1
      },
      "coin": {
        "1": 0,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1725282687000,
      "total_amount": 1650
    },
    "created_at": "2024-09-02 13:20:40",
    "device": {
      "id": "cmf2icd7z000ezsp8premium01",
      "name": "เครื่องล้างรถพรีเมียม P1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j000pzsp80th8h577",
    "device_id": "cmf2icd7z000bzsp86t6xiri2",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": ""
      },
      "bank": {
        "20": 3,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 10,
        "2": 8,
        "5": 6,
        "10": 2
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1725286287000,
      "total_amount": 136
    },
    "created_at": "2024-09-02 14:15:25",
    "device": {
      "id": "cmf2icd7z000bzsp86t6xiri2",
      "name": "เครื่องล้างรถ A1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j000qzsp85g6r3ehg",
    "device_id": "cmf2icd7z000fzsp8motorbike",
    "payload": {
      "qr": {
        "ref1": "TXN123456005",
        "ref2": "REF000000005",
        "net_amount": 35,
        "transaction_id": "QR202409020005"
      },
      "bank": {
        "20": 1,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 5,
        "2": 2,
        "5": 1,
        "10": 1
      },
      "type": "PAYMENT",
      "status": "PENDING",
      "timestemp": 1725289887000,
      "total_amount": 72
    },
    "created_at": "2024-09-02 15:05:15",
    "device": {
      "id": "cmf2icd7z000fzsp8motorbike",
      "name": "เครื่องล้างรถมอเตอร์ไซค์ M1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j000rzsp8g8lzkhog",
    "device_id": "cmf2icd7z000czsp8lfee15kl",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": ""
      },
      "bank": {
        "20": 0,
        "50": 2,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 12,
        "2": 4,
        "5": 2,
        "10": 1
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1725293487000,
      "total_amount": 140
    },
    "created_at": "2024-09-02 16:10:33",
    "device": {
      "id": "cmf2icd7z000czsp8lfee15kl",
      "name": "เครื่องอบแห้ง B1",
      "type": "DRYING",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8i000izsp8uu6q36lb",
    "device_id": "cmf2icd7z000dzsp8newdevice",
    "payload": {
      "qr": {
        "ref1": "TXN123456006",
        "ref2": "REF000000006",
        "net_amount": 120,
        "transaction_id": "QR202409020006"
      },
      "bank": {
        "20": 2,
        "50": 1,
        "300": 1,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 8,
        "2": 3,
        "5": 2,
        "10": 1
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1725297087000,
      "total_amount": 534
    },
    "created_at": "2024-09-02 17:25:10",
    "device": {
      "id": "cmf2icd7z000dzsp8newdevice",
      "name": "เครื่องล้างรถ A2",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j001azsp8abc12345",
    "device_id": "cmf2icd7z000ezsp8premium01",
    "payload": {
      "qr": {
        "ref1": "TXN123456007",
        "ref2": "REF000000007",
        "net_amount": 200,
        "transaction_id": "QR202409020007"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 2
      },
      "coin": {
        "1": 0,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1725300687000,
      "total_amount": 2200
    },
    "created_at": "2024-09-02 18:40:50",
    "device": {
      "id": "cmf2icd7z000ezsp8premium01",
      "name": "เครื่องล้างรถพรีเมียม P1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j001bzsp8final001",
    "device_id": "cmf2icd7z000fzsp8motorbike",
    "payload": {
      "qr": {
        "ref1": "TXN123456008",
        "ref2": "REF000000008",
        "net_amount": 30,
        "transaction_id": "QR202409020008"
      },
      "bank": {
        "20": 1,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 15,
        "2": 7,
        "5": 3,
        "10": 2
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1725304287000,
      "total_amount": 114
    },
    "created_at": "2024-09-02 19:55:25",
    "device": {
      "id": "cmf2icd7z000fzsp8motorbike",
      "name": "เครื่องล้างรถมอเตอร์ไซค์ M1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "สมชาย ใจดี",
        "email": "somchai@catcarwash.com"
      }
    }
  }
];

export const useEnhancedSalesData = () => {
  const salesData = ref<SaleItem[]>(enhancedSalesDataArray);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const refreshData = async () => {
    // For future use when we connect to real API
    loading.value = true;
    await nextTick();
    loading.value = false;
  };

  return {
    salesData: readonly(salesData),
    loading: readonly(loading),
    error: readonly(error),
    refreshData,
  };
};