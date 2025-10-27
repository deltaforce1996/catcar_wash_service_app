<template>
  <!-- Device Detail Full Page Dialog -->
  <v-dialog
    v-model="showDialog"
    fullscreen
    transition="dialog-bottom-transition"
  >
    <v-card>
      <v-toolbar color="primary" dark>
        <v-btn icon="mdi-close" @click="closeDialog" />
        <v-toolbar-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-cog</v-icon>
          การตั้งค่าอุปกรณ์ - {{ device?.name }}
        </v-toolbar-title>
        <v-spacer />
      </v-toolbar>

      <v-container class="pa-6">
        <v-row>
          <!-- Device Image and Info Section -->
          <v-col cols="12" lg="4">
            <v-card color="surface-container-low" elevation="3" rounded="lg">
              <v-card-text class="pa-4">
                <!-- Device Image -->
                <div class="text-center mb-4">
                  <v-avatar
                    size="120"
                    color="surface-container-high"
                    class="mb-3"
                  >
                    <v-icon size="60" color="grey-darken-1">
                      {{
                        device?.type === "WASH"
                          ? "mdi-car-wash"
                          : "mdi-air-filter"
                      }}
                    </v-icon>
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold">{{ device?.name }}</h3>
                  <v-chip
                    :color="getDeviceTypeColor(device?.type || '')"
                    size="small"
                    variant="tonal"
                    class="mt-2"
                  >
                    {{ getDeviceTypeLabel(device?.type || "") }}
                  </v-chip>
                </div>

                <!-- Device Status -->
                <v-card flat color="surface-container">
                  <v-card-text class="pa-3">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="font-weight-medium">สถานะ:</span>
                      <v-chip
                        :color="getDeviceStatusColor(device?.status || '')"
                        size="small"
                        variant="tonal"
                      >
                        {{ getDeviceStatusLabel(device?.status || "") }}
                      </v-chip>
                    </div>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="font-weight-medium">รหัสอุปกรณ์:</span>
                      <span class="text-body-2">{{ device?.id }}</span>
                    </div>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="font-weight-medium">เจ้าของ:</span>
                      <span class="text-body-2">{{
                        device?.owner?.fullname || "-"
                      }}</span>
                    </div>
                    <div class="d-flex justify-space-between align-center">
                      <span class="font-weight-medium">ลงทะเบียนโดย:</span>
                      <span class="text-body-2">{{
                        device?.registered_by?.name || "-"
                      }}</span>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Device Management Actions -->
                <v-card flat color="surface-container" class="mt-4">
                  <v-card-text class="pa-3">
                    <div class="font-weight-medium mb-3">
                      <v-icon class="mr-1" size="20">mdi-cog</v-icon>
                      การจัดการอุปกรณ์
                    </div>
                    <div class="d-flex flex-column ga-2">
                      <v-btn
                        color="info"
                        variant="elevated"
                        size="large"
                        @click="handleUpdateFirmware"
                      >
                        <v-icon class="mr-2">mdi-upload</v-icon>
                        อัปเดตเฟิร์มแวร์
                      </v-btn>
                      <v-btn
                        color="warning"
                        variant="elevated"
                        size="large"
                        @click="handleResetConfig"
                      >
                        <v-icon class="mr-2">mdi-restore</v-icon>
                        รีเซ็ตการตั้งค่า
                      </v-btn>
                      <v-btn
                        color="error"
                        variant="elevated"
                        size="large"
                        @click="handleRestart"
                      >
                        <v-icon class="mr-2">mdi-restart</v-icon>
                        รีสตาร์ทอุปกรณ์
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Finance Actions -->
                <v-card flat color="surface-container" class="mt-4">
                  <v-card-text class="pa-3">
                    <div class="font-weight-medium mb-3">
                      <v-icon class="mr-1" size="20">mdi-cash</v-icon>
                      การเงิน
                    </div>
                    <v-btn
                      color="success"
                      variant="elevated"
                      size="large"
                      block
                      @click="handleManualPayment"
                    >
                      <v-icon class="mr-2">mdi-cash-plus</v-icon>
                      เพิ่มการชำระเงินแบบแมนนวล
                    </v-btn>
                  </v-card-text>
                </v-card>

                <!-- Device Description -->
                <!-- <v-card flat color="info" variant="tonal">
                  <v-card-text class="pa-3">
                    <div class="d-flex align-start">
                      <v-icon class="mr-2 mt-1" size="20"
                        >mdi-information</v-icon
                      >
                      <div>
                        <div class="font-weight-medium mb-1">คำอธิบาย</div>
                        <p class="text-body-2 mb-0">
                          {{ getDeviceDescription(device?.type || "") }}
                        </p>
                      </div>
                    </div>
                  </v-card-text>
                </v-card> -->
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Configuration Section with Tabs -->
          <v-col cols="12" lg="8">
            <!-- Device Status Control Card (only in edit mode) -->

            <!-- Tabs Section -->
            <v-card
              color="surface-container-low"
              elevation="3"
              rounded="lg"
              class="d-flex flex-column"
              style="height: calc(100vh - 150px)"
            >
              <v-card-title class="pb-0">
                <div class="d-flex align-center w-100">
                  <v-tabs v-model="currentTab" color="primary">
                    <v-tab value="logging">
                      <v-icon class="mr-2">mdi-file-document-outline</v-icon>
                      บันทึกการใช้งาน
                    </v-tab>
                    <v-tab value="state">
                      <v-icon class="mr-2">mdi-chart-line</v-icon>
                      สถานะระบบ
                    </v-tab>
                    <v-tab value="setup">
                      <v-icon class="mr-2">mdi-cog-outline</v-icon>
                      การตั้งค่า
                    </v-tab>
                  </v-tabs>

                  <v-spacer />

                  <!-- Edit Button in Tabs Bar -->
                  <v-btn
                    v-if="currentTab === 'setup'"
                    :color="isEditMode ? 'warning' : 'primary'"
                    :variant="isEditMode ? 'elevated' : 'outlined'"
                    size="small"
                    class="ml-4"
                    @click="isEditMode ? handleCancel() : enterEditMode()"
                  >
                    <v-icon class="mr-1" size="small">
                      {{ isEditMode ? "mdi-eye" : "mdi-pencil" }}
                    </v-icon>
                    {{ isEditMode ? "ดูอย่างเดียว" : "แก้ไข" }}
                  </v-btn>
                </div>
                <v-divider />
              </v-card-title>

              <v-card-text class="pa-4 overflow-y-auto">
                <v-tabs-window v-model="currentTab">
                  <!-- Setup Tab -->
                  <v-tabs-window-item value="setup">
                    <!-- Edit Mode Toggle -->
                    <v-card variant="text">
                      <v-card-title>
                        <v-icon class="mr-2" color="primary">mdi-power</v-icon>
                        <span>การควบคุมสถานะอุปกรณ์</span>
                      </v-card-title>

                      <v-divider />

                      <v-card-text>
                        <div class="d-flex align-center justify-space-between">
                          <div>
                            <h3 class="text-h6 font-weight-bold mb-1">
                              สถานะการทำงาน
                            </h3>
                            <p class="text-body-2 text-grey-darken-1 mb-0">
                              {{
                                device?.status === "DEPLOYED"
                                  ? "อุปกรณ์กำลังทำงานอยู่และพร้อมให้บริการ"
                                  : "อุปกรณ์หยุดทำงานชั่วคราว"
                              }}
                            </p>
                          </div>

                          <div class="d-flex align-center">
                            <span class="text-body-2 mr-3">
                              {{
                                device?.status === "DEPLOYED"
                                  ? "เปิดใช้งาน"
                                  : "ปิดใช้งาน"
                              }}
                            </span>
                            <v-switch
                              :model-value="device?.status === 'DEPLOYED'"
                              :color="
                                device?.status === 'DEPLOYED'
                                  ? 'success'
                                  : 'error'
                              "
                              hide-details
                              @update:model-value="$emit('toggleStatus')"
                            />
                          </div>
                        </div>

                        <v-alert
                          v-if="device?.status !== 'DEPLOYED'"
                          color="warning"
                          variant="tonal"
                          class="mt-4"
                          density="compact"
                        >
                          <v-icon class="mr-1">mdi-alert</v-icon>
                          เมื่อปิดใช้งาน ลูกค้าจะไม่สามารถใช้บริการอุปกรณ์นี้ได้
                        </v-alert>
                      </v-card-text>
                    </v-card>

                    <v-card variant="text" class="mt-4">
                      <v-card-title>
                        <div class="d-flex align-center">
                          <v-icon class="mr-2" color="primary">mdi-cog</v-icon>
                          <span>การตั้งค่าการขาย</span>
                        </div>
                      </v-card-title>

                      <v-divider />

                      <v-card-text>
                        <v-list class="py-0">
                          <template
                            v-for="(config, key, index) in isEditMode
                              ? editableConfigs
                              : device?.configs.sale"
                            :key="key"
                          >
                            <v-list-item class="py-4 bg-surface-container-low">
                              <template #prepend>
                                <v-avatar
                                  size="40"
                                  color="primary"
                                  variant="tonal"
                                  class="mr-4"
                                >
                                  <v-icon size="20">
                                    {{ getConfigIcon(key) }}
                                  </v-icon>
                                </v-avatar>
                              </template>

                              <v-list-item-title
                                class="text-subtitle-1 font-weight-medium mb-1"
                              >
                                {{ config.description }}
                                <v-chip
                                  size="x-small"
                                  color="on-surface-variant"
                                  variant="tonal"
                                  class="ml-2"
                                >
                                  {{ key }}
                                </v-chip>
                              </v-list-item-title>

                              <v-list-item-subtitle
                                class="text-body-2 text-on-surface-variant"
                              >
                                {{ getConfigDescription(key) }}
                              </v-list-item-subtitle>

                              <template #append>
                                <!-- WASH device display (single value) -->
                                <div
                                  v-if="
                                    device?.type === 'WASH' &&
                                    config.value !== undefined
                                  "
                                  class="d-flex align-center"
                                >
                                  <!-- View Mode -->
                                  <div v-if="!isEditMode" class="text-right">
                                    <div
                                      class="text-h6 font-weight-bold text-primary mb-1"
                                    >
                                      {{ config.value }}
                                      <span
                                        class="text-body-2 text-on-surface-variant"
                                        >{{ config.unit }}</span
                                      >
                                    </div>
                                  </div>

                                  <!-- Edit Mode -->
                                  <div v-else class="d-flex align-center ga-2">
                                    <v-btn
                                      v-if="isConfigChanged(key)"
                                      icon="mdi-restore"
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                      @click="resetSingleConfig(key)"
                                    />
                                    <div class="d-flex align-center">
                                      <v-text-field
                                        v-model.number="
                                          editableConfigs[key].value
                                        "
                                        type="number"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        :color="
                                          isConfigChanged(key)
                                            ? 'warning'
                                            : 'primary'
                                        "
                                        style="width: 70px; flex-shrink: 0"
                                        :aria-label="`${config.description} ค่า หน่วย ${config.unit}`"
                                      />
                                      <span class="mx-2">
                                        {{ config.unit }}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <!-- DRYING device display (range: start-end) -->
                                <div
                                  v-else-if="
                                    device?.type === 'DRYING' &&
                                    config.start !== undefined &&
                                    config.end !== undefined
                                  "
                                  class="d-flex align-center"
                                >
                                  <!-- View Mode -->
                                  <div v-if="!isEditMode" class="text-right">
                                    <div
                                      class="text-h6 font-weight-bold text-info mb-1"
                                    >
                                      {{ config.start }}-{{ config.end }}
                                      <span
                                        class="text-body-2 text-on-surface-variant"
                                        >{{ config.unit }}</span
                                      >
                                    </div>
                                  </div>

                                  <!-- Edit Mode -->
                                  <div v-else class="d-flex align-center ga-2">
                                    <v-btn
                                      v-if="isConfigChanged(key)"
                                      icon="mdi-restore"
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                      style="flex-shrink: 0"
                                      @click="resetSingleConfig(key)"
                                    />
                                    <!-- Placeholder to maintain width when button is hidden -->
                                    <div
                                      class="d-flex flex-column"
                                      style="width: 300px"
                                    >
                                      <div
                                        class="d-flex align-center justify-space-between mb-2"
                                      >
                                        <span
                                          class="text-caption text-on-surface-variant"
                                        >
                                          {{ editableConfigs[key].start }}
                                          {{ config.unit }}
                                        </span>
                                        <span
                                          class="text-caption text-on-surface-variant"
                                        >
                                          {{ editableConfigs[key].end }}
                                          {{ config.unit }}
                                        </span>
                                      </div>
                                      <v-range-slider
                                        :model-value="getRangeModel(key)"
                                        :min="0"
                                        :max="getMaxRangeValue(key)"
                                        :step="1"
                                        :color="
                                          isConfigChanged(key)
                                            ? 'warning'
                                            : 'info'
                                        "
                                        thumb-label="always"
                                        hide-details
                                        density="compact"
                                        @update:model-value="
                                          updateRangeConfig(key, $event)
                                        "
                                      >
                                        <template
                                          #thumb-label="{
                                            modelValue: thumbValue,
                                          }"
                                        >
                                          {{ thumbValue }}
                                        </template>
                                      </v-range-slider>
                                    </div>
                                  </div>
                                </div>
                              </template>
                            </v-list-item>

                            <!-- Change indicator for edit mode -->
                            <div
                              v-if="isEditMode && isConfigChanged(key)"
                              class="px-6 pb-2 bg-surface-container-low"
                            >
                              <v-alert
                                color="warning"
                                variant="tonal"
                                density="compact"
                                class="text-caption"
                              >
                                <v-icon class="mr-1">mdi-information</v-icon>
                                <span v-if="device?.type === 'WASH'">
                                  โปรดกดบันทึก การเปลี่ยนแปลงจาก
                                  {{ originalConfigs[key]?.value }}
                                  {{ originalConfigs[key]?.unit }} เป็น
                                  {{ editableConfigs[key].value }}
                                  {{ editableConfigs[key].unit }}
                                </span>
                                <span v-else-if="device?.type === 'DRYING'">
                                  โปรดกดบันทึก การเปลี่ยนแปลงจาก
                                  {{ originalConfigs[key]?.start }}-{{
                                    originalConfigs[key]?.end
                                  }}
                                  {{ originalConfigs[key]?.unit }} เป็น
                                  {{ editableConfigs[key].start }}-{{
                                    editableConfigs[key].end
                                  }}
                                  {{ editableConfigs[key].unit }}
                                </span>
                              </v-alert>
                            </div>

                            <!-- Divider between items (except last item) -->
                            <v-divider
                              v-if="
                                index <
                                Object.keys(device?.configs.sale || {}).length -
                                  1
                              "
                              class="mx-6"
                            />
                          </template>
                        </v-list>
                      </v-card-text>
                    </v-card>

                    <!-- System Configuration Section -->
                    <v-card variant="text" class="mt-4">
                      <v-card-title>
                        <div class="d-flex align-center">
                          <v-icon class="mr-2" color="info">mdi-chip</v-icon>
                          <span>การตั้งค่าระบบ</span>
                        </div>
                      </v-card-title>

                      <v-divider />

                      <v-card-text>
                        <v-list v-if="device?.configs?.system" class="py-0">
                          <!-- On Time -->
                          <v-list-item
                            v-if="device.configs.system.on_time || isEditMode"
                            class="py-4 bg-surface-container-low"
                          >
                            <template #prepend>
                              <v-avatar
                                size="40"
                                color="info"
                                variant="tonal"
                                class="mr-4"
                              >
                                <v-icon size="20">mdi-clock-start</v-icon>
                              </v-avatar>
                            </template>

                            <v-list-item-title
                              class="text-subtitle-1 font-weight-medium mb-1"
                            >
                              เวลาเปิดทำงาน
                              <v-chip
                                size="x-small"
                                color="on-surface-variant"
                                variant="tonal"
                                class="ml-2"
                              >
                                on_time
                              </v-chip>
                            </v-list-item-title>

                            <v-list-item-subtitle
                              class="text-body-2 text-on-surface-variant"
                            >
                              เวลาที่อุปกรณ์เริ่มทำงานอัตโนมัติ
                            </v-list-item-subtitle>

                            <template #append>
                              <!-- View Mode -->
                              <div v-if="!isEditMode" class="text-right">
                                <div
                                  class="text-h6 font-weight-bold text-info mb-1"
                                >
                                  {{ device.configs.system.on_time }}
                                </div>
                              </div>

                              <!-- Edit Mode -->
                              <div v-else>
                                <v-text-field
                                  v-model="editableSystemConfigs.on_time"
                                  type="time"
                                  variant="outlined"
                                  density="compact"
                                  hide-details
                                  color="info"
                                  style="width: 150px"
                                />
                              </div>
                            </template>
                          </v-list-item>

                          <v-divider
                            v-if="
                              device.configs.system.on_time &&
                              device.configs.system.off_time
                            "
                            class="mx-6"
                          />

                          <!-- Off Time -->
                          <v-list-item
                            v-if="device.configs.system.off_time || isEditMode"
                            class="py-4 bg-surface-container-low"
                          >
                            <template #prepend>
                              <v-avatar
                                size="40"
                                color="info"
                                variant="tonal"
                                class="mr-4"
                              >
                                <v-icon size="20">mdi-clock-end</v-icon>
                              </v-avatar>
                            </template>

                            <v-list-item-title
                              class="text-subtitle-1 font-weight-medium mb-1"
                            >
                              เวลาปิดทำงาน
                              <v-chip
                                size="x-small"
                                color="on-surface-variant"
                                variant="tonal"
                                class="ml-2"
                              >
                                off_time
                              </v-chip>
                            </v-list-item-title>

                            <v-list-item-subtitle
                              class="text-body-2 text-on-surface-variant"
                            >
                              เวลาที่อุปกรณ์หยุดทำงานอัตโนมัติ
                            </v-list-item-subtitle>

                            <template #append>
                              <!-- View Mode -->
                              <div v-if="!isEditMode" class="text-right">
                                <div
                                  class="text-h6 font-weight-bold text-info mb-1"
                                >
                                  {{ device.configs.system.off_time }}
                                </div>
                              </div>

                              <!-- Edit Mode -->
                              <div v-else>
                                <v-text-field
                                  v-model="editableSystemConfigs.off_time"
                                  type="time"
                                  variant="outlined"
                                  density="compact"
                                  hide-details
                                  color="info"
                                  style="width: 150px"
                                />
                              </div>
                            </template>
                          </v-list-item>

                          <v-divider
                            v-if="
                              device.configs.system.off_time &&
                              device.configs.system.save_state !== undefined
                            "
                            class="mx-6"
                          />

                          <!-- Save State -->
                          <v-list-item
                            v-if="
                              device.configs.system.save_state !== undefined ||
                              isEditMode
                            "
                            class="py-4 bg-surface-container-low"
                          >
                            <template #prepend>
                              <v-avatar
                                size="40"
                                color="info"
                                variant="tonal"
                                class="mr-4"
                              >
                                <v-icon size="20">mdi-content-save</v-icon>
                              </v-avatar>
                            </template>

                            <v-list-item-title
                              class="text-subtitle-1 font-weight-medium mb-1"
                            >
                              บันทึกสถานะ
                              <v-chip
                                size="x-small"
                                color="on-surface-variant"
                                variant="tonal"
                                class="ml-2"
                              >
                                save_state
                              </v-chip>
                            </v-list-item-title>

                            <v-list-item-subtitle
                              class="text-body-2 text-on-surface-variant"
                            >
                              บันทึกสถานะการทำงานก่อนปิดเครื่อง
                            </v-list-item-subtitle>

                            <template #append>
                              <!-- View Mode -->
                              <div v-if="!isEditMode" class="text-right">
                                <v-chip
                                  :color="
                                    device.configs.system.save_state
                                      ? 'success'
                                      : 'grey'
                                  "
                                  size="small"
                                  variant="tonal"
                                >
                                  {{
                                    device.configs.system.save_state
                                      ? "เปิด"
                                      : "ปิด"
                                  }}
                                </v-chip>
                              </div>

                              <!-- Edit Mode -->
                              <div v-else>
                                <v-switch
                                  v-model="editableSystemConfigs.save_state"
                                  color="success"
                                  hide-details
                                  density="compact"
                                />
                              </div>
                            </template>
                          </v-list-item>

                          <v-divider
                            v-if="
                              device.configs.system.save_state !== undefined &&
                              device.configs.system.payment_method
                            "
                            class="mx-6"
                          />

                          <!-- Payment Method -->
                          <v-list-item
                            v-if="
                              device.configs.system.payment_method || isEditMode
                            "
                            class="py-4 bg-surface-container-low"
                          >
                            <template #prepend>
                              <v-avatar
                                size="40"
                                color="info"
                                variant="tonal"
                                class="mr-4"
                              >
                                <v-icon size="20">mdi-cash-multiple</v-icon>
                              </v-avatar>
                            </template>

                            <v-list-item-title
                              class="text-subtitle-1 font-weight-medium mb-1"
                            >
                              วิธีการชำระเงิน
                              <v-chip
                                size="x-small"
                                color="on-surface-variant"
                                variant="tonal"
                                class="ml-2"
                              >
                                payment_method
                              </v-chip>
                            </v-list-item-title>

                            <v-list-item-subtitle
                              class="text-body-2 text-on-surface-variant"
                            >
                              ช่องทางการชำระเงินที่รองรับ
                            </v-list-item-subtitle>

                            <template #append>
                              <!-- View Mode -->
                              <div v-if="!isEditMode" class="d-flex ga-2">
                                <v-chip
                                  v-if="
                                    device.configs.system.payment_method?.coin
                                  "
                                  color="success"
                                  size="small"
                                  variant="tonal"
                                >
                                  <v-icon start size="16">mdi-coin</v-icon>
                                  เหรียญ
                                </v-chip>
                                <v-chip
                                  v-if="
                                    device.configs.system.payment_method
                                      ?.bank_note
                                  "
                                  color="success"
                                  size="small"
                                  variant="tonal"
                                >
                                  <v-icon start size="16">mdi-cash</v-icon>
                                  ธนบัตร
                                </v-chip>
                                <v-chip
                                  v-if="
                                    device.configs.system.payment_method
                                      ?.promptpay
                                  "
                                  color="success"
                                  size="small"
                                  variant="tonal"
                                >
                                  <v-icon start size="16">mdi-qrcode</v-icon>
                                  พร้อมเพย์
                                </v-chip>
                              </div>

                              <!-- Edit Mode -->
                              <div v-else class="d-flex flex-column ga-2">
                                <v-checkbox
                                  v-model="editableSystemConfigs.payment_method!.coin"
                                  label="เหรียญ"
                                  color="info"
                                  hide-details
                                  density="compact"
                                />
                                <v-checkbox
                                  v-model="editableSystemConfigs.payment_method!.bank_note"
                                  label="ธนบัตร"
                                  color="info"
                                  hide-details
                                  density="compact"
                                />
                                <v-checkbox
                                  v-model="editableSystemConfigs.payment_method!.promptpay"
                                  label="พร้อมเพย์"
                                  color="info"
                                  hide-details
                                  density="compact"
                                />
                              </div>
                            </template>
                          </v-list-item>
                        </v-list>
                        <div
                          v-else
                          class="text-center py-6 text-on-surface-variant"
                        >
                          <v-icon size="40" class="mb-2">
                            mdi-information-outline
                          </v-icon>
                          <p class="text-body-2">ไม่มีการตั้งค่าระบบ</p>
                        </div>
                      </v-card-text>
                    </v-card>

                    <!-- Pricing Configuration Section -->
                    <v-card variant="text" class="mt-4">
                      <v-card-title>
                        <div class="d-flex align-center">
                          <v-icon class="mr-2" color="success"
                            >mdi-currency-usd</v-icon
                          >
                          <span>การตั้งค่าราคา</span>
                        </div>
                      </v-card-title>

                      <v-divider />

                      <v-card-text>
                        <v-list v-if="device?.configs?.pricing" class="py-0">
                          <template
                            v-for="(config, key, index) in isEditMode
                              ? editablePricingConfigs
                              : device?.configs.pricing"
                            :key="key"
                          >
                            <v-list-item class="py-4 bg-surface-container-low">
                              <template #prepend>
                                <v-avatar
                                  size="40"
                                  color="success"
                                  variant="tonal"
                                  class="mr-4"
                                >
                                  <v-icon size="20">
                                    {{ getConfigIcon(key) }}
                                  </v-icon>
                                </v-avatar>
                              </template>

                              <v-list-item-title
                                class="text-subtitle-1 font-weight-medium mb-1"
                              >
                                {{ config.description }}
                                <v-chip
                                  size="x-small"
                                  color="on-surface-variant"
                                  variant="tonal"
                                  class="ml-2"
                                >
                                  {{ key }}
                                </v-chip>
                              </v-list-item-title>

                              <v-list-item-subtitle
                                class="text-body-2 text-on-surface-variant"
                              >
                                {{ getConfigDescription(key) }}
                              </v-list-item-subtitle>

                              <template #append>
                                <div class="d-flex align-center">
                                  <!-- View Mode -->
                                  <div v-if="!isEditMode" class="text-right">
                                    <div
                                      class="text-h6 font-weight-bold text-success mb-1"
                                    >
                                      {{ config.value }}
                                      <span
                                        class="text-body-2 text-on-surface-variant"
                                        >{{ config.unit }}</span
                                      >
                                    </div>
                                  </div>

                                  <!-- Edit Mode -->
                                  <div
                                    v-else
                                    class="d-flex align-center ga-2"
                                    style="width: 100%"
                                  >
                                    <v-btn
                                      v-if="isPricingConfigChanged(key)"
                                      icon="mdi-restore"
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                      @click="resetPricingConfig(key)"
                                    />
                                    <div class="d-flex align-center">
                                      <v-text-field
                                        v-model.number="
                                          editablePricingConfigs[key].value
                                        "
                                        type="number"
                                        variant="outlined"
                                        density="compact"
                                        hide-details
                                        :color="
                                          isPricingConfigChanged(key)
                                            ? 'warning'
                                            : 'success'
                                        "
                                        style="width: 70px; flex-shrink: 0"
                                        :aria-label="`${config.label} ค่า หน่วย ${config.unit}`"
                                      />
                                      <span class="mx-2">
                                        {{ config.unit }}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </template>
                            </v-list-item>

                            <!-- Change indicator for edit mode -->
                            <div
                              v-if="isEditMode && isPricingConfigChanged(key)"
                              class="px-6 pb-2 bg-surface-container-low"
                            >
                              <v-alert
                                color="warning"
                                variant="tonal"
                                density="compact"
                                class="text-caption"
                              >
                                <v-icon class="mr-1">mdi-information</v-icon>
                                โปรดกดบันทึก การเปลี่ยนแปลงจาก
                                {{ originalPricingConfigs[key]?.value }}
                                {{ originalPricingConfigs[key]?.unit }} เป็น
                                {{ editablePricingConfigs[key].value }}
                                {{ editablePricingConfigs[key].unit }}
                              </v-alert>
                            </div>

                            <!-- Divider between items (except last item) -->
                            <v-divider
                              v-if="
                                index <
                                Object.keys(device?.configs.pricing || {})
                                  .length -
                                  1
                              "
                              class="mx-6"
                            />
                          </template>
                        </v-list>
                        <div
                          v-else
                          class="text-center py-6 text-on-surface-variant"
                        >
                          <v-icon size="40" class="mb-2">
                            mdi-information-outline
                          </v-icon>
                          <p class="text-body-2">ไม่มีการตั้งค่าราคา</p>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-tabs-window-item>

                  <!-- Logging Tab -->
                  <v-tabs-window-item value="logging" class="pa-6">
                    <div class="text-center py-12">
                      <v-icon size="80" color="grey-lighten-1" class="mb-4">
                        mdi-file-document-outline
                      </v-icon>
                      <h3 class="text-h6 text-grey-darken-1 mb-2">
                        บันทึกการใช้งาน
                      </h3>
                      <p class="text-body-2 text-grey-darken-1">
                        ส่วนนี้จะแสดงประวัติการใช้งานอุปกรณ์<br >
                        (อยู่ในระหว่างการพัฒนา)
                      </p>
                    </div>
                  </v-tabs-window-item>

                  <!-- State Tab -->
                  <v-tabs-window-item value="state" class="pa-6">
                    <div class="text-center py-12">
                      <v-icon size="80" color="grey-lighten-1" class="mb-4">
                        mdi-chart-line
                      </v-icon>
                      <h3 class="text-h6 text-grey-darken-1 mb-2">สถานะระบบ</h3>
                      <p class="text-body-2 text-grey-darken-1">
                        ส่วนนี้จะแสดงสถานะการทำงานของอุปกรณ์แบบเรียลไทม์<br >
                        (อยู่ในระหว่างการพัฒนา)
                      </p>
                    </div>
                  </v-tabs-window-item>
                </v-tabs-window>
              </v-card-text>

              <!-- Sticky Bottom Bar (only visible in edit mode) -->
              <v-card-actions
                v-if="isEditMode && currentTab === 'setup'"
                class="pa-4"
                style="
                  position: sticky;
                  bottom: 0;
                  background-color: rgb(var(--v-theme-surface-container-high));
                  border-top: 1px solid
                    rgba(var(--v-border-color), var(--v-border-opacity));
                  z-index: 10;
                "
              >
                <v-alert
                  v-if="hasAnyChanges"
                  color="warning"
                  variant="tonal"
                  density="compact"
                >
                  <v-icon class="mr-2">mdi-alert-circle</v-icon>
                  มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
                </v-alert>
                <v-spacer v-else />

                <v-btn
                  color="error"
                  variant="elevated"
                  size="large"
                  @click="handleCancel"
                >
                  <v-icon class="mr-2">mdi-close</v-icon>
                  ยกเลิก
                </v-btn>

                <v-btn
                  :color="hasAnyChanges ? 'success' : 'grey'"
                  :disabled="!hasAnyChanges"
                  variant="elevated"
                  size="large"
                  @click="$emit('save')"
                >
                  <v-icon class="mr-2">mdi-content-save</v-icon>
                  บันทึก
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>

  <!-- Cancel Confirmation Dialog -->
  <v-dialog v-model="showCancelConfirmDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon color="warning" class="mr-2">mdi-alert-circle</v-icon>
        ยืนยันการยกเลิก
      </v-card-title>

      <v-card-text>
        <p class="text-body-1">
          มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณต้องการยกเลิกหรือไม่?
        </p>
        <v-alert color="warning" variant="tonal" density="compact" class="mt-3">
          <v-icon class="mr-1">mdi-information</v-icon>
          การเปลี่ยนแปลงทั้งหมดจะถูกยกเลิก
        </v-alert>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn color="grey" variant="text" @click="cancelCancelAction">
          กลับไป
        </v-btn>
        <v-btn color="error" variant="elevated" @click="confirmCancel">
          ยืนยันยกเลิก
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Update Firmware Confirmation Dialog -->
  <v-dialog v-model="showUpdateFirmwareDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon color="info" class="mr-2">mdi-upload</v-icon>
        ยืนยันการอัปเดตเฟิร์มแวร์
      </v-card-title>

      <v-card-text>
        <p class="text-body-1">
          คุณต้องการอัปเดตเฟิร์มแวร์สำหรับอุปกรณ์นี้หรือไม่?
        </p>
        <v-alert color="info" variant="tonal" density="compact" class="mt-3">
          <v-icon class="mr-1">mdi-information</v-icon>
          กระบวนการอัปเดตอาจใช้เวลาสักครู่ กรุณาอย่าปิดอุปกรณ์ระหว่างการอัปเดต
        </v-alert>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
          color="grey"
          variant="text"
          :disabled="isUpdatingFirmware"
          @click="showUpdateFirmwareDialog = false"
        >
          ยกเลิก
        </v-btn>
        <v-btn
          color="info"
          variant="elevated"
          :loading="isUpdatingFirmware"
          @click="confirmUpdateFirmware"
        >
          ยืนยัน
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Reset Config Confirmation Dialog -->
  <v-dialog v-model="showResetConfigDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon color="warning" class="mr-2">mdi-restore</v-icon>
        ยืนยันการรีเซ็ตการตั้งค่า
      </v-card-title>

      <v-card-text>
        <p class="text-body-1">
          คุณต้องการรีเซ็ตการตั้งค่าทั้งหมดของอุปกรณ์นี้หรือไม่?
        </p>
        <v-alert color="warning" variant="tonal" density="compact" class="mt-3">
          <v-icon class="mr-1">mdi-alert</v-icon>
          การตั้งค่าทั้งหมดจะถูกรีเซ็ตเป็นค่าเริ่มต้น การกระทำนี้ไม่สามารถย้อนกลับได้
        </v-alert>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
          color="grey"
          variant="text"
          :disabled="isResettingConfig"
          @click="showResetConfigDialog = false"
        >
          ยกเลิก
        </v-btn>
        <v-btn
          color="warning"
          variant="elevated"
          :loading="isResettingConfig"
          @click="confirmResetConfig"
        >
          ยืนยัน
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Restart Confirmation Dialog -->
  <v-dialog v-model="showRestartDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon color="error" class="mr-2">mdi-restart</v-icon>
        ยืนยันการรีสตาร์ทอุปกรณ์
      </v-card-title>

      <v-card-text>
        <p class="text-body-1">
          คุณต้องการรีสตาร์ทอุปกรณ์นี้หรือไม่?
        </p>
        <v-alert color="error" variant="tonal" density="compact" class="mt-3">
          <v-icon class="mr-1">mdi-alert</v-icon>
          อุปกรณ์จะหยุดทำงานชั่วคราวระหว่างการรีสตาร์ท
        </v-alert>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
          color="grey"
          variant="text"
          :disabled="isRestarting"
          @click="showRestartDialog = false"
        >
          ยกเลิก
        </v-btn>
        <v-btn
          color="error"
          variant="elevated"
          :loading="isRestarting"
          @click="confirmRestart"
        >
          ยืนยัน
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Manual Payment Dialog -->
  <v-dialog v-model="showManualPaymentDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon color="success" class="mr-2">mdi-cash-plus</v-icon>
        เพิ่มการชำระเงินแบบแมนนวล
      </v-card-title>

      <v-card-text>
        <p class="text-body-2 mb-4">
          กรุณากรอกจำนวนเงินที่ต้องการเพิ่ม
        </p>
        <v-text-field
          v-model.number="manualPaymentAmount"
          type="number"
          label="จำนวนเงิน"
          variant="outlined"
          density="comfortable"
          prefix="฿"
          :rules="[
            (v) => !!v || 'กรุณากรอกจำนวนเงิน',
            (v) => v > 0 || 'จำนวนเงินต้องมากกว่า 0',
          ]"
        />
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
          color="grey"
          variant="text"
          :disabled="isSendingManualPayment"
          @click="
            showManualPaymentDialog = false;
            manualPaymentAmount = null;
          "
        >
          ยกเลิก
        </v-btn>
        <v-btn
          color="success"
          variant="elevated"
          :disabled="!manualPaymentAmount || manualPaymentAmount <= 0"
          :loading="isSendingManualPayment"
          @click="confirmManualPayment"
        >
          ยืนยัน
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Snackbar for success/error messages -->
  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="5000" top>
    {{ snackbarMessage }}
    <template #actions>
      <v-btn variant="text" @click="snackbar = false">ปิด</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import type {
  DeviceResponseApi,
  DeviceConfig,
} from "~/services/apis/device-api.service";

