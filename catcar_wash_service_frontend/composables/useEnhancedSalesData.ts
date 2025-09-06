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

// Enhanced sales data from JSON file (embedded to avoid import issues)
const enhancedSalesDataArray: SaleItem[] = [
  {
    "id": "cmf2icd8i000jzsp8cc39yr0w",
    "device_id": "cmf2icd7z000bzsp86t6xiri2",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": "1234567890"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 3,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1763389417447,
      "total_amount": 3
    },
    "created_at": "2025-09-02 19:11:27",
    "device": {
      "id": "cmf2icd7z000bzsp86t6xiri2",
      "name": "Device 1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "User",
        "email": "user@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8i000kzsp8eae9jxnv",
    "device_id": "cmf2icd7z000bzsp86t6xiri2",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": "1234567890"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 2,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1751544593928,
      "total_amount": 2
    },
    "created_at": "2025-09-02 19:11:27",
    "device": {
      "id": "cmf2icd7z000bzsp86t6xiri2",
      "name": "Device 1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "User",
        "email": "user@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8i000lzsp8o8bpjvx0",
    "device_id": "cmf2icd7z000bzsp86t6xiri2",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": "1234567890"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 1,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1756329591231,
      "total_amount": 1
    },
    "created_at": "2025-09-02 19:11:27",
    "device": {
      "id": "cmf2icd7z000bzsp86t6xiri2",
      "name": "Device 1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "User",
        "email": "user@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j000mzsp8olw9iub0",
    "device_id": "cmf2icd7z000bzsp86t6xiri2",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": "1234567890"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 4,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1757325795839,
      "total_amount": 4
    },
    "created_at": "2025-09-02 19:11:27",
    "device": {
      "id": "cmf2icd7z000bzsp86t6xiri2",
      "name": "Device 1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "User",
        "email": "user@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j000nzsp86x91l0uz",
    "device_id": "cmf2icd7z000czsp8lfee15kl",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": "1234567890"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 5,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1755836397582,
      "total_amount": 5
    },
    "created_at": "2025-09-02 19:11:27",
    "device": {
      "id": "cmf2icd7z000czsp8lfee15kl",
      "name": "Device 2",
      "type": "DRYING",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "User",
        "email": "user@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j000ozsp8ufp0tf8g",
    "device_id": "cmf2icd7z000czsp8lfee15kl",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": "1234567890"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 4,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1761237780831,
      "total_amount": 4
    },
    "created_at": "2025-09-02 19:11:27",
    "device": {
      "id": "cmf2icd7z000czsp8lfee15kl",
      "name": "Device 2",
      "type": "DRYING",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "User",
        "email": "user@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j000pzsp80th8h577",
    "device_id": "cmf2icd7z000czsp8lfee15kl",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": "1234567890"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 6,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1752169731221,
      "total_amount": 6
    },
    "created_at": "2025-09-02 19:11:27",
    "device": {
      "id": "cmf2icd7z000czsp8lfee15kl",
      "name": "Device 2",
      "type": "DRYING",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "User",
        "email": "user@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j000qzsp85g6r3ehg",
    "device_id": "cmf2icd7z000czsp8lfee15kl",
    "payload": {
      "qr": {
        "ref1": null,
        "ref2": null,
        "net_amount": 0,
        "transaction_id": "1234567890"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 2,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1754942018071,
      "total_amount": 2
    },
    "created_at": "2025-09-02 19:11:27",
    "device": {
      "id": "cmf2icd7z000czsp8lfee15kl",
      "name": "Device 2",
      "type": "DRYING",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "User",
        "email": "user@catcarwash.com"
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
        "transaction_id": "1234567890"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 0,
        "500": 0,
        "1000": 0
      },
      "coin": {
        "1": 7,
        "2": 0,
        "5": 0,
        "10": 0
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1760964342380,
      "total_amount": 7
    },
    "created_at": "2025-09-02 19:11:27",
    "device": {
      "id": "cmf2icd7z000czsp8lfee15kl",
      "name": "Device 2",
      "type": "DRYING",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "User",
        "email": "user@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8i000izsp8uu6q36lb",
    "device_id": "cmf2icd7z000bzsp86t6xiri2",
    "payload": {
      "qr": {
        "ref1": "TXN123456789",
        "ref2": "REF987654321", 
        "net_amount": 50,
        "transaction_id": "QR789012345"
      },
      "bank": {
        "20": 2,
        "50": 1,
        "300": 0,
        "500": 1,
        "1000": 0
      },
      "coin": {
        "1": 5,
        "2": 2,
        "5": 3,
        "10": 1
      },
      "type": "PAYMENT",
      "status": "SUCCESS",
      "timestemp": 1764521312920,
      "total_amount": 596
    },
    "created_at": "2025-09-02 19:11:27",
    "device": {
      "id": "cmf2icd7z000bzsp86t6xiri2",
      "name": "Device 1",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "User",
        "email": "user@catcarwash.com"
      }
    }
  },
  {
    "id": "cmf2icd8j001azsp8abc12345",
    "device_id": "cmf2icd7z000dzsp8newdevice",
    "payload": {
      "qr": {
        "ref1": "TXN567890123",
        "ref2": "REF321654987",
        "net_amount": 150,
        "transaction_id": "QR456789012"
      },
      "bank": {
        "20": 0,
        "50": 0,
        "300": 1,
        "500": 0,
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
      "timestemp": 1765123456789,
      "total_amount": 1450
    },
    "created_at": "2025-09-02 20:30:15",
    "device": {
      "id": "cmf2icd7z000dzsp8newdevice",
      "name": "Device 3",
      "type": "WASH",
      "owner": {
        "id": "cmf2icd7s0008zsp8i1eruapr",
        "fullname": "User",
        "email": "user@catcarwash.com"
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