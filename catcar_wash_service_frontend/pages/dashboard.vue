<template>
  <div>
    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center flex-wrap mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">แดชบอร์ดยอดขาย</h1>
      </div>
      <div class="d-flex align-center ga-3 flex-wrap">
        <!-- Date Range Quick Select (Only for Log Tab) -->
        <template v-if="activeTab === 'logs'">
          <v-btn-toggle
            v-model="selectedDateRange"
            mandatory
            color="primary"
            variant="outlined"
            density="compact"
            divided
          >
            <v-btn value="1_month" size="small">1 เดือน</v-btn>
            <v-btn value="7_days" size="small">7 วัน</v-btn>
            <v-btn value="1_day" size="small">1 วัน</v-btn>
            <v-btn value="custom" size="small">กำหนดเอง</v-btn>
          </v-btn-toggle>

          <!-- Custom Date Range Picker (Only when custom is selected) -->
          <template v-if="selectedDateRange === 'custom'">
            <v-menu v-model="logsTabStartDateMenu" :close-on-content-click="false">
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="formatLogsTabStartDate"
                  readonly
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="compact"
                  hide-details
                  label="วันเริ่มต้น"
                  class="date-picker-field"
                />
              </template>
              <v-card class="pa-4" elevation="8" rounded="lg">
                <v-date-picker v-model="logsTabStartDate" hide-header />
                <v-card-actions>
                  <v-btn variant="text" size="small" @click="logsTabStartDateMenu = false">
                    ปิด
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    variant="elevated"
                    color="primary"
                    size="small"
                    @click="confirmLogsTabStartDate"
                  >
                    ยืนยัน
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>

            <v-menu v-model="logsTabEndDateMenu" :close-on-content-click="false">
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="formatLogsTabEndDate"
                  readonly
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="compact"
                  hide-details
                  label="วันสิ้นสุด"
                  class="date-picker-field"
                />
              </template>
              <v-card class="pa-4" elevation="8" rounded="lg">
                <v-date-picker v-model="logsTabEndDate" hide-header />
                <v-card-actions>
                  <v-btn variant="text" size="small" @click="logsTabEndDateMenu = false">
                    ปิด
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    variant="elevated"
                    color="primary"
                    size="small"
                    @click="confirmLogsTabEndDate"
                  >
                    ยืนยัน
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </template>
        </template>

        <!-- Date Picker (Only for Dashboard Tab) -->
        <v-menu v-if="activeTab === 'dashboard'" v-model="datePickerMenu" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-text-field
              v-bind="props"
              v-model="selectedDate"
              readonly
              prepend-inner-icon="mdi-calendar"
              variant="outlined"
              density="compact"
              hide-details
              class="date-picker"
            />
          </template>
          <v-card class="pa-4" elevation="8" rounded="lg">
            <v-date-picker v-model="tempSelectedDateObject" hide-header />
            <v-card-actions>
              <v-btn variant="text" size="small" @click="cancelDateSelection">
                ยกเลิก
              </v-btn>
              <v-spacer />
              <v-btn
                variant="elevated"
                color="primary"
                size="small"
                @click="confirmDateSelection"
              >
                ยืนยัน
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
        <!-- Filter Button for Dashboard Tab -->
        <v-menu v-if="activeTab === 'dashboard'" v-model="filterMenu" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              prepend-icon="mdi-filter-variant"
              class="text-none"
            >
              <template #default>
                <span>กรองข้อมูล</span>
                <v-chip
                  v-if="activeFilterCount > 0"
                  :text="activeFilterCount.toString()"
                  color="primary"
                  size="small"
                  class="ml-2"
                />
              </template>
            </v-btn>
          </template>

          <v-card
            class="pa-4"
            elevation="8"
            rounded="lg"
            min-width="320"
            max-width="400"
          >
            <v-card-title class="pa-0 mb-4">
              <h3 class="text-h6 font-weight-bold">ตัวกรองข้อมูล</h3>
            </v-card-title>

            <v-card-text class="pa-0">
              <div class="d-flex flex-column ga-4">
                <!-- User ID Filter - Only show for ADMIN/TECHNICIAN -->
                <v-combobox
                  v-if="!isUser"
                  v-model="tempSelectedUserIds"
                  :items="userOptions"
                  :loading="isUserSearching"
                  item-title="title"
                  item-value="value"
                  label="ชื่อผู้ใช้"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="compact"
                  chips
                  clearable
                  closable-chips
                  multiple
                  hide-details
                  @update:search="handleUserSearch"
                >
                  <template #chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      color="primary"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.raw.title }}
                    </v-chip>
                  </template>
                </v-combobox>

                <!-- Payment Status Filter -->
                <v-combobox
                  v-model="tempSelectedPaymentStatuses"
                  :items="paymentStatusOptions"
                  label="สถานะการชำระเงิน"
                  item-title="label"
                  item-value="value"
                  prepend-inner-icon="mdi-credit-card"
                  variant="outlined"
                  density="compact"
                  chips
                  clearable
                  closable-chips
                  multiple
                  hide-details
                >
                  <template #chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      :color="getPaymentStatusColor(item.raw.value)"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.raw.label }}
                    </v-chip>
                  </template>
                </v-combobox>

                <!-- Device Type Filter -->
                <v-combobox
                  v-model="tempSelectedDeviceTypes"
                  :items="deviceTypeOptions"
                  label="ประเภทอุปกรณ์"
                  item-title="label"
                  item-value="value"
                  prepend-inner-icon="mdi-cog"
                  variant="outlined"
                  density="compact"
                  chips
                  clearable
                  closable-chips
                  multiple
                  hide-details
                >
                  <template #chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      :color="getDeviceTypeColor(item.raw.value)"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.raw.label }}
                    </v-chip>
                  </template>
                </v-combobox>
              </div>
            </v-card-text>

            <v-card-actions class="pa-0 mt-4">
              <v-btn
                variant="outlined"
                size="small"
                prepend-icon="mdi-refresh"
                @click="resetPopoverFilters"
              >
                ล้างตัวกรอง
              </v-btn>
              <v-spacer />
              <v-btn
                variant="elevated"
                color="primary"
                size="small"
                prepend-icon="mdi-check"
                @click="applyPopoverFilters"
              >
                ยืนยันตัวกรอง
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <!-- Filter Button for Logs Tab -->
        <v-menu v-if="activeTab === 'logs'" v-model="logsTabFilterMenu" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              prepend-icon="mdi-filter-variant"
              class="text-none"
            >
              <template #default>
                <span>กรองข้อมูล</span>
                <v-chip
                  v-if="logsTabActiveFilterCount > 0"
                  :text="logsTabActiveFilterCount.toString()"
                  color="primary"
                  size="small"
                  class="ml-2"
                />
              </template>
            </v-btn>
          </template>

          <v-card
            class="pa-4"
            elevation="8"
            rounded="lg"
            min-width="320"
            max-width="400"
          >
            <v-card-title class="pa-0 mb-4">
              <h3 class="text-h6 font-weight-bold">ตัวกรองข้อมูล</h3>
            </v-card-title>

            <v-card-text class="pa-0">
              <div class="d-flex flex-column ga-4">
                <!-- User ID Filter - Only show for ADMIN/TECHNICIAN -->
                <v-combobox
                  v-if="!isUser"
                  v-model="logsTabTempSelectedUserIds"
                  :items="userOptions"
                  :loading="isUserSearching"
                  item-title="title"
                  item-value="value"
                  label="ชื่อผู้ใช้"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="compact"
                  chips
                  clearable
                  closable-chips
                  multiple
                  hide-details
                  @update:search="handleUserSearch"
                >
                  <template #chip="{ props: chipProps, item }">
                    <v-chip
                      v-bind="chipProps"
                      color="primary"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.raw.title }}
                    </v-chip>
                  </template>
                </v-combobox>

                <!-- Payment Status Filter -->
                <v-combobox
                  v-model="logsTabTempSelectedPaymentStatuses"
                  :items="paymentStatusOptions"
                  label="สถานะการชำระเงิน"
                  item-title="label"
                  item-value="value"
                  prepend-inner-icon="mdi-credit-card"
                  variant="outlined"
                  density="compact"
                  chips
                  clearable
                  closable-chips
                  multiple
                  hide-details
                >
                  <template #chip="{ props: chipProps, item }">
                    <v-chip
                      v-bind="chipProps"
                      :color="getPaymentStatusColor(item.raw.value)"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.raw.label }}
                    </v-chip>
                  </template>
                </v-combobox>

                <!-- Device Type Filter -->
                <v-combobox
                  v-model="logsTabTempSelectedDeviceTypes"
                  :items="deviceTypeOptions"
                  label="ประเภทอุปกรณ์"
                  item-title="label"
                  item-value="value"
                  prepend-inner-icon="mdi-cog"
                  variant="outlined"
                  density="compact"
                  chips
                  clearable
                  closable-chips
                  multiple
                  hide-details
                >
                  <template #chip="{ props: chipProps, item }">
                    <v-chip
                      v-bind="chipProps"
                      :color="getDeviceTypeColor(item.raw.value)"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.raw.label }}
                    </v-chip>
                  </template>
                </v-combobox>
              </div>
            </v-card-text>

            <v-card-actions class="pa-0 mt-4">
              <v-btn
                variant="outlined"
                size="small"
                prepend-icon="mdi-refresh"
                @click="resetLogsTabPopoverFilters"
              >
                ล้างตัวกรอง
              </v-btn>
              <v-spacer />
              <v-btn
                variant="elevated"
                color="primary"
                size="small"
                prepend-icon="mdi-check"
                @click="applyLogsTabPopoverFilters"
              >
                ยืนยันตัวกรอง
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <v-btn
          color="primary"
          prepend-icon="mdi-download"
          class="text-none"
          :loading="isExporting"
          :disabled="isExporting"
          @click="handleExport"
        >
          ส่งออก
        </v-btn>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <v-tabs
      v-model="activeTab"
      color="primary"
      class="mb-6"
    >
      <v-tab value="dashboard">
        <v-icon start>mdi-view-dashboard</v-icon>
        แดชบอร์ด
      </v-tab>
      <v-tab value="logs">
        <v-icon start>mdi-clipboard-text-clock</v-icon>
        บันทึกการขาย
      </v-tab>
    </v-tabs>

    <!-- Date Range Info (Only for Log Tab) -->
    <v-alert
      v-if="activeTab === 'logs'"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-6"
    >
      <template #prepend>
        <v-icon>mdi-calendar-range</v-icon>
      </template>
      <span class="text-body-2">
        แสดงข้อมูลตั้งแต่ <strong>{{ formatDateRangeDisplay.start }}</strong> ถึง <strong>{{ formatDateRangeDisplay.end }}</strong>
      </span>
    </v-alert>

    <!-- Error Alert -->
    <v-alert
      v-if="dashboardError"
      type="error"
      variant="tonal"
      closable
      class="mb-6"
      @click:close="clearMessages"
    >
      <template #prepend>
        <v-icon>mdi-alert-circle</v-icon>
      </template>
      <div class="text-body-2">
        <strong>เกิดข้อผิดพลาด:</strong> {{ dashboardError }}
      </div>
    </v-alert>

    <!-- Dashboard Tab Content -->
    <template v-if="activeTab === 'dashboard'">
      <!-- KPI Cards Section -->
      <div class="position-relative mb-8">
      <!-- Loading Overlay -->
      <v-overlay
        :model-value="isLoading || isCancelling"
        contained
        persistent
        class="align-center justify-center"
      >
        <v-progress-circular color="primary" indeterminate size="64" />
        <div class="text-body-1 mt-4">
          {{ isCancelling ? 'กำลังอัพเดทข้อมูล...' : 'กำลังโหลดข้อมูล...' }}
        </div>
      </v-overlay>

      <v-row>
        <v-col v-for="(kpi, index) in kpiData" :key="index" cols="12" md="4">
          <KPICard
            :key="`${kpi.chartId}-${kpi.value}-${kpi.chartData.length}`"
            :title="kpi.title"
            :value="kpi.value"
            :trend="kpi.trend"
            :chart-data="kpi.chartData"
            :chart-labels="kpi.chartLabels"
            :chart-id="kpi.chartId"
            :currency="kpi.currency"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Hourly Revenue Card Section -->
    <!-- <v-row class="mb-8">
      <v-col cols="12">
        <KPICard
          title="รายได้รายชั่วโมง"
          :value="dashboardData.hourlyRevenue.value"
          :trend="dashboardData.hourlyRevenue.trend"
          :chart-data="dashboardData.hourlyRevenue.chartData"
          :chart-labels="dashboardData.hourlyRevenue.chartLabels"
          chart-id="hourly-kpi"
          :currency="true"
        />
      </v-col>
    </v-row> -->

    <!-- Confirmation Dialog for Cancel -->
    <v-dialog v-model="showCancelDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center pa-6">
          <v-icon color="error" class="mr-2">mdi-delete-alert</v-icon>
          <span class="text-h5 font-weight-bold">ยืนยันการยกเลิก</span>
        </v-card-title>
        <v-card-text class="pa-6">
          <p class="text-body-1 mb-4">
            คุณต้องการยกเลิกรายการนี้ใช่หรือไม่?
          </p>
          <v-alert
            variant="tonal"
            color="error"
            density="compact"
            icon="mdi-alert"
          >
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-6 justify-end">
          <v-btn variant="text" @click="showCancelDialog = false">
            ยกเลิก
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="confirmCancelEventLog"
          >
            ยืนยัน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sales Detail Table -->
    <EnhancedDataTable
      title="รายละเอียดการขาย"
      :items="eventLogs"
      :headers="salesHeaders"
      :loading="isSearching"
      :has-filter-changes="hasFilterChanges"
      :page="currentSearchParams.page || 1"
      :total-items="totalLogs"
      :total-pages="totalPages"
      expandable
      @apply-filters="applyFilters"
      @clear-filters="clearAllFilters"
      @update:page="handlePageChange"
    >
      <!-- Filter Section -->
      <template #filters>
        <v-row>
          <!-- Search Bar -->
          <v-col cols="12">
            <v-text-field
              v-model="tempSearchQuery"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              placeholder="ค้นหาด้วยชื่อบริการ หรือรหัสเครื่อง"
              hide-details
              clearable
              aria-label="ค้นหาการขาย"
              role="searchbox"
            />
          </v-col>
        </v-row>
      </template>

      <!-- Custom Column Templates -->
      <template #[`item.created_at`]="{ item }">
        <div class="text-body-2">
          {{ formatDateTime(item.created_at) }}
        </div>
      </template>

      <template #[`item.device.name`]="{ item }">
        <div class="d-flex align-center">
          <v-icon
            :color="getDeviceTypeColor(item.device.type)"
            size="small"
            class="me-2"
          >
            {{ getDeviceTypeIcon(item.device.type) }}
          </v-icon>
          <span class="text-body-2 font-weight-medium">{{
            item.device.name
          }}</span>
        </div>
      </template>

      <template #[`item.payload.status`]="{ item }">
        <v-chip
          :color="getPaymentStatusColor(item.payload?.status)"
          size="small"
          variant="tonal"
        >
          {{ getPaymentStatusLabel(item.payload?.status) }}
        </v-chip>
      </template>

      <template #[`item.device.type`]="{ item }">
        <v-chip
          :color="getDeviceTypeColor(item.device.type)"
          size="small"
          variant="tonal"
        >
          {{ getDeviceTypeLabel(item.device.type) }}
        </v-chip>
      </template>

      <template #[`item.payload.total_amount`]="{ item }">
        <div
          class="text-body-2 font-weight-bold"
          :class="
            item.payload?.status === 'SUCCEEDED' ? 'text-success' : 'text-error'
          "
        >
          ฿{{ item.payload?.total_amount?.toLocaleString("th-TH") || 0 }}
        </div>
      </template>

      <template #[`item.payload.discount_percent`]="{ item }">
        <v-chip
          v-if="item.payload?.discount_percent && item.payload.discount_percent > 0"
          color="warning"
          size="small"
          variant="tonal"
        >
          {{ item.payload.discount_percent }}%
        </v-chip>
        <span v-else class="text-body-2 text-medium-emphasis">-</span>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-btn
          v-if="isAdmin && item.payload?.status !== 'CANCELLED'"
          icon="mdi-delete"
          variant="text"
          color="error"
          size="small"
          density="compact"
          :loading="isCancelling"
          :disabled="isCancelling"
          @click.stop="handleCancelEventLog(item.id)"
        />
      </template>

      <!-- Expandable Row Content -->
      <template #expanded-content="{ item }">
        <div class="payment-breakdown">
          <!-- Header with transaction summary -->
          <h3 class="text-subtitle-1 font-weight-bold">
            รายละเอียดการชำระเงิน
          </h3>

          <!-- Payment methods grid for desktop -->
          <v-row
            v-if="$vuetify.display.mdAndUp"
            no-gutters
            class="payment-methods-grid"
          >
            <!-- QR Payment Section -->
            <v-col cols="4" class="payment-section">
              <div class="payment-method-section pa-3">
                <div class="d-flex align-center mb-3">
                  <v-icon color="primary" size="small" class="me-2"
                    >mdi-qrcode</v-icon
                  >
                  <span class="text-subtitle-2 font-weight-medium"
                    >QR Payment</span
                  >
                </div>

                <div v-if="hasQrPayment(item)">
                  <v-card class="mb-2" color="primary" variant="tonal">
                    <v-card-text class="pa-3">
                      <div class="text-caption text-medium-emphasis">
                        จำนวนเงินผ่าน QR Code
                      </div>
                      <div class="text-h6 font-weight-bold">
                        ฿{{ item.payload.qr.net_amount }}
                      </div>
                    </v-card-text>
                  </v-card>
                  <v-card color="primary-lighten-1" variant="tonal">
                    <v-card-text class="pa-3">
                      <div class="text-caption text-medium-emphasis">
                        รหัสธุรกรรม
                      </div>
                      <div class="text-body-2 font-family-monospace">
                        {{ item.payload.qr.chargeId }}
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
                <div v-else class="text-caption text-medium-emphasis">
                  ไม่มีการชำระผ่าน QR Code
                </div>
              </div>
            </v-col>

            <!-- Bank Notes Section -->
            <v-col cols="4" class="payment-section">
              <div class="payment-method-section pa-3">
                <div class="d-flex align-center mb-3">
                  <v-icon color="success" size="small" class="me-2"
                    >mdi-cash-100</v-icon
                  >
                  <span class="text-subtitle-2 font-weight-medium">ธนบัตร</span>
                </div>

                <div v-if="hasBankNotes(item)">
                  <v-row dense>
                    <v-col
                      v-for="(count, denomination) in item.payload.bank"
                      :key="denomination"
                      cols="6"
                    >
                      <v-card
                        v-if="count > 0"
                        class="denomination-card"
                        color="success-lighten-1"
                        variant="tonal"
                      >
                        <v-card-text class="pa-2 text-center">
                          <div class="text-body-2 font-weight-bold">
                            ฿{{ denomination }}
                          </div>
                          <div class="text-caption">{{ count }} ใบ</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
                <div v-else class="text-caption text-medium-emphasis">
                  ไม่มีการชำระด้วยธนบัตร
                </div>
              </div>
            </v-col>

            <!-- Coins Section -->
            <v-col cols="4" class="payment-section">
              <div class="payment-method-section pa-3">
                <div class="d-flex align-center mb-3">
                  <v-icon color="secondary" size="small" class="me-2"
                    >mdi-circle-multiple</v-icon
                  >
                  <span class="text-subtitle-2 font-weight-medium">เหรียญ</span>
                </div>

                <div v-if="hasCoins(item)">
                  <v-row dense>
                    <v-col
                      v-for="(count, denomination) in item.payload.coin"
                      :key="denomination"
                      cols="6"
                    >
                      <v-card
                        v-if="count > 0"
                        class="denomination-card"
                        color="secondary-lighten-1"
                        variant="tonal"
                      >
                        <v-card-text class="pa-2 text-center">
                          <div class="text-body-2 font-weight-bold">
                            ฿{{ denomination }}
                          </div>
                          <div class="text-caption">{{ count }} เหรียญ</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
                <div v-else class="text-caption text-medium-emphasis">
                  ไม่มีการชำระด้วยเหรียญ
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Mobile layout with expansion panels -->
          <div v-else class="mobile-payment-layout">
            <v-expansion-panels variant="accordion" multiple>
              <v-expansion-panel
                v-if="hasQrPayment(item)"
                title="QR Payment"
                expand-icon="mdi-qrcode"
              >
                <v-expansion-panel-text>
                  <div class="pa-2">
                    <v-card
                      class="mb-2"
                      color="primary-lighten-1"
                      variant="tonal"
                    >
                      <v-card-text class="pa-3">
                        <div class="text-caption text-medium-emphasis">
                          Net Amount
                        </div>
                        <div class="text-h6 font-weight-bold">
                          ฿{{ item.payload.qr.net_amount }}
                        </div>
                      </v-card-text>
                    </v-card>
                    <v-card color="primary-lighten-2" variant="tonal">
                      <v-card-text class="pa-3">
                        <div class="text-caption text-medium-emphasis">
                          Transaction ID
                        </div>
                        <div class="text-body-2 font-family-monospace">
                          {{ item.payload.qr.transaction_id }}
                        </div>
                      </v-card-text>
                    </v-card>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel
                v-if="hasBankNotes(item)"
                title="ธนบัตร"
                expand-icon="mdi-cash-100"
              >
                <v-expansion-panel-text>
                  <div class="pa-2">
                    <v-row dense>
                      <v-col
                        v-for="(count, denomination) in item.payload.bank"
                        :key="denomination"
                        cols="6"
                      >
                        <v-card
                          v-if="count > 0"
                          class="denomination-card"
                          color="success-lighten-1"
                          variant="tonal"
                        >
                          <v-card-text class="pa-2 text-center">
                            <div class="text-body-2 font-weight-bold">
                              ฿{{ denomination }}
                            </div>
                            <div class="text-caption">{{ count }} ใบ</div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel
                v-if="hasCoins(item)"
                title="เหรียญ"
                expand-icon="mdi-circle-multiple"
              >
                <v-expansion-panel-text>
                  <div class="pa-2">
                    <v-row dense>
                      <v-col
                        v-for="(count, denomination) in item.payload.coin"
                        :key="denomination"
                        cols="6"
                      >
                        <v-card
                          v-if="count > 0"
                          class="denomination-card"
                          color="secondary-lighten-1"
                          variant="tonal"
                        >
                          <v-card-text class="pa-2 text-center">
                            <div class="text-body-2 font-weight-bold">
                              ฿{{ denomination }}
                            </div>
                            <div class="text-caption">{{ count }} เหรียญ</div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </div>
      </template>
    </EnhancedDataTable>
    </template>

    <!-- Logs Tab Content -->
    <template v-if="activeTab === 'logs'">
      <!-- Sales Detail Table with Date Range -->
      <EnhancedDataTable
        title="รายการบันทึก"
        :items="logsTabEventLogs"
        :headers="salesHeaders"
        :loading="isLogsTabSearching"
        :has-filter-changes="logsTabHasFilterChanges"
        :page="logsTabCurrentPage"
        :total-items="logsTabTotalLogs"
        :total-pages="logsTabTotalPages"
        expandable
        @apply-filters="applyLogsTabFilters"
        @clear-filters="clearLogsTabFilters"
        @update:page="handleLogsTabPageChange"
      >
        <!-- Filter Section -->
        <template #filters>
          <v-row>
            <!-- Search Bar -->
            <v-col cols="12">
              <v-text-field
                v-model="logsTabTempSearchQuery"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                placeholder="ค้นหาด้วยชื่อบริการ หรือรหัสเครื่อง"
                hide-details
                clearable
                aria-label="ค้นหาการขาย"
                role="searchbox"
              />
            </v-col>
          </v-row>
        </template>

        <!-- Custom Column Templates -->
        <template #[`item.created_at`]="{ item }">
          <div class="text-body-2">
            {{ formatDateTime(item.created_at) }}
          </div>
        </template>

        <template #[`item.device.name`]="{ item }">
          <div class="d-flex align-center">
            <v-icon
              :color="getDeviceTypeColor(item.device.type)"
              size="small"
              class="me-2"
            >
              {{ getDeviceTypeIcon(item.device.type) }}
            </v-icon>
            <span class="text-body-2 font-weight-medium">{{
              item.device.name
            }}</span>
          </div>
        </template>

        <template #[`item.payload.status`]="{ item }">
          <v-chip
            :color="getPaymentStatusColor(item.payload?.status)"
            size="small"
            variant="tonal"
          >
            {{ getPaymentStatusLabel(item.payload?.status) }}
          </v-chip>
        </template>

        <template #[`item.device.type`]="{ item }">
          <v-chip
            :color="getDeviceTypeColor(item.device.type)"
            size="small"
            variant="tonal"
          >
            {{ getDeviceTypeLabel(item.device.type) }}
          </v-chip>
        </template>

        <template #[`item.payload.total_amount`]="{ item }">
          <div
            class="text-body-2 font-weight-bold"
            :class="
              item.payload?.status === 'SUCCEEDED' ? 'text-success' : 'text-error'
            "
          >
            ฿{{ item.payload?.total_amount?.toLocaleString("th-TH") || 0 }}
          </div>
        </template>

        <template #[`item.payload.discount_percent`]="{ item }">
          <v-chip
            v-if="item.payload?.discount_percent && item.payload.discount_percent > 0"
            color="warning"
            size="small"
            variant="tonal"
          >
            {{ item.payload.discount_percent }}%
          </v-chip>
          <span v-else class="text-body-2 text-medium-emphasis">-</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn
            v-if="isAdmin && item.payload?.status !== 'CANCELLED'"
            icon="mdi-delete"
            variant="text"
            color="error"
            size="small"
            density="compact"
            :loading="isCancelling"
            :disabled="isCancelling"
            @click.stop="handleCancelEventLog(item.id)"
          />
        </template>

        <!-- Expandable Row Content -->
        <template #expanded-content="{ item }">
          <div class="payment-breakdown">
            <!-- Header with transaction summary -->
            <h3 class="text-subtitle-1 font-weight-bold">
              รายละเอียดการชำระเงิน
            </h3>

            <!-- Payment methods grid for desktop -->
            <v-row
              v-if="$vuetify.display.mdAndUp"
              no-gutters
              class="payment-methods-grid"
            >
              <!-- QR Payment Section -->
              <v-col cols="4" class="payment-section">
                <div class="payment-method-section pa-3">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="primary" size="small" class="me-2"
                      >mdi-qrcode</v-icon
                    >
                    <span class="text-subtitle-2 font-weight-medium"
                      >QR Payment</span
                    >
                  </div>

                  <div v-if="hasQrPayment(item)">
                    <v-card class="mb-2" color="primary" variant="tonal">
                      <v-card-text class="pa-3">
                        <div class="text-caption text-medium-emphasis">
                          จำนวนเงินผ่าน QR Code
                        </div>
                        <div class="text-h6 font-weight-bold">
                          ฿{{ item.payload.qr.net_amount }}
                        </div>
                      </v-card-text>
                    </v-card>
                    <v-card color="primary-lighten-1" variant="tonal">
                      <v-card-text class="pa-3">
                        <div class="text-caption text-medium-emphasis">
                          รหัสธุรกรรม
                        </div>
                        <div class="text-body-2 font-family-monospace">
                          {{ item.payload.qr.chargeId }}
                        </div>
                      </v-card-text>
                    </v-card>
                  </div>
                  <div v-else class="text-caption text-medium-emphasis">
                    ไม่มีการชำระผ่าน QR Code
                  </div>
                </div>
              </v-col>

              <!-- Bank Notes Section -->
              <v-col cols="4" class="payment-section">
                <div class="payment-method-section pa-3">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="success" size="small" class="me-2"
                      >mdi-cash-100</v-icon
                    >
                    <span class="text-subtitle-2 font-weight-medium">ธนบัตร</span>
                  </div>

                  <div v-if="hasBankNotes(item)">
                    <v-row dense>
                      <v-col
                        v-for="(count, denomination) in item.payload.bank"
                        :key="denomination"
                        cols="6"
                      >
                        <v-card
                          v-if="count > 0"
                          class="denomination-card"
                          color="success-lighten-1"
                          variant="tonal"
                        >
                          <v-card-text class="pa-2 text-center">
                            <div class="text-body-2 font-weight-bold">
                              ฿{{ denomination }}
                            </div>
                            <div class="text-caption">{{ count }} ใบ</div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>
                  <div v-else class="text-caption text-medium-emphasis">
                    ไม่มีการชำระด้วยธนบัตร
                  </div>
                </div>
              </v-col>

              <!-- Coins Section -->
              <v-col cols="4" class="payment-section">
                <div class="payment-method-section pa-3">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="secondary" size="small" class="me-2"
                      >mdi-circle-multiple</v-icon
                    >
                    <span class="text-subtitle-2 font-weight-medium">เหรียญ</span>
                  </div>

                  <div v-if="hasCoins(item)">
                    <v-row dense>
                      <v-col
                        v-for="(count, denomination) in item.payload.coin"
                        :key="denomination"
                        cols="6"
                      >
                        <v-card
                          v-if="count > 0"
                          class="denomination-card"
                          color="secondary-lighten-1"
                          variant="tonal"
                        >
                          <v-card-text class="pa-2 text-center">
                            <div class="text-body-2 font-weight-bold">
                              ฿{{ denomination }}
                            </div>
                            <div class="text-caption">{{ count }} เหรียญ</div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>
                  <div v-else class="text-caption text-medium-emphasis">
                    ไม่มีการชำระด้วยเหรียญ
                  </div>
                </div>
              </v-col>
            </v-row>

            <!-- Mobile layout with expansion panels -->
            <div v-else class="mobile-payment-layout">
              <v-expansion-panels variant="accordion" multiple>
                <v-expansion-panel
                  v-if="hasQrPayment(item)"
                  title="QR Payment"
                  expand-icon="mdi-qrcode"
                >
                  <v-expansion-panel-text>
                    <div class="pa-2">
                      <v-card
                        class="mb-2"
                        color="primary-lighten-1"
                        variant="tonal"
                      >
                        <v-card-text class="pa-3">
                          <div class="text-caption text-medium-emphasis">
                            Net Amount
                          </div>
                          <div class="text-h6 font-weight-bold">
                            ฿{{ item.payload.qr.net_amount }}
                          </div>
                        </v-card-text>
                      </v-card>
                      <v-card color="primary-lighten-2" variant="tonal">
                        <v-card-text class="pa-3">
                          <div class="text-caption text-medium-emphasis">
                            Transaction ID
                          </div>
                          <div class="text-body-2 font-family-monospace">
                            {{ item.payload.qr.transaction_id }}
                          </div>
                        </v-card-text>
                      </v-card>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel
                  v-if="hasBankNotes(item)"
                  title="ธนบัตร"
                  expand-icon="mdi-cash-100"
                >
                  <v-expansion-panel-text>
                    <div class="pa-2">
                      <v-row dense>
                        <v-col
                          v-for="(count, denomination) in item.payload.bank"
                          :key="denomination"
                          cols="6"
                        >
                          <v-card
                            v-if="count > 0"
                            class="denomination-card"
                            color="success-lighten-1"
                            variant="tonal"
                          >
                            <v-card-text class="pa-2 text-center">
                              <div class="text-body-2 font-weight-bold">
                                ฿{{ denomination }}
                              </div>
                              <div class="text-caption">{{ count }} ใบ</div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel
                  v-if="hasCoins(item)"
                  title="เหรียญ"
                  expand-icon="mdi-circle-multiple"
                >
                  <v-expansion-panel-text>
                    <div class="pa-2">
                      <v-row dense>
                        <v-col
                          v-for="(count, denomination) in item.payload.coin"
                          :key="denomination"
                          cols="6"
                        >
                          <v-card
                            v-if="count > 0"
                            class="denomination-card"
                            color="secondary-lighten-1"
                            variant="tonal"
                          >
                            <v-card-text class="pa-2 text-center">
                              <div class="text-body-2 font-weight-bold">
                                ฿{{ denomination }}
                              </div>
                              <div class="text-caption">{{ count }} เหรียญ</div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </div>
        </template>
      </EnhancedDataTable>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DashboardFilterRequest } from "~/services/apis/dashboard-api.service";