// Import enum translation composable
const {
  getDeviceTypeLabel,
  getDeviceTypeColor,
  getDeviceStatusLabel,
  getDeviceStatusColor,
} = useEnumTranslation();

// Import device commands composable
const {
  updateFirmware,
  resetConfig,
  restartDevice,
  sendManualPayment,
  isUpdatingFirmware,
  isResettingConfig,
  isRestarting,
  isSendingManualPayment,
  error: commandError,
  successMessage: commandSuccessMessage,
  clearMessages: clearCommandMessages,
} = useDeviceCommands();

interface SystemConfig {
  on_time?: string;
  off_time?: string;
  save_state?: boolean;
  payment_method?: {
    coin?: boolean;
    bank_note?: boolean;
    promptpay?: boolean;
  };
}

interface Props {
  modelValue: boolean;
  device: DeviceResponseApi | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "save" | "toggleStatus"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local state
const isEditMode = ref(false);
const showCancelConfirmDialog = ref(false);
const currentTab = ref("setup");

// Device action dialogs
const showUpdateFirmwareDialog = ref(false);
const showResetConfigDialog = ref(false);
const showRestartDialog = ref(false);
const showManualPaymentDialog = ref(false);
const manualPaymentAmount = ref<number | null>(null);

// Snackbar state
const snackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref<"success" | "error">("success");
const editableConfigs = ref<Record<string, DeviceConfig>>({});
const originalConfigs = ref<Record<string, DeviceConfig>>({});
const editableSystemConfigs = ref<SystemConfig>({});
const originalSystemConfigs = ref<SystemConfig>({});
const editablePricingConfigs = ref<Record<string, DeviceConfig>>({});
const originalPricingConfigs = ref<Record<string, DeviceConfig>>({});

// Computed
const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Unified change detection
const hasAnyChanges = computed(() => {
  const hasSaleChanges = Object.keys(editableConfigs.value).some((key) =>
    isConfigChanged(key)
  );
  const hasSystemChanges = isSystemConfigChanged();
  const hasPricingChanges = Object.keys(editablePricingConfigs.value).some(
    (key) => isPricingConfigChanged(key)
  );
  return hasSaleChanges || hasSystemChanges || hasPricingChanges;
});

const _configChangeCount = computed(() => {
  return Object.keys(editableConfigs.value).filter((key) =>
    isConfigChanged(key)
  ).length;
});

// Prepare save payload - extract only values for sale and pricing configs
const getSavePayload = () => {
  const payload: {
    configs: {
      sale?: Record<string, number>;
      system?: SystemConfig;
      pricing?: Record<string, number>;
    };
  } = { configs: {} };

  // Transform sale configs - extract values based on device type
  const hasSaleChanges = Object.keys(editableConfigs.value).some((key) =>
    isConfigChanged(key)
  );
  if (isEditMode.value && hasSaleChanges) {
    payload.configs.sale = {};
    for (const [key, config] of Object.entries(editableConfigs.value)) {
      // WASH device: extract single value
      if (config.value !== undefined) {
        payload.configs.sale[key] = config.value;
      }
      // DRYING device: extract start and end values
      else if (config.start !== undefined && config.end !== undefined) {
        payload.configs.sale[key] = {
          start: config.start,
          end: config.end,
        };
      }
    }
  }

  // System configs - keep as-is (they already have the correct structure)
  const hasSystemChanges = isSystemConfigChanged();
  if (isEditMode.value && hasSystemChanges) {
    payload.configs.system = editableSystemConfigs.value;
  }

  // Transform pricing configs - extract only values (not unit and description)
  const hasPricingChanges = Object.keys(editablePricingConfigs.value).some(
    (key) => isPricingConfigChanged(key)
  );
  if (isEditMode.value && hasPricingChanges) {
    payload.configs.pricing = {};
    for (const [key, config] of Object.entries(editablePricingConfigs.value)) {
      payload.configs.pricing[key] = config.value;
    }
  }

  return payload;
};

// Methods
const closeDialog = () => {
  showDialog.value = false;
  isEditMode.value = false;
  showCancelConfirmDialog.value = false;
  currentTab.value = "setup";
  editableConfigs.value = {};
  originalConfigs.value = {};
  editableSystemConfigs.value = {};
  originalSystemConfigs.value = {};
  editablePricingConfigs.value = {};
  originalPricingConfigs.value = {};
};

// Unified edit mode management
const enterEditMode = () => {
  isEditMode.value = true;

  // Initialize sale configs
  if (props.device?.configs?.sale) {
    const saleConfigsCopy = JSON.parse(
      JSON.stringify(props.device.configs.sale)
    );
    originalConfigs.value = JSON.parse(JSON.stringify(saleConfigsCopy));
    editableConfigs.value = saleConfigsCopy;
  }

  // Initialize system configs
  if (props.device?.configs?.system) {
    const systemConfigsCopy = JSON.parse(
      JSON.stringify(props.device.configs.system)
    );
    originalSystemConfigs.value = JSON.parse(JSON.stringify(systemConfigsCopy));
    editableSystemConfigs.value = systemConfigsCopy;
  }

  // Initialize pricing configs
  if (props.device?.configs?.pricing) {
    const pricingConfigsCopy = JSON.parse(
      JSON.stringify(props.device.configs.pricing)
    );
    originalPricingConfigs.value = JSON.parse(
      JSON.stringify(pricingConfigsCopy)
    );
    editablePricingConfigs.value = pricingConfigsCopy;
  }
};

const exitEditMode = () => {
  isEditMode.value = false;
  // Reset to original configs (discard changes)
  if (Object.keys(originalConfigs.value).length > 0) {
    editableConfigs.value = JSON.parse(JSON.stringify(originalConfigs.value));
  }
  if (Object.keys(originalSystemConfigs.value).length > 0) {
    editableSystemConfigs.value = JSON.parse(
      JSON.stringify(originalSystemConfigs.value)
    );
  }
  if (Object.keys(originalPricingConfigs.value).length > 0) {
    editablePricingConfigs.value = JSON.parse(
      JSON.stringify(originalPricingConfigs.value)
    );
  }
};

const handleCancel = () => {
  if (hasAnyChanges.value) {
    // Show confirmation dialog if there are changes
    showCancelConfirmDialog.value = true;
  } else {
    // No changes, just exit edit mode
    exitEditMode();
  }
};

const confirmCancel = () => {
  showCancelConfirmDialog.value = false;
  exitEditMode();
};

const cancelCancelAction = () => {
  showCancelConfirmDialog.value = false;
};

// Device action handlers
const handleUpdateFirmware = () => {
  showUpdateFirmwareDialog.value = true;
};

const confirmUpdateFirmware = async () => {
  if (!props.device?.id) return;

  try {
    clearCommandMessages();
    await updateFirmware(props.device.id);

    snackbarMessage.value = commandSuccessMessage.value || "อัพเดทเฟิร์มแวร์สำเร็จ";
    snackbarColor.value = "success";
    snackbar.value = true;
  } catch (_error) {
    snackbarMessage.value = commandError.value || "ไม่สามารถอัพเดทเฟิร์มแวร์ได้";
    snackbarColor.value = "error";
    snackbar.value = true;
  } finally {
    showUpdateFirmwareDialog.value = false;
  }
};

const handleResetConfig = () => {
  showResetConfigDialog.value = true;
};

const confirmResetConfig = async () => {
  if (!props.device?.id) return;

  try {
    clearCommandMessages();
    await resetConfig(props.device.id);

    snackbarMessage.value = commandSuccessMessage.value || "รีเซ็ตการตั้งค่าสำเร็จ";
    snackbarColor.value = "success";
    snackbar.value = true;

    // Emit event to parent to refresh device data
    emit("update:modelValue", false);
  } catch (_error) {
    snackbarMessage.value = commandError.value || "ไม่สามารถรีเซ็ตการตั้งค่าได้";
    snackbarColor.value = "error";
    snackbar.value = true;
  } finally {
    showResetConfigDialog.value = false;
  }
};

const handleRestart = () => {
  showRestartDialog.value = true;
};

const confirmRestart = async () => {
  if (!props.device?.id) return;

  try {
    clearCommandMessages();
    await restartDevice(props.device.id, { delay_seconds: 5 });

    snackbarMessage.value = commandSuccessMessage.value || "รีสตาร์ทอุปกรณ์สำเร็จ";
    snackbarColor.value = "success";
    snackbar.value = true;
  } catch (_error) {
    snackbarMessage.value = commandError.value || "ไม่สามารถรีสตาร์ทอุปกรณ์ได้";
    snackbarColor.value = "error";
    snackbar.value = true;
  } finally {
    showRestartDialog.value = false;
  }
};

const handleManualPayment = () => {
  manualPaymentAmount.value = null;
  showManualPaymentDialog.value = true;
};

const confirmManualPayment = async () => {
  if (!props.device?.id || !manualPaymentAmount.value || manualPaymentAmount.value <= 0) {
    return;
  }

  try {
    clearCommandMessages();
    await sendManualPayment(props.device.id, { amount: manualPaymentAmount.value });

    snackbarMessage.value = commandSuccessMessage.value || "ส่งการชำระเงินแบบแมนนวลสำเร็จ";
    snackbarColor.value = "success";
    snackbar.value = true;
  } catch (_error) {
    snackbarMessage.value = commandError.value || "ไม่สามารถส่งการชำระเงินแบบแมนนวลได้";
    snackbarColor.value = "error";
    snackbar.value = true;
  } finally {
    showManualPaymentDialog.value = false;
    manualPaymentAmount.value = null;
  }
};

const resetSingleConfig = (key: string) => {
  if (originalConfigs.value[key]) {
    editableConfigs.value[key] = JSON.parse(
      JSON.stringify(originalConfigs.value[key])
    );
  }
};

// Helper methods for range slider (DRYING device)
const getRangeModel = (key: string) => {
  const config = editableConfigs.value[key];
  if (config?.start !== undefined && config?.end !== undefined) {
    return [config.start, config.end];
  }
  return [0, 100];
};

const getMaxRangeValue = (_key: string) => {
  // Use work_period from pricing config as max value, fallback to 1000
  const workPeriod = props.device?.configs?.pricing?.work_period?.value;
  return workPeriod ?? 1000;
};

const updateRangeConfig = (key: string, value: number[]) => {
  if (editableConfigs.value[key]) {
    editableConfigs.value[key].start = value[0];
    editableConfigs.value[key].end = value[1];
  }
};

const resetPricingConfig = (key: string) => {
  if (originalPricingConfigs.value[key]) {
    editablePricingConfigs.value[key] = JSON.parse(
      JSON.stringify(originalPricingConfigs.value[key])
    );
  }
};

const _resetSystemConfigs = () => {
  editableSystemConfigs.value = JSON.parse(
    JSON.stringify(originalSystemConfigs.value)
  );
};

const isConfigChanged = (key: string) => {
  const original = originalConfigs.value[key];
  const editable = editableConfigs.value[key];

  if (!original || !editable) return false;

  // Check for DRYING device (start-end range) - check this first
  if (
    original.start !== undefined &&
    original.end !== undefined &&
    editable.start !== undefined &&
    editable.end !== undefined
  ) {
    return original.start !== editable.start || original.end !== editable.end;
  }

  // Check for WASH device (single value)
  if (original.value !== undefined && editable.value !== undefined) {
    return original.value !== editable.value;
  }

  return false;
};

const isPricingConfigChanged = (key: string) => {
  return (
    originalPricingConfigs.value[key]?.value !==
    editablePricingConfigs.value[key]?.value
  );
};

const isSystemConfigChanged = () => {
  return (
    JSON.stringify(originalSystemConfigs.value) !==
    JSON.stringify(editableSystemConfigs.value)
  );
};

const _getDeviceDescription = (type: string) => {
  switch (type) {
    case "WASH":
      return "เครื่องล้างรถอัตโนมัติที่มีระบบฉีดน้ำแรงดันสูง ระบบฟองสบู่ และการล้างด้วยแปรง นำมาใช้สำหรับทำความสะอาดรถยนต์และรถจักรยานยนต์อย่างมีประสิทธิภาพ";
    case "DRYING":
      return "เครื่องอบแห้งและฆ่าเชื้อโรคด้วยแสง UV และโอโซน เหมาะสำหรับการทำความสะอาดและฆ่าเชื้อโรคบนหมวกกันน็อค อุปกรณ์ป้องกัน และสิ่งของต่างๆ";
    default:
      return "อุปกรณ์สำหรับบริการล้างและทำความสะอาด";
  }
};

const getConfigIcon = (configKey: string) => {
  switch (configKey.toLowerCase()) {
    case "price":
    case "cost":
      return "mdi-cash";
    case "time":
    case "duration":
      return "mdi-clock-outline";
    case "water":
    case "pressure":
      return "mdi-water";
    case "temperature":
    case "temp":
      return "mdi-thermometer";
    case "speed":
    case "rpm":
      return "mdi-speedometer";
    case "power":
    case "watt":
      return "mdi-flash";
    default:
      return "mdi-cog";
  }
};

const getConfigDescription = (configKey: string) => {
  switch (configKey.toLowerCase()) {
    case "price":
      return "ค่าบริการต่อการใช้งานหนึ่งครั้ง";
    case "cost":
      return "ราคาบริการที่เรียกเก็บจากลูกค้า";
    case "time":
      return "ระยะเวลาที่ใช้ในการให้บริการ";
    case "duration":
      return "ความยาวของรอบการทำงาน";
    case "water":
      return "ปริมาณน้ำที่ใช้ในกระบวนการล้าง";
    case "pressure":
      return "แรงดันของน้ำที่ใช้ในการล้าง";
    case "temperature":
      return "อุณหภูมิของน้ำที่ใช้ในกระบวนการ";
    case "speed":
      return "ความเร็วในการหมุนของแปรงหรือเครื่องจักร";
    case "power":
      return "กำลังไฟฟ้าที่ใช้ในการทำงาน";
    default:
      return "การตั้งค่าสำหรับการทำงานของอุปกรณ์";
  }
};

// Watch for device changes to initialize configs
watch(
  () => props.device,
  (newDevice) => {
    // Initialize sale configs
    if (newDevice?.configs?.sale) {
      originalConfigs.value = JSON.parse(
        JSON.stringify(newDevice.configs.sale)
      );
      editableConfigs.value = JSON.parse(
        JSON.stringify(newDevice.configs.sale)
      );
    }
    // Initialize system configs
    if (newDevice?.configs?.system) {
      originalSystemConfigs.value = JSON.parse(
        JSON.stringify(newDevice.configs.system)
      );
      editableSystemConfigs.value = JSON.parse(
        JSON.stringify(newDevice.configs.system)
      );
    }
    // Initialize pricing configs
    if (newDevice?.configs?.pricing) {
      originalPricingConfigs.value = JSON.parse(
        JSON.stringify(newDevice.configs.pricing)
      );
      editablePricingConfigs.value = JSON.parse(
        JSON.stringify(newDevice.configs.pricing)
      );
    }
  },
  { immediate: true }
);

// Watch for dialog close to reset edit mode and discard changes
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      // Reset to view mode when dialog closes
      isEditMode.value = false;
      showCancelConfirmDialog.value = false;
      currentTab.value = "setup";

      // Discard any unsaved changes by resetting to original configs
      if (Object.keys(originalConfigs.value).length > 0) {
        editableConfigs.value = JSON.parse(
          JSON.stringify(originalConfigs.value)
        );
      } else {
        editableConfigs.value = {};
      }

      if (Object.keys(originalSystemConfigs.value).length > 0) {
        editableSystemConfigs.value = JSON.parse(
          JSON.stringify(originalSystemConfigs.value)
        );
      } else {
        editableSystemConfigs.value = {};
      }

      if (Object.keys(originalPricingConfigs.value).length > 0) {
        editablePricingConfigs.value = JSON.parse(
          JSON.stringify(originalPricingConfigs.value)
        );
      } else {
        editablePricingConfigs.value = {};
      }
    }
  }
);

// Method to reset all edit modes back to view mode
const resetToViewMode = () => {
  exitEditMode();
};

// Expose methods for parent component
defineExpose({
  getSavePayload,
  resetToViewMode,
});
</script>
