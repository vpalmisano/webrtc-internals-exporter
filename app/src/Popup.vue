<script setup>
/* global chrome */

import { reactive } from "vue";

const state = reactive({
  version: import.meta.env.PACKAGE_VERSION || "dev",
  error: "",
  info: "",
  enabled: false,
  origin: "",
  enabledOrigins: {},
});

async function loadOptions() {
  const { enabledOrigins } = await chrome.storage.local.get("enabledOrigins");
  state.enabledOrigins = enabledOrigins;
  state.enabled = !!state.enabledOrigins[state.origin];
}

async function saveOptions(value) {
  console.log("saveOptions", state.origin, value);
  if (value) {
    state.enabledOrigins = {
      ...state.enabledOrigins,
      [state.origin]: value,
    };
  } else {
    const origins = { ...state.enabledOrigins };
    delete origins[state.origin];
    state.enabledOrigins = origins;
  }

  if (chrome.storage) {
    await chrome.storage.local.set({ enabledOrigins: state.enabledOrigins });
  }
}

chrome.tabs
  .query({ active: true, currentWindow: true })
  .then((tabs) => {
    const tab = tabs[0];
    return chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        return window.location.origin;
      },
    });
  })
  .then((injectionResults) => {
    state.origin = injectionResults[0].result;
  })
  .then(() => {
    return loadOptions();
  })
  .catch((err) => {
    console.error("Load options error:", err);
    state.error = `Load options error: ${err.message}`;
  });
</script>

<template>
  <v-layout class="rounded rounded-md">
    <v-app-bar title="WebRTC Internals Exporter"></v-app-bar>

    <v-main class="d-flex align-center justify-left" style="min-width: 20rem">
      <v-container>
        <v-row>
          <v-col cols="12" md="12">
            <v-alert
              v-if="state.error.length > 0"
              :text="state.error"
              type="error"
            ></v-alert>

            <v-checkbox
              color="primary"
              v-model="state.enabled"
              :label="'Enable for ' + state.origin"
              @update:model-value="saveOptions"
              hide-details
            ></v-checkbox>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-layout>
</template>

<style scoped></style>