import type { EnumDeviceType, EnumPaymentStatus } from "~/types";
import EnhancedDataTable from "~/components/common/EnhancedDataTable.vue";

// Import enum translation composable
const {
  getDeviceTypeLabel,
  getDeviceTypeColor,
  getDeviceTypeIcon,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  deviceTypeOptions,
  paymentStatusOptions,
} = useEnumTranslation();

// Import auth composable to check user permission
const { isUser, isAdmin, isAuthReady } = useAuth();

// Tab state
type TabValue = "dashboard" | "logs";
const activeTab = ref<TabValue>("dashboard");

// Date Range State for Logs Tab
type DateRange = "1_month" | "7_days" | "1_day" | "custom";
const selectedDateRange = ref<DateRange>("1_month");

// Custom Date Range State for Logs Tab
const logsTabStartDateMenu = ref(false);
const logsTabEndDateMenu = ref(false);
const logsTabStartDate = ref<Date>(new Date());
const logsTabEndDate = ref<Date>(new Date());

// Format custom date for display
const formatLogsTabStartDate = computed(() => {
  return logsTabStartDate.value.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
});

const formatLogsTabEndDate = computed(() => {
  return logsTabEndDate.value.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
});

// Confirm custom date selection and refetch data
const confirmLogsTabStartDate = async () => {
  logsTabStartDateMenu.value = false;
  if (selectedDateRange.value === "custom") {
    await fetchLogsTabData();
  }
};

