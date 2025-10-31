<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h6 d-flex align-center">
            <span>เครื่องมือดีบัก MQTT (WebView)</span>
            <v-spacer />
            <v-tooltip text="เปิดในแท็บใหม่" location="bottom">
              <template #activator="{ props }">
                <v-btn v-bind="props" :href="currentUrl" target="_blank" icon size="small" aria-label="เปิดในแท็บใหม่">
                  <v-icon>mdi-open-in-new</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </v-card-title>
          <v-card-text class="pa-0">
            <ClientOnly>
              <div class="webview-wrapper">
                <iframe ref="iframeRef" :src="currentUrl" title="webview" />
              </div>
            </ClientOnly>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  
</template>

<script setup lang="ts">
import { ref } from 'vue'

const iframeRef = ref<HTMLIFrameElement | null>(null)
const config = useRuntimeConfig()
const currentUrl = ref<string>(`${config.public.apiUrl ?? 'http://localhost:3000'}/mqtt-console`)
</script>

<style scoped>
.webview-wrapper {
  width: 100%;
  height: calc(100vh - 220px);
  /* ปรับความสูงให้พอดีกับหน้าจอ ลบส่วนหัวควบคุม */
}

.webview-wrapper iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.empty-state {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

