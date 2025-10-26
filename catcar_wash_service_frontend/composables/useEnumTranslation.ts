import type {
  EnumDeviceType,
  EnumDeviceStatus,
  EnumUserStatus,
  EnumEmpStatus,
  EnumPaymentStatus,
  EnumEventType,
  EnumPermissionType,
} from "~/types";

export const useEnumTranslation = () => {
  // ========================================
  // LABEL TRANSLATION FUNCTIONS
  // ========================================

  const getDeviceTypeLabel = (type: EnumDeviceType): string => {
    switch (type) {
      case "WASH":
        return "เครื่องล้าง";
      case "DRYING":
        return "เครื่องอบแห้ง";
      default:
        return type;
    }
  };

  const getDeviceStatusLabel = (status: EnumDeviceStatus): string => {
    switch (status) {
      case "DEPLOYED":
        return "ใช้งานได้";
      case "DISABLED":
        return "ปิดใช้งาน";
      default:
        return status;
    }
  };

  const getUserStatusLabel = (status: EnumUserStatus): string => {
    switch (status) {
      case "ACTIVE":
        return "ใช้งาน";
      case "INACTIVE":
        return "ไม่ใช้งาน";
      default:
        return status;
    }
  };

  const getEmpStatusLabel = (status: EnumEmpStatus): string => {
    switch (status) {
      case "ACTIVE":
        return "ใช้งาน";
      case "INACTIVE":
        return "ไม่ใช้งาน";
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (status: EnumPaymentStatus): string => {
    switch (status) {
      case "PENDING":
        return "รอดำเนินการ";
      case "SUCCEEDED":
        return "สำเร็จ";
      case "FAILED":
        return "ล้มเหลว";
      case "CANCELLED":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  const getEventTypeLabel = (type: EnumEventType): string => {
    switch (type) {
      case "PAYMENT":
        return "การชำระเงิน";
      case "INFO":
        return "ข้อมูล";
      default:
        return type;
    }
  };

  const getPermissionTypeLabel = (type: EnumPermissionType): string => {
    switch (type) {
      case "ADMIN":
        return "ผู้ดูแลระบบ";
      case "TECHNICIAN":
        return "ช่างเทคนิค";
      case "USER":
        return "ผู้ใช้ทั่วไป";
      default:
        return type;
    }
  };

  // ========================================
  // COLOR MAPPING FUNCTIONS
  // ========================================

  const getDeviceTypeColor = (type: EnumDeviceType): string => {
    switch (type) {
      case "WASH":
        return "primary";
      case "DRYING":
        return "secondary";
      default:
        return "primary";
    }
  };

  const getDeviceStatusColor = (status: EnumDeviceStatus): string => {
    switch (status) {
      case "DEPLOYED":
        return "success";
      case "DISABLED":
        return "error";
      default:
        return "grey";
    }
  };

  const getUserStatusColor = (status: EnumUserStatus): string => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "error";
      default:
        return "grey";
    }
  };

  const getEmpStatusColor = (status: EnumEmpStatus): string => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "error";
      default:
        return "grey";
    }
  };

  const getPaymentStatusColor = (status: EnumPaymentStatus): string => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "SUCCEEDED":
        return "success";
      case "FAILED":
        return "error";
      case "CANCELLED":
        return "grey";
      default:
        return "grey";
    }
  };

  const getEventTypeColor = (type: EnumEventType): string => {
    switch (type) {
      case "PAYMENT":
        return "primary";
      case "INFO":
        return "info";
      default:
        return "info";
    }
  };

  const getPermissionTypeColor = (type: EnumPermissionType): string => {
    switch (type) {
      case "ADMIN":
        return "primary";
      case "TECHNICIAN":
        return "warning";
      case "USER":
        return "info";
      default:
        return "grey";
    }
  };

  // ========================================
  // ICON MAPPING FUNCTIONS
  // ========================================

  const getDeviceTypeIcon = (type: EnumDeviceType): string => {
    switch (type) {
      case "WASH":
        return "mdi-car-wash";
      case "DRYING":
        return "mdi-air-filter";
      default:
        return "mdi-help-circle";
    }
  };

  const getDeviceStatusIcon = (status: EnumDeviceStatus): string => {
    switch (status) {
      case "DEPLOYED":
        return "mdi-check-circle";
      case "DISABLED":
        return "mdi-close-circle";
      default:
        return "mdi-help-circle";
    }
  };

  const getPaymentStatusIcon = (status: EnumPaymentStatus): string => {
    switch (status) {
      case "PENDING":
        return "mdi-clock-outline";
      case "SUCCEEDED":
        return "mdi-check-circle";
      case "FAILED":
        return "mdi-alert-circle";
      case "CANCELLED":
        return "mdi-close-circle";
      default:
        return "mdi-help-circle";
    }
  };

  const getPermissionTypeIcon = (type: EnumPermissionType): string => {
    switch (type) {
      case "ADMIN":
        return "mdi-shield-crown";
      case "TECHNICIAN":
        return "mdi-tools";
      case "USER":
        return "mdi-account";
      default:
        return "mdi-help-circle";
    }
  };

  // ========================================
  // FILTER OPTIONS (COMPUTED ARRAYS)
  // ========================================

  const deviceTypeOptions = computed(() => {
    const types: EnumDeviceType[] = ["WASH", "DRYING"];
    return types.map((type) => ({
      label: getDeviceTypeLabel(type),
      value: type,
    }));
  });

  const deviceStatusOptions = computed(() => {
    const statuses: EnumDeviceStatus[] = ["DEPLOYED", "DISABLED"];
    return statuses.map((status) => ({
      label: getDeviceStatusLabel(status),
      value: status,
    }));
  });

  const userStatusOptions = computed(() => {
    const statuses: EnumUserStatus[] = ["ACTIVE", "INACTIVE"];
    return statuses.map((status) => ({
      label: getUserStatusLabel(status),
      value: status,
    }));
  });

  const empStatusOptions = computed(() => {
    const statuses: EnumEmpStatus[] = ["ACTIVE", "INACTIVE"];
    return statuses.map((status) => ({
      label: getEmpStatusLabel(status),
      value: status,
    }));
  });

  const paymentStatusOptions = computed(() => {
    const statuses: EnumPaymentStatus[] = [
      "PENDING",
      "SUCCEEDED",
      "FAILED",
      "CANCELLED",
    ];
    return statuses.map((status) => ({
      label: getPaymentStatusLabel(status),
      value: status,
    }));
  });

  const eventTypeOptions = computed(() => {
    const types: EnumEventType[] = ["PAYMENT", "INFO"];
    return types.map((type) => ({
      label: getEventTypeLabel(type),
      value: type,
    }));
  });

  const permissionTypeOptions = computed(() => {
    const types: EnumPermissionType[] = ["ADMIN", "TECHNICIAN", "USER"];
    return types.map((type) => ({
      label: getPermissionTypeLabel(type),
      value: type,
    }));
  });

  // ========================================
  // REVERSE TRANSLATION FUNCTION
  // ========================================

  const getEnumFromLabel = <T extends string>(
    label: string,
    enumType:
      | "deviceType"
      | "deviceStatus"
      | "userStatus"
      | "empStatus"
      | "paymentStatus"
      | "eventType"
      | "permissionType",
  ): T | null => {
    switch (enumType) {
      case "deviceType": {
        const option = deviceTypeOptions.value.find((opt) => opt.label === label);
        return option ? (option.value as T) : null;
      }
      case "deviceStatus": {
        const option = deviceStatusOptions.value.find((opt) => opt.label === label);
        return option ? (option.value as T) : null;
      }
      case "userStatus": {
        const option = userStatusOptions.value.find((opt) => opt.label === label);
        return option ? (option.value as T) : null;
      }
      case "empStatus": {
        const option = empStatusOptions.value.find((opt) => opt.label === label);
        return option ? (option.value as T) : null;
      }
      case "paymentStatus": {
        const option = paymentStatusOptions.value.find((opt) => opt.label === label);
        return option ? (option.value as T) : null;
      }
      case "eventType": {
        const option = eventTypeOptions.value.find((opt) => opt.label === label);
        return option ? (option.value as T) : null;
      }
      case "permissionType": {
        const option = permissionTypeOptions.value.find((opt) => opt.label === label);
        return option ? (option.value as T) : null;
      }
      default:
        return null;
    }
  };

  // ========================================
  // RETURN OBJECT
  // ========================================

  return {
    // Label functions
    getDeviceTypeLabel,
    getDeviceStatusLabel,
    getUserStatusLabel,
    getEmpStatusLabel,
    getPaymentStatusLabel,
    getEventTypeLabel,
    getPermissionTypeLabel,

    // Color functions
    getDeviceTypeColor,
    getDeviceStatusColor,
    getUserStatusColor,
    getEmpStatusColor,
    getPaymentStatusColor,
    getEventTypeColor,
    getPermissionTypeColor,

    // Icon functions
    getDeviceTypeIcon,
    getDeviceStatusIcon,
    getPaymentStatusIcon,
    getPermissionTypeIcon,

    // Filter options (computed)
    deviceTypeOptions,
    deviceStatusOptions,
    userStatusOptions,
    empStatusOptions,
    paymentStatusOptions,
    eventTypeOptions,
    permissionTypeOptions,

    // Reverse translation
    getEnumFromLabel,
  };
};