const confirmLogsTabEndDate = async () => {
  logsTabEndDateMenu.value = false;
  if (selectedDateRange.value === "custom") {
    await fetchLogsTabData();
  }
};

// Fetch logs tab data helper
const fetchLogsTabData = async () => {
  await searchLogsTabEventLogs({
    query: {
      payload_timestamp: buildLogsTabTimestampQuery(),
    },
    page: 1,
    limit: 20,
  });
};

// Dashboard KPI data using new composable
const {
  monthlyData,
  dailyData,
  hourlyData,
  isLoading,
  error: dashboardError,
  fetchDashboardSummary,
  updateFilter,
  clearMessages,
} = useDashboard();

// Sales table data - using useDeviceEventLogs composable
const {
  eventLogs,
  totalLogs,
  totalPages,
  currentSearchParams,
  isSearching,
  isExporting,
  isCancelling,
  error: eventLogsError,
  successMessage: eventLogsSuccess,
  searchEventLogs,
  goToPage,
  exportToExcel,
  cancelEventLog,
  refreshSearch,
  clearMessages: clearEventLogsMessages,
} = useDeviceEventLogs();

// User data - using useUser composable
const { users, isSearching: isUserSearching, searchUsers } = useUser();

// Logs Tab - separate instance of useDeviceEventLogs for independent state
const {
  eventLogs: logsTabEventLogs,
  totalLogs: logsTabTotalLogs,
  totalPages: logsTabTotalPages,
  currentSearchParams: logsTabCurrentSearchParams,
  isSearching: isLogsTabSearching,
  searchEventLogs: searchLogsTabEventLogs,
  goToPage: goToLogsTabPage,
} = useDeviceEventLogs();

