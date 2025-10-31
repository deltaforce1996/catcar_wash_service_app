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

                  <!-- Device Name - View Mode -->
                  <div
                    v-if="!isEditingName"
                    class="d-flex align-center justify-center mb-2"
                  >
                    <h3 class="text-h5 font-weight-bold">{{ device?.name }}</h3>
                    <v-btn
                      icon="mdi-pencil"
                      size="x-small"
                      variant="text"
                      color="primary"
                      class="ml-2"
                      @click="startEditingName"
                    />
                  </div>

                  <!-- Device Name - Edit Mode -->
                  <div v-else class="mb-2">
                    <v-text-field
                      v-model="editableName"
                      variant="outlined"
                      density="compact"
                      hide-details="auto"
                      :rules="[(v) => !!v || 'กรุณากรอกชื่ออุปกรณ์']"
                      autofocus
                      placeholder="ชื่ออุปกรณ์"
                      class="mb-2"
                    />
                    <div class="d-flex justify-center ga-2">
                      <v-btn
                        color="grey"
                        variant="outlined"
                        size="small"
                        @click="cancelNameEdit"
                      >
                        <v-icon class="mr-1">mdi-close</v-icon>
                        ยกเลิก
                      </v-btn>
                      <v-btn
                        color="success"
                        variant="elevated"
                        size="small"
                        :disabled="!editableName || editableName.trim() === ''"
                        :loading="isUpdatingDevice"
                        @click="saveDeviceName"
                      >
                        <v-icon class="mr-1">mdi-check</v-icon>
                        บันทึก
                      </v-btn>
                    </div>
                  </div>

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

                <!-- Last Online Card -->
                <v-card flat color="surface-container" class="mt-4">
                  <v-card-text class="pa-3">
                    <div class="font-weight-medium mb-3">
                      <v-icon class="mr-1" size="20">mdi-wifi</v-icon>
                      การเชื่อมต่อ
                    </div>

                    <!-- Online Status -->
                    <div class="mb-3">
                      <v-chip
                        :color="getLastOnlineStatus(device).color"
                        variant="tonal"
                        size="default"
                        class="font-weight-medium"
                      >
                        <v-icon
                          :icon="isOffline(device) ? 'mdi-wifi-off' : 'mdi-wifi'"
                          class="mr-1"
                        />
                        {{ getLastOnlineStatus(device).text }}
                      </v-chip>
                    </div>

                    <!-- Last Online Timestamp -->
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-body-2 text-medium-emphasis">
                        เวลาล่าสุด:
                      </span>
                      <span class="text-body-2 font-weight-medium">
                        {{
                          device?.last_state?.state_data?.datetime
                            ? new Date(
                                device.last_state.state_data.datetime
                              ).toLocaleString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "ไม่มีข้อมูล"
                        }}
                      </span>
                    </div>

                    <!-- Time Ago -->
                    <div class="d-flex justify-space-between align-center">
                      <span class="text-body-2 text-medium-emphasis">
                        ระยะเวลา:
                      </span>
                      <span class="text-body-2 font-weight-medium">
                        {{
                          getLastTimestampMs(device)
                            ? formatTimeAgoTh(
                                getLastTimestampMs(device)!,
                                Date.now()
                              )
                            : "ไม่ทราบ"
                        }}
                      </span>
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
                        v-if="!isUser"
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
                  <!-- State Tab -->
                  <v-tabs-window-item value="state">
                    <EnhancedDataTable
                      title="บันทึกสถานะระบบ"
                      :items="deviceStates"
                      :headers="stateHeaders"
                      :loading="isLoadingStates"
                      :has-filter-changes="false"
                      :show-filter-actions="false"
                      :show-filters="false"
                      :total-items="totalStates"
                      :total-pages="stateTotalPages"
                      :page="statePage"
                      :items-per-page="stateItemsPerPage"
                      :expandable="true"
                      :selectable="false"
                      card-class="elevation-0"
                      @update:page="handleStatePageChange"
                    >
                      <!-- State At Column -->
                      <template #[`item.state_data.state_at`]="{ item }">
                        <div class="text-body-2">
                          {{ item.state_data?.state_at || "-" }}
                        </div>
                      </template>

                      <!-- Status Column -->
                      <template #[`item.state_data.status`]="{ item }">
                        <v-chip
                          v-if="item.state_data?.status"
                          :color="getStatusColor(item.state_data.status)"
                          size="small"
                          variant="tonal"
                        >
                          {{ getStatusLabel(item.state_data.status) }}
                        </v-chip>
                        <span v-else class="text-body-2">-</span>
                      </template>

                      <!-- Expanded Content with v-treeview -->
                      <template #expanded-content="{ item }">
                        <div class="pa-4">
                          <h4 class="text-subtitle-2 font-weight-bold mb-4">
                            ข้อมูลสถานะระบบแบบเต็ม
                          </h4>
                          <v-treeview
                            v-if="
                              item.state_data &&
                              Object.keys(item.state_data).length > 0
                            "
                            :items="buildTreeItems(item.state_data)"
                            item-value="id"
                            item-title="title"
                            density="compact"
                            open-all
                          />
                          <div
                            v-else
                            class="text-body-2 text-medium-emphasis py-4"
                          >
                            ไม่มีข้อมูลสถานะ
                          </div>
                        </div>
                      </template>
                    </EnhancedDataTable>

                    <!-- Error Alert -->
                    <v-alert
                      v-if="statesError"
                      type="error"
                      variant="tonal"
                      class="ma-4"
                    >
                      {{ statesError }}
                    </v-alert>

                    <!-- Empty State -->
                    <div
                      v-if="
                        !isLoadingStates &&
                        deviceStates.length === 0 &&
                        !statesError
                      "
                      class="text-center py-12"
                    >
                      <v-icon size="80" color="grey-lighten-1" class="mb-4">
                        mdi-information-outline
                      </v-icon>
                      <h3 class="text-h6 text-grey-darken-1 mb-2">
                        ไม่พบข้อมูลสถานะระบบ
                      </h3>
                      <p class="text-body-2 text-grey-darken-1">
                        ยังไม่มีบันทึกสถานะการทำงานของอุปกรณ์นี้
                      </p>
                    </div>
                  </v-tabs-window-item>

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
                                (isEditMode
                                  ? editableStatus
                                  : device?.status) === "DEPLOYED"
                                  ? "เปิดใช้งาน"
                                  : "ปิดใช้งาน"
                              }}
                            </span>
                            <v-switch
                              v-model="editableStatus"
                              true-value="DEPLOYED"
                              false-value="DISABLED"
                              :color="
                                editableStatus === 'DEPLOYED'
                                  ? 'success'
                                  : 'error'
                              "
                              :disabled="!isEditMode"
                              hide-details
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

                        <v-alert
                          v-if="isEditMode && isStatusChanged()"
                          color="warning"
                          variant="tonal"
                          class="mt-4"
                          density="compact"
                        >
                          <v-icon class="mr-1">mdi-information</v-icon>
                          โปรดกดบันทึก การเปลี่ยนแปลงสถานะจาก
                          {{ getDeviceStatusLabel(originalStatus) }} เป็น
                          {{ getDeviceStatusLabel(editableStatus) }}
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

        <!-- Firmware Version Selector -->
        <v-select
          v-model="selectedFirmwareVersion"
          :items="availableFirmwareVersions"
          :loading="isLoadingFirmwareVersions"
          label="เวอร์ชันเฟิร์มแวร์"
          hint="เลือกเวอร์ชันเฟิร์มแวร์ที่ต้องการอัปเดต (เว้นว่างเพื่อใช้เวอร์ชันล่าสุด)"
          persistent-hint
          clearable
          variant="outlined"
          density="compact"
          class="mt-4"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps">
              <template #append>
                <v-chip
                  v-if="item.index === 0"
                  color="primary"
                  variant="tonal"
                  size="x-small"
                >
                  ล่าสุด
                </v-chip>
              </template>
            </v-list-item>
          </template>
          <template #selection="{ item }">
            <span>v{{ item.value }}</span>
            <v-chip
              v-if="item.index === 0"
              color="primary"
              variant="tonal"
              size="x-small"
              class="ml-2"
            >
              ล่าสุด
            </v-chip>
          </template>
        </v-select>

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
          การตั้งค่าทั้งหมดจะถูกรีเซ็ตเป็นค่าเริ่มต้น
          การกระทำนี้ไม่สามารถย้อนกลับได้
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
        <p class="text-body-1">คุณต้องการรีสตาร์ทอุปกรณ์นี้หรือไม่?</p>
        <v-alert color="warning" variant="tonal" density="compact" class="mt-3">
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
        <p class="text-body-2 mb-4">กรุณากรอกจำนวนเงินที่ต้องการเพิ่ม</p>
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

  <!-- Result Dialog (Success/Error) -->
  <v-dialog v-model="showResultDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon
          :color="resultDialogType === 'success' ? 'success' : 'error'"
          class="mr-2"
        >
          {{
            resultDialogType === "success"
              ? "mdi-check-circle"
              : "mdi-alert-circle"
          }}
        </v-icon>
        {{ resultDialogTitle }}
      </v-card-title>

      <v-card-text>
        <v-alert
          :color="resultDialogType === 'success' ? 'success' : 'error'"
          variant="tonal"
          density="comfortable"
        >
          {{ resultDialogMessage }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
          color="primary"
          variant="elevated"
          @click="showResultDialog = false"
        >
          ตกลง
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type {
  DeviceResponseApi,
  DeviceConfig,
} from "~/services/apis/device-api.service";
import EnhancedDataTable from "~/components/common/EnhancedDataTable.vue";
import {
  getLastTimestampMs,
  formatTimeAgoTh,
  isOffline,
  getLastOnlineStatus,
} from "~/utils/device-utils";

// Import firmware composable
const {
  carwashVersions,
  helmetVersions,
  isLoadingCarwashVersions,
  isLoadingHelmetVersions,
  getAllCarwashVersions,
  getAllHelmetVersions,
} = useFirmware();

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

// Import device composable for updating device basic info
const {
  updateDeviceBasic,
  isUpdating: isUpdatingDevice,
  error: _deviceError,
  successMessage: _deviceSuccessMessage,
  clearMessages: clearDeviceMessages,
} = useDevice();

// Import device states composable
const {
  deviceStates,
  totalStates,
  totalPages: stateTotalPages,
  isSearching: isLoadingStates,
  error: statesError,
  searchDeviceStates,
  resetState: resetDeviceStates,
} = useDeviceStates();

// Import auth composable to check user permissions
const { isUser } = useAuth();

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
  (e: "deviceUpdated", device: DeviceResponseApi): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local state
const isEditMode = ref(false);
const showCancelConfirmDialog = ref(false);
const currentTab = ref("setup");

// Name editing state
const isEditingName = ref(false);
const editableName = ref("");
const originalName = ref("");

// Device action dialogs
const showUpdateFirmwareDialog = ref(false);
const showResetConfigDialog = ref(false);
const showRestartDialog = ref(false);
const showManualPaymentDialog = ref(false);
const manualPaymentAmount = ref<number | null>(null);

// Result dialog state
const showResultDialog = ref(false);
const resultDialogType = ref<'success' | 'error'>('success');
const resultDialogTitle = ref('');
const resultDialogMessage = ref('');

// Firmware update state
const selectedFirmwareVersion = ref<string | undefined>(undefined);

// Device states pagination and display
const statePage = ref(1);
const stateItemsPerPage = ref(10);
const stateHeaders = [
  { title: "เวลา", key: "state_data.datetime", sortable: false },
  { title: "สถานะ", key: "state_data.status", sortable: false },
];

// Status editing state
const editableStatus = ref<string>("");
const originalStatus = ref<string>("");

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

// Firmware versions based on device type
const availableFirmwareVersions = computed(() => {
  if (!props.device) return [];
  // WASH devices use carwash firmware, DRYING devices use helmet firmware
  return props.device.type === "WASH"
    ? carwashVersions.value
    : helmetVersions.value;
});

const isLoadingFirmwareVersions = computed(() => {
  if (!props.device) return false;
  return props.device.type === "WASH"
    ? isLoadingCarwashVersions.value
    : isLoadingHelmetVersions.value;
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
  const hasStatusChange = isStatusChanged();
  return (
    hasSaleChanges || hasSystemChanges || hasPricingChanges || hasStatusChange
  );
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

// Get status change payload - always return current status from switch
const getStatusChangePayload = () => {
  return { status: editableStatus.value };
};

// Methods
const closeDialog = () => {
  showDialog.value = false;
  isEditMode.value = false;
  showCancelConfirmDialog.value = false;
  currentTab.value = "setup";

  // Reset name editing state
  isEditingName.value = false;
  editableName.value = "";
  originalName.value = "";

  // Reset status state
  editableStatus.value = "";
  originalStatus.value = "";

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

  // Initialize status
  if (props.device?.status) {
    originalStatus.value = props.device.status;
    editableStatus.value = props.device.status;
  }

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

  // Reset status
  editableStatus.value = originalStatus.value;

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

// Name editing handlers
const startEditingName = () => {
  if (!props.device?.name) return;
  originalName.value = props.device.name;
  editableName.value = props.device.name;
  isEditingName.value = true;
};

const cancelNameEdit = () => {
  editableName.value = originalName.value;
  isEditingName.value = false;
};

const saveDeviceName = async () => {
  if (
    !props.device?.id ||
    !editableName.value ||
    editableName.value.trim() === ""
  ) {
    return;
  }

  try {
    clearDeviceMessages();
    const updatedDevice = await updateDeviceBasic(props.device.id, {
      name: editableName.value.trim(),
    });

    isEditingName.value = false;

    // Emit event to parent with updated device data
    if (updatedDevice) {
      emit("deviceUpdated", updatedDevice);
    }
  } catch {
    // Error handling - errors will be handled by parent component
  }
};

// Device action handlers
const handleUpdateFirmware = async () => {
  if (!props.device) return;

  // Reset selected version
  selectedFirmwareVersion.value = undefined;

  // Open dialog immediately for better UX
  showUpdateFirmwareDialog.value = true;

  // Load firmware versions based on device type
  // The v-select will show loading state while fetching
  if (props.device.type === "WASH") {
    await getAllCarwashVersions();
  } else {
    await getAllHelmetVersions();
  }
};

const confirmUpdateFirmware = async () => {
  if (!props.device?.id) return;

  try {
    clearCommandMessages();
    // Pass selected version to updateFirmware (undefined means use latest)
    await updateFirmware(props.device.id, selectedFirmwareVersion.value);

    // Close confirmation dialog
    showUpdateFirmwareDialog.value = false;

    // Show result dialog
    if (commandSuccessMessage.value) {
      showResult("success", "อัปเดตเฟิร์มแวร์สำเร็จ", commandSuccessMessage.value);
    }
  } catch {
    // Close confirmation dialog
    showUpdateFirmwareDialog.value = false;

    // Show error result dialog
    if (commandError.value) {
      showResult("error", "อัปเดตเฟิร์มแวร์ไม่สำเร็จ", commandError.value);
    }
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

    // Close confirmation dialog
    showResetConfigDialog.value = false;

    // Show result dialog
    if (commandSuccessMessage.value) {
      showResult("success", "รีเซ็ตการตั้งค่าสำเร็จ", commandSuccessMessage.value);
    }
  } catch {
    // Close confirmation dialog
    showResetConfigDialog.value = false;

    // Show error result dialog
    if (commandError.value) {
      showResult("error", "รีเซ็ตการตั้งค่าไม่สำเร็จ", commandError.value);
    }
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

    // Close confirmation dialog
    showRestartDialog.value = false;

    // Show result dialog
    if (commandSuccessMessage.value) {
      showResult("success", "รีสตาร์ทอุปกรณ์สำเร็จ", commandSuccessMessage.value);
    }
  } catch {
    // Close confirmation dialog
    showRestartDialog.value = false;

    // Show error result dialog
    if (commandError.value) {
      showResult("error", "รีสตาร์ทอุปกรณ์ไม่สำเร็จ", commandError.value);
    }
  }
};

const handleManualPayment = () => {
  manualPaymentAmount.value = null;
  showManualPaymentDialog.value = true;
};

const confirmManualPayment = async () => {
  if (
    !props.device?.id ||
    !manualPaymentAmount.value ||
    manualPaymentAmount.value <= 0
  ) {
    return;
  }

  try {
    clearCommandMessages();
    await sendManualPayment(props.device.id, {
      amount: manualPaymentAmount.value,
    });

    // Close confirmation dialog
    showManualPaymentDialog.value = false;
    manualPaymentAmount.value = null;

    // Show result dialog
    if (commandSuccessMessage.value) {
      showResult(
        "success",
        "เพิ่มการชำระเงินแบบแมนนวลสำเร็จ",
        commandSuccessMessage.value
      );
    }
  } catch {
    // Close confirmation dialog
    showManualPaymentDialog.value = false;
    manualPaymentAmount.value = null;

    // Show error result dialog
    if (commandError.value) {
      showResult(
        "error",
        "เพิ่มการชำระเงินแบบแมนนวลไม่สำเร็จ",
        commandError.value
      );
    }
  }
};

// Helper function to show result dialog
const showResult = (
  type: "success" | "error",
  title: string,
  message: string
) => {
  resultDialogType.value = type;
  resultDialogTitle.value = title;
  resultDialogMessage.value = message;
  showResultDialog.value = true;
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

const isStatusChanged = () => {
  return originalStatus.value !== editableStatus.value;
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

// Device States Helper Functions
const buildTreeItems = (obj: any, parentId = ""): any[] => {
  if (!obj || typeof obj !== "object") return [];

  return Object.entries(obj).map(([key, value]) => {
    const id = parentId ? `${parentId}-${key}` : key;
    const item: any = {
      id,
      title: `${key}: ${formatTreeValue(value)}`,
      value: id,
    };

    if (value && typeof value === "object" && !Array.isArray(value)) {
      item.children = buildTreeItems(value, id);
    }

    return item;
  });
};

const formatTreeValue = (value: unknown): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") {
    if (Array.isArray(value)) return `[${value.length} items]`;
    return `{${Object.keys(value).length} properties}`;
  }
  return String(value);
};

const loadDeviceStates = async () => {
  if (!props.device?.id) return;

  await searchDeviceStates({
    query: { device_id: props.device.id },
    page: statePage.value,
    limit: stateItemsPerPage.value,
    sort_by: "created_at",
    sort_order: "desc",
  });
};

const handleStatePageChange = async (newPage: number) => {
  statePage.value = newPage;
  await loadDeviceStates();
};

const getStatusColor = (status: string) => {
  return status === "normal" ? "success" : "error";
};

const getStatusLabel = (status: string) => {
  return status?.toLowerCase() === "normal" ? "ปกติ" : "ผิดพลาด";
};

// Watch for device changes to initialize configs
watch(
  () => props.device,
  (newDevice) => {
    // Initialize status
    if (newDevice?.status) {
      originalStatus.value = newDevice.status;
      editableStatus.value = newDevice.status;
    }
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

      // Reset name editing state
      isEditingName.value = false;
      editableName.value = "";
      originalName.value = "";

      // Reset status state
      editableStatus.value = originalStatus.value || "";

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

      // Reset device states
      resetDeviceStates();
      statePage.value = 1;
    }
  }
);

// Watch for tab changes to load device states
watch(currentTab, async (newTab) => {
  if (newTab === "state" && props.device?.id) {
    await loadDeviceStates();
  }
});

// Method to reset all edit modes back to view mode
const resetToViewMode = () => {
  exitEditMode();
};

// Expose methods for parent component
defineExpose({
  getSavePayload,
  getStatusChangePayload,
  resetToViewMode,
});
</script>