// Logs Tab filter state
const logsTabSearchQuery = ref("");

// Logs Tab temp filter state
const logsTabTempSearchQuery = ref("");

// Logs Tab current page computed
const logsTabCurrentPage = computed(() => logsTabCurrentSearchParams.value.page || 1);

// Logs Tab Popover filter menu state
const logsTabFilterMenu = ref(false);

// Logs Tab Popover filter states (temporary)
const logsTabTempSelectedUserIds = ref<string[]>([]);
const logsTabTempSelectedPaymentStatuses = ref<string[]>([]);
const logsTabTempSelectedDeviceTypes = ref<string[]>([]);

// Logs Tab Applied popover filter states
const logsTabSelectedUserIds = ref<string[]>([]);
const logsTabSelectedPaymentStatuses = ref<string[]>([]);
const logsTabSelectedDeviceTypes = ref<string[]>([]);

// Logs Tab Filter count badge logic
const logsTabActiveFilterCount = computed(() => {
  let count = 0;
  if (logsTabSelectedUserIds.value.length > 0) count++;
  if (logsTabSelectedPaymentStatuses.value.length > 0) count++;
  if (logsTabSelectedDeviceTypes.value.length > 0) count++;
  return count;
});

const datePickerMenu = ref(false);
const selectedDateObject = ref(new Date());
const tempSelectedDateObject = ref(new Date());
const selectedDate = computed(() => {
  return selectedDateObject.value.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
});

// Filter variables
const searchQuery = ref("");
const selectedServiceTypes = ref<string[]>([]);

// Temporary filter variables (for pending changes)
const tempSearchQuery = ref("");
const tempSelectedServiceTypes = ref<string[]>([]);

// Popover filter menu state
const filterMenu = ref(false);

// Popover filter states (temporary)
const tempSelectedUserIds = ref<string[]>([]);
const tempSelectedPaymentStatuses = ref<string[]>([]);
const tempSelectedDeviceTypes = ref<string[]>([]);

// Applied popover filter states
const selectedUserIds = ref<string[]>([]);
const selectedPaymentStatuses = ref<string[]>([]);
const selectedDeviceTypes = ref<string[]>([]);

// User search debounce state
const userSearchDebounceTimer = ref<number | null>(null);
const userSearchRequestId = ref(0);

// Popover filter options - using users from useUser composable
const userOptions = computed(() => {
  return users.value.map((user) => ({
    title: user.fullname,
    value: user.id,
  }));
});

// Popover filter options from composable (no longer hardcoded)

// Filter count badge logic
const activeFilterCount = computed(() => {
  let count = 0;
  if (selectedUserIds.value.length > 0) count++;
  if (selectedPaymentStatuses.value.length > 0) count++;
  if (selectedDeviceTypes.value.length > 0) count++;
  return count;
});

// Handle user search with debounce
const handleUserSearch = (userSearchQuery: string) => {
  // Clear existing timer
  if (userSearchDebounceTimer.value !== null) {
    clearTimeout(userSearchDebounceTimer.value);
  }

  // Increment request ID to track this search
  userSearchRequestId.value++;
  const currentRequestId = userSearchRequestId.value;

  // Set new timer for 500ms debounce
  userSearchDebounceTimer.value = window.setTimeout(async () => {
    // Check if this is still the latest request
    if (currentRequestId !== userSearchRequestId.value) {
      return;
    }

    if (userSearchQuery && userSearchQuery.trim()) {
      // Search with query
      await searchUsers({
        query: { search: userSearchQuery.trim() },
        page: 1,
        limit: 100,
      });
    } else {
      // Clear search - explicitly pass empty query object
      await searchUsers({
        query: {},
        page: 1,
        limit: 100,
      });
    }
  }, 500);
};

// Main filter actions
const applyFilters = async () => {
  // Update applied state
  searchQuery.value = tempSearchQuery.value;
  selectedServiceTypes.value = [...tempSelectedServiceTypes.value];

  // Build API query
  const query: any = {};

  // Search filter
  if (searchQuery.value.trim()) {
    query.search = searchQuery.value.trim();
  }

  // Always include timestamp for the selected date
  query.payload_timestamp = buildTimestampQuery();

  // Merge Popover filters
  if (selectedDeviceTypes.value.length > 0) {
    query.device_type = selectedDeviceTypes.value[0];
  }
  if (selectedPaymentStatuses.value.length > 0) {
    query.payment_status = selectedPaymentStatuses.value[0];
  }
  if (selectedUserIds.value.length > 0) {
    query.user_id = selectedUserIds.value[0];
  }

  // Call API
  await searchEventLogs({
    query,
    page: 1,
    limit: 10,
  });
};

const clearAllFilters = async () => {
  // Clear both temp and actual values
  tempSearchQuery.value = "";
  tempSelectedServiceTypes.value = [];

  searchQuery.value = "";
  selectedServiceTypes.value = [];

  // Build query keeping Popover filters
  const query: any = {
    payload_timestamp: buildTimestampQuery(),
  };

  if (selectedDeviceTypes.value.length > 0) {
    query.device_type = selectedDeviceTypes.value[0];
  }
  if (selectedPaymentStatuses.value.length > 0) {
    query.payment_status = selectedPaymentStatuses.value[0];
  }
  if (selectedUserIds.value.length > 0) {
    query.user_id = selectedUserIds.value[0];
  }

  await searchEventLogs({
    query,
    page: 1,
    limit: 10,
  });
};

// Popover filter functions
const applyPopoverFilters = async () => {
  // Update applied state - extract value from objects
  selectedUserIds.value = tempSelectedUserIds.value.map((item) =>
    typeof item === "string" ? item : item.value
  );
  selectedPaymentStatuses.value = tempSelectedPaymentStatuses.value.map(
    (item) => (typeof item === "string" ? item : item.value)
  );
  selectedDeviceTypes.value = tempSelectedDeviceTypes.value.map((item) =>
    typeof item === "string" ? item : item.value
  );

  // Build query for BOTH dashboard and event logs
  const dashboardFilter: Partial<DashboardFilterRequest> = {};
  const eventLogsQuery: any = {};

  // Always include timestamp for the selected date
  eventLogsQuery.payload_timestamp = buildTimestampQuery();

  // Device type filter
  if (selectedDeviceTypes.value.length > 0) {
    dashboardFilter.device_type = selectedDeviceTypes
      .value[0] as EnumDeviceType;
    eventLogsQuery.device_type = selectedDeviceTypes.value[0];
  }

  // Payment status filter
  if (selectedPaymentStatuses.value.length > 0) {
    dashboardFilter.payment_status = selectedPaymentStatuses
      .value[0] as EnumPaymentStatus;
    eventLogsQuery.payment_status = selectedPaymentStatuses.value[0];
  }

  // User ID filter - now included in both dashboard and event logs
  if (selectedUserIds.value.length > 0) {
    dashboardFilter.user_id = selectedUserIds.value[0];
    eventLogsQuery.user_id = selectedUserIds.value[0];
  }

  // Merge Inline filters
  if (searchQuery.value.trim()) {
    eventLogsQuery.search = searchQuery.value.trim();
  }

  // Update both dashboard and event logs
  await Promise.all([
    Object.keys(dashboardFilter).length > 0
      ? updateFilter(dashboardFilter)
      : Promise.resolve(),
    searchEventLogs({
      query: eventLogsQuery,
      page: 1,
      limit: 10,
    }),
  ]);

  filterMenu.value = false;
};

const resetPopoverFilters = async () => {
  // Clear both temp and actual values for popover filters
  tempSelectedUserIds.value = [];
  tempSelectedPaymentStatuses.value = [];
  tempSelectedDeviceTypes.value = [];

  selectedUserIds.value = [];
  selectedPaymentStatuses.value = [];
  selectedDeviceTypes.value = [];

  // Build query keeping Inline filters
  const query: any = {
    payload_timestamp: buildTimestampQuery(),
  };

  if (searchQuery.value.trim()) {
    query.search = searchQuery.value.trim();
  }

  // Re-fetch both dashboard and event logs with cleared filters
  await Promise.all([
    updateFilter({}),
    searchEventLogs({
      query,
      page: 1,
      limit: 10,
    }),
  ]);

  filterMenu.value = false;
};

// Date picker actions
const confirmDateSelection = async () => {
  // Apply the temporary date selection
  selectedDateObject.value = new Date(tempSelectedDateObject.value);
  datePickerMenu.value = false;
  // The watcher on selectedDateObject will handle the API refetch
};

const cancelDateSelection = () => {
  // Revert to the current selected date
  tempSelectedDateObject.value = new Date(selectedDateObject.value);
  datePickerMenu.value = false;
};

// Function to initialize dashboard data
const initializeDashboardData = async () => {
  // Build promises array - only fetch users for ADMIN/TECHNICIAN
  const promises = [
    fetchDashboardSummary(),
    searchEventLogs({
      query: {
        payload_timestamp: buildTimestampQuery(),
      },
      page: 1,
      limit: 10,
    }),
  ];

  // Only fetch users if not a USER permission (they can't use the filter anyway)
  if (!isUser.value) {
    promises.push(
      searchUsers({
        page: 1,
        limit: 100, // Fetch more users for filter dropdown
      })
    );
  }

  // Fetch initial data in parallel
  await Promise.all(promises);

  // Initialize temp filter values
  tempSearchQuery.value = searchQuery.value;
  tempSelectedServiceTypes.value = [...selectedServiceTypes.value];

  // Initialize popover filter temp values
  tempSelectedUserIds.value = [...selectedUserIds.value];
  tempSelectedPaymentStatuses.value = [...selectedPaymentStatuses.value];
  tempSelectedDeviceTypes.value = [...selectedDeviceTypes.value];

  // Initialize temp date picker value
  tempSelectedDateObject.value = new Date(selectedDateObject.value);
};

// Wait for auth to be ready before initializing dashboard
onMounted(() => {
  // If auth is already ready, initialize immediately
  if (isAuthReady.value) {
    initializeDashboardData();
  } else {
    // Otherwise, watch for auth to become ready
    const unwatch = watch(isAuthReady, (ready) => {
      if (ready) {
        initializeDashboardData();
        unwatch(); // Stop watching after initialization
      }
    });
  }
});

// Cleanup debounce timer on unmount
onUnmounted(() => {
  if (userSearchDebounceTimer.value !== null) {
    clearTimeout(userSearchDebounceTimer.value);
  }
});

// Watch date picker menu to sync temp value when opened
watch(datePickerMenu, (isOpen) => {
  if (isOpen) {
    tempSelectedDateObject.value = new Date(selectedDateObject.value);
  }
});

// Watch filter menu to sync temp values when opened
watch(filterMenu, (isOpen) => {
  if (isOpen) {
    // Reconstruct full objects from stored IDs/values
    tempSelectedUserIds.value = selectedUserIds.value
      .map((id) => userOptions.value.find((opt) => opt.value === id))
      .filter(Boolean);

    tempSelectedPaymentStatuses.value = selectedPaymentStatuses.value
      .map((val) => paymentStatusOptions.value.find((opt) => opt.value === val))
      .filter(Boolean);

    tempSelectedDeviceTypes.value = selectedDeviceTypes.value
      .map((val) => deviceTypeOptions.value.find((opt) => opt.value === val))
      .filter(Boolean);
  }
});

// Watch date picker changes and update dashboard filter
watch(selectedDateObject, async (newDate) => {
  if (newDate) {
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, "0");
    const day = String(newDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Update both dashboard KPIs and event logs for the selected date
    await Promise.all([
      updateFilter({ date: dateStr }),
      searchEventLogs({
        query: { payload_timestamp: buildTimestampQuery() },
        page: 1,
        limit: 10,
      }),
    ]);
  }
});

const kpiData = computed(() => [
  {
    title: "รายได้รายเดือน",
    value: monthlyData.value?.value || 0,
    trend: monthlyData.value?.trend || 0,
    chartData: monthlyData.value?.chartData || [],
    chartLabels: monthlyData.value?.chartLabels || [],
    chartId: "year-kpi",
    currency: true,
  },
  {
    title: "รายได้รายวัน",
    value: dailyData.value?.value || 0,
    trend: dailyData.value?.trend || 0,
    chartData: dailyData.value?.chartData || [],
    chartLabels: dailyData.value?.chartLabels || [],
    chartId: "month-kpi",
    currency: true,
  },
  {
    title: "รายได้รายชั่วโมง",
    value: hourlyData.value?.value || 0,
    trend: hourlyData.value?.trend || 0,
    chartData: hourlyData.value?.chartData || [],
    chartLabels: hourlyData.value?.chartLabels || [],
    chartId: "date-kpi",
    currency: true,
  },
]);

const salesHeaders = computed(() => {
  const headers = [
    { title: "เวลา", key: "payload.datetime", sortable: false },
    { title: "ชื่ออุปกรณ์", key: "device.name", sortable: false },
    { title: "สถานะ", key: "payload.status", sortable: false },
    { title: "ประเภท", key: "device.type", sortable: true },
    { title: "จำนวนเงิน", key: "payload.total_amount", sortable: false },
    { title: "ส่วนลด", key: "payload.discount_percent", sortable: false },
    { title: "", key: "data-table-expand", sortable: false },
  ];

  // Add actions column for admin/technician users only
  if (!isUser.value) {
    headers.push({ title: "การดำเนินการ", key: "actions", sortable: false });
  }

  return headers;
});

// Time picker object interface
interface TimeObject {
  hour?: number;
  hours?: number;
  minute?: number;
  minutes?: number;
}

// Helper function to convert date + time to Unix timestamp (ms)
const getTimestampFromDateTime = (
  date: Date,
  timeObj: TimeObject | Date | string | null
): number => {
  const d = new Date(date);
  if (timeObj) {
    if (typeof timeObj === "string") {
      const [hour, minute] = timeObj.split(":").map(Number);
      d.setHours(hour, minute, 0, 0);
    } else if (timeObj instanceof Date) {
      d.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);
    } else if (typeof timeObj === "object") {
      const hour = timeObj.hour || timeObj.hours || 0;
      const minute = timeObj.minute || timeObj.minutes || 0;
      d.setHours(hour, minute, 0, 0);
    }
  }
  return d.getTime();
};

// Helper function to build timestamp query for the selected date
// Uses full day (00:00-23:59)
const buildTimestampQuery = (): string => {
  const startTs = getTimestampFromDateTime(
    selectedDateObject.value,
    { hour: 0, minute: 0 }
  );
  const endTs = getTimestampFromDateTime(
    selectedDateObject.value,
    { hour: 23, minute: 59 }
  );
  return `${startTs}-${endTs}`;
};

// Build timestamp query for Logs Tab based on date range selection
const buildLogsTabTimestampQuery = (): string => {
  let start: Date;
  let end: Date;

  if (selectedDateRange.value === "custom") {
    // Use custom date range
    start = new Date(logsTabStartDate.value);
    start.setHours(0, 0, 0, 0);
    end = new Date(logsTabEndDate.value);
    end.setHours(23, 59, 59, 999);
  } else {
    const now = new Date();
    end = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (selectedDateRange.value) {
      case "1_month":
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;
      case "7_days":
        start = new Date(now);
        start.setDate(start.getDate() - 6);
        break;
      case "1_day":
      default:
        start = new Date(now);
        break;
    }
    start.setHours(0, 0, 0, 0);
  }

  return `${start.getTime()}-${end.getTime()}`;
};

// Compute date range for display in Logs Tab
const formatDateRangeDisplay = computed(() => {
  let start: Date;
  let end: Date;

  if (selectedDateRange.value === "custom") {
    start = new Date(logsTabStartDate.value);
    end = new Date(logsTabEndDate.value);
  } else {
    const now = new Date();
    end = new Date(now);

    switch (selectedDateRange.value) {
      case "1_month":
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;
      case "7_days":
        start = new Date(now);
        start.setDate(start.getDate() - 6);
        break;
      case "1_day":
      default:
        start = new Date(now);
        break;
    }
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  return {
    start: start.toLocaleDateString("th-TH", formatOptions),
    end: end.toLocaleDateString("th-TH", formatOptions),
  };
});

// Logs Tab filter actions
const applyLogsTabFilters = async () => {
  // Update applied state
  logsTabSearchQuery.value = logsTabTempSearchQuery.value;

  // Build API query
  const query: Record<string, string | undefined> = {};

  // Search filter
  if (logsTabSearchQuery.value.trim()) {
    query.search = logsTabSearchQuery.value.trim();
  }

  // Always include timestamp for the selected date range
  query.payload_timestamp = buildLogsTabTimestampQuery();

  // Merge Popover filters
  if (logsTabSelectedDeviceTypes.value.length > 0) {
    query.device_type = logsTabSelectedDeviceTypes.value[0];
  }
  if (logsTabSelectedPaymentStatuses.value.length > 0) {
    query.payment_status = logsTabSelectedPaymentStatuses.value[0];
  }
  if (logsTabSelectedUserIds.value.length > 0) {
    query.user_id = logsTabSelectedUserIds.value[0];
  }

  // Call API
  await searchLogsTabEventLogs({
    query,
    page: 1,
    limit: 20,
  });
};

const clearLogsTabFilters = async () => {
  // Clear both temp and actual values
  logsTabTempSearchQuery.value = "";

  logsTabSearchQuery.value = "";

  // Build query keeping Popover filters
  const query: Record<string, string | undefined> = {
    payload_timestamp: buildLogsTabTimestampQuery(),
  };

  if (logsTabSelectedDeviceTypes.value.length > 0) {
    query.device_type = logsTabSelectedDeviceTypes.value[0];
  }
  if (logsTabSelectedPaymentStatuses.value.length > 0) {
    query.payment_status = logsTabSelectedPaymentStatuses.value[0];
  }
  if (logsTabSelectedUserIds.value.length > 0) {
    query.user_id = logsTabSelectedUserIds.value[0];
  }

  await searchLogsTabEventLogs({
    query,
    page: 1,
    limit: 20,
  });
};

// Logs Tab page change handler
const handleLogsTabPageChange = (page: number) => {
  goToLogsTabPage(page);
};

// Check if Logs Tab has any filter pending changes
const logsTabHasFilterChanges = computed(() => {
  return logsTabTempSearchQuery.value !== logsTabSearchQuery.value;
});

// Logs Tab Popover filter functions
const applyLogsTabPopoverFilters = async () => {
  // Update applied state - extract value from objects
  logsTabSelectedUserIds.value = logsTabTempSelectedUserIds.value.map((item) =>
    typeof item === "string" ? item : (item as { value: string }).value
  );
  logsTabSelectedPaymentStatuses.value = logsTabTempSelectedPaymentStatuses.value.map(
    (item) => (typeof item === "string" ? item : (item as { value: string }).value)
  );
  logsTabSelectedDeviceTypes.value = logsTabTempSelectedDeviceTypes.value.map((item) =>
    typeof item === "string" ? item : (item as { value: string }).value
  );

  // Build query for event logs
  const eventLogsQuery: Record<string, string | undefined> = {};

  // Always include timestamp for the selected date range
  eventLogsQuery.payload_timestamp = buildLogsTabTimestampQuery();

  // Device type filter
  if (logsTabSelectedDeviceTypes.value.length > 0) {
    eventLogsQuery.device_type = logsTabSelectedDeviceTypes.value[0];
  }

  // Payment status filter
  if (logsTabSelectedPaymentStatuses.value.length > 0) {
    eventLogsQuery.payment_status = logsTabSelectedPaymentStatuses.value[0];
  }

  // User ID filter
  if (logsTabSelectedUserIds.value.length > 0) {
    eventLogsQuery.user_id = logsTabSelectedUserIds.value[0];
  }

  // Merge Inline filters
  if (logsTabSearchQuery.value.trim()) {
    eventLogsQuery.search = logsTabSearchQuery.value.trim();
  }

  // Fetch event logs
  await searchLogsTabEventLogs({
    query: eventLogsQuery,
    page: 1,
    limit: 20,
  });

  logsTabFilterMenu.value = false;
};

const resetLogsTabPopoverFilters = async () => {
  // Clear both temp and actual values for popover filters
  logsTabTempSelectedUserIds.value = [];
  logsTabTempSelectedPaymentStatuses.value = [];
  logsTabTempSelectedDeviceTypes.value = [];

  logsTabSelectedUserIds.value = [];
  logsTabSelectedPaymentStatuses.value = [];
  logsTabSelectedDeviceTypes.value = [];

  // Build query keeping Inline filters
  const query: Record<string, string | undefined> = {
    payload_timestamp: buildLogsTabTimestampQuery(),
  };

  if (logsTabSearchQuery.value.trim()) {
    query.search = logsTabSearchQuery.value.trim();
  }

  await searchLogsTabEventLogs({
    query,
    page: 1,
    limit: 20,
  });

  logsTabFilterMenu.value = false;
};

// Export handler that works for both tabs
const handleExport = () => {
  if (activeTab.value === "dashboard") {
    exportToExcel(selectedDateObject.value);
  } else {
    // For logs tab, export current month
    exportToExcel(new Date());
  }
};

// Initialize Logs Tab data
const initializeLogsTabData = async () => {
  await searchLogsTabEventLogs({
    query: {
      payload_timestamp: buildLogsTabTimestampQuery(),
    },
    page: 1,
    limit: 20,
  });
};

// Pagination handler
const handlePageChange = (page: number) => {
  goToPage(page);
};

// Check if any filter has pending changes
const hasFilterChanges = computed(() => {
  return (
    tempSearchQuery.value !== searchQuery.value ||
    JSON.stringify([...tempSelectedServiceTypes.value].sort()) !==
      JSON.stringify([...selectedServiceTypes.value].sort())
  );
});

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date);
};

const hasQrPayment = (item: any): boolean => {
  return (
    item.payload?.qr &&
    typeof item.payload.qr.net_amount === "number" &&
    item.payload.qr.net_amount > 0
  );
};

const hasBankNotes = (item: any): boolean => {
  return (
    item.payload?.bank &&
    Object.values(item.payload.bank).some((count: any) => count > 0)
  );
};

const hasCoins = (item: any): boolean => {
  return (
    item.payload?.coin &&
    Object.values(item.payload.coin).some((count: any) => count > 0)
  );
};

// Confirmation dialog for cancel
const showCancelDialog = ref(false);
const selectedEventLogForCancel = ref<string | null>(null);

// Handle cancel event log - show confirmation dialog
const handleCancelEventLog = (eventLogId: string) => {
  selectedEventLogForCancel.value = eventLogId;
  showCancelDialog.value = true;
};

// Confirm cancel event log
const confirmCancelEventLog = async () => {
  if (!selectedEventLogForCancel.value) return;

  // Close dialog first, then show loading on KPI cards and table
  showCancelDialog.value = false;

  // Wait for next tick to ensure dialog is closed before starting
  await nextTick();

  try {
    await cancelEventLog(selectedEventLogForCancel.value);
    selectedEventLogForCancel.value = null;

    // Refresh both event logs table and dashboard charts
    // fetchDashboardSummary() uses currentFilter which is already maintained by updateFilter()
    await Promise.all([refreshSearch(), fetchDashboardSummary()]);
  } catch {
    // Error is already handled in the composable
  }
};

// Watch date range changes for Logs Tab
watch(selectedDateRange, async () => {
  if (activeTab.value === "logs") {
    await searchLogsTabEventLogs({
      query: {
        payload_timestamp: buildLogsTabTimestampQuery(),
      },
      page: 1,
      limit: 20,
    });
  }
});

// Watch tab changes to load Logs Tab data when switching
watch(activeTab, async (newTab) => {
  if (newTab === "logs" && logsTabEventLogs.value.length === 0) {
    await initializeLogsTabData();
  }
});

// Watch Logs Tab filter menu to sync temp values when opened
watch(logsTabFilterMenu, (isOpen) => {
  if (isOpen) {
    // Reconstruct full objects from stored IDs/values
    logsTabTempSelectedUserIds.value = logsTabSelectedUserIds.value
      .map((id) => userOptions.value.find((opt) => opt.value === id))
      .filter(Boolean) as { title: string; value: string }[];

    logsTabTempSelectedPaymentStatuses.value = logsTabSelectedPaymentStatuses.value
      .map((val) => paymentStatusOptions.value.find((opt) => opt.value === val))
      .filter(Boolean) as { label: string; value: string }[];

    logsTabTempSelectedDeviceTypes.value = logsTabSelectedDeviceTypes.value
      .map((val) => deviceTypeOptions.value.find((opt) => opt.value === val))
      .filter(Boolean) as { label: string; value: string }[];
  }
});

// Watch for event logs messages and display them
watch(eventLogsError, (newError) => {
  if (newError) {
    // You can add a snackbar/toast notification here if needed
    console.error(newError);
  }
});

watch(eventLogsSuccess, (newSuccess) => {
  if (newSuccess) {
    // You can add a snackbar/toast notification here if needed
    console.log(newSuccess);
    // Clear the message after a delay
    setTimeout(() => {
      clearEventLogsMessages();
    }, 3000);
  }
});
</script>

<style scoped>
.date-picker {
  min-width: 200px;
}

.date-picker-field {
  min-width: 140px;
  max-width: 180px;
}

.chart-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-border-color), 0.12);
  background: rgba(var(--v-theme-surface), 1);
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.15) !important;
  border-color: rgba(var(--v-border-color), 0.2);
}

.chart-wrapper {
  height: 280px;
  padding: 8px;
}

/* Typography improvements */
:deep(.v-card-title) {
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  letter-spacing: -0.025em !important;
  padding: 20px 24px 8px 24px !important;
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  .date-picker {
    min-width: 160px;
  }

  .chart-wrapper {
    height: 240px;
    padding: 4px;
  }

  :deep(.v-card-title) {
    font-size: 1rem !important;
    padding: 16px 20px 8px 20px !important;
  }
}

@media (max-width: 600px) {
  .chart-wrapper {
    height: 200px;
    padding: 2px;
  }

  :deep(.v-card-title) {
    font-size: 0.875rem !important;
    padding: 12px 16px 6px 16px !important;
  }
}

/* Payment details expandable row styles */
.payment-details-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(var(--v-theme-surface-container-low), 1);
}

.payment-breakdown {
  max-width: 100%;
}

.payment-methods-grid {
  gap: 0;
}

.payment-section {
  position: relative;
  min-height: 200px;
}

.payment-section:not(:last-child)::after {
  content: "";
  position: absolute;
  right: 0;
  top: 10%;
  bottom: 10%;
  width: 1px;
  background: rgba(var(--v-theme-outline), 0.2);
}

.payment-method-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.denomination-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  min-height: 50px;
}

.denomination-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Expand/collapse animation */
:deep(.v-data-table__expanded-row) {
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile layout adjustments */
.mobile-payment-layout {
  width: 100%;
}

.mobile-payment-layout :deep(.v-expansion-panel-title) {
  padding: 12px 16px;
  font-size: 0.875rem;
  font-weight: 500;
}

.mobile-payment-layout :deep(.v-expansion-panel-text__wrapper) {
  padding: 8px 16px 16px;
}

/* Monospace font for transaction ID */
.font-family-monospace {
  font-family: "Roboto Mono", "Monaco", "Consolas", monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

/* Better responsive behavior for denomination cards */
@media (max-width: 960px) {
  .payment-section:not(:last-child)::after {
    display: none;
  }

  .payment-section {
    margin-bottom: 16px;
    min-height: auto;
  }

  .payment-section:not(:last-child) {
    border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
    padding-bottom: 16px;
  }
}

/* Enhanced visual hierarchy */
.payment-details-card :deep(.v-card-text) {
  padding: 24px !important;
}

.payment-method-section .text-subtitle-2 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-weight: 600;
}

.denomination-card .text-body-2 {
  color: rgba(var(--v-theme-on-surface), 0.87);
  line-height: 1.2;
}

.denomination-card .text-caption {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}
</style>
