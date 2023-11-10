<script setup>
/* global chrome */

import { reactive, computed } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { helpers } from "@vuelidate/validators";

const state = reactive({
  version: import.meta.env.PACKAGE_VERSION || "dev",
  snackbar: false,
  error: "",
  info: "",
  //
  valid: true,
  url: "",
  username: "",
  password: "",
  updateInterval: 2,
  gzip: false,
  job: "webrtc-internals-exporter",
  labels: "",
  enabledOrigins: {},
  enabledOriginsTableHeaders: [
    {
      title: "Enabled URL Origins",
      key: "origin",
      align: "start",
      sortable: true,
    },
  ],
});

const enabledOriginsTable = computed(() => {
  return (
    Object.entries(state.enabledOrigins)
      // eslint-disable-next-line no-unused-vars
      .filter(([_, enabled]) => enabled)
      .map(([origin]) => ({
        origin,
      }))
  );
});

const rules = computed(() => ({
  password: {
    requiredIfUsername: helpers.withMessage(
      "Password cannot be empty",
      (value, siblings) => {
        return !siblings.username || !!value;
      },
    ),
  },
}));

const v$ = useVuelidate(rules, state);

async function loadOptions() {
  if (chrome.storage) {
    const options = await chrome.storage.local.get();
    Object.assign(state, options);
    state.valid = true;
  } else {
    Object.assign(state, {
      url: "http://localhost:9091",
      username: "",
      password: "",
      updateInterval: 2,
      gzip: false,
      job: "webrtc-internals-exporter",
      labels: "",
      enabledOrigins: { "http://localhost": true, "https://localhost": true },
    });
  }
}

async function saveOptions() {
  if (!state.valid) {
    return;
  }
  if (chrome.storage) {
    await chrome.storage.local.set({
      url: state.url,
      username: state.username,
      password: state.password,
      gzip: state.gzip,
      job: state.job,
      labels: state.labels,
      enabledOrigins: state.enabledOrigins,
    });
  } else {
    console.log("saveOptions", state);
  }
  state.info = "Options saved";
  state.snackbar = true;
}

loadOptions().catch((err) => {
  state.error = `Load options error: ${err.message}`;
});

function removeOrigin(item) {
  const origins = { ...state.enabledOrigins };
  delete origins[item.origin];
  state.enabledOrigins = origins;
}
</script>

<template>
  <v-layout class="rounded rounded-md">
    <v-app-bar title="WebRTC Internals Exporter Options">
      <small class="version">v{{ state.version }}</small>
    </v-app-bar>

    <v-main class="d-flex align-center justify-left" style="min-height: 300px">
      <v-container>
        <v-snackbar v-model="state.snackbar" :timeout="2000" color="primary">
          {{ state.info }}
          <template v-slot:actions>
            <v-btn
              color="indigo"
              variant="text"
              @click="state.snackbar = false"
            >
              Close
            </v-btn>
          </template>
        </v-snackbar>

        <v-row>
          <v-col cols="12" md="12">
            <div v-if="state.error">{{ state.error }}</div>
          </v-col>
        </v-row>

        <v-form v-model="state.valid" @submit.prevent="saveOptions">
          <v-container>
            <v-row>
              <v-col cols="12" md="12">
                <v-text-field
                  color="primary"
                  v-model="state.url"
                  label="Pushgateway URL"
                  clearable
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="12">
                <v-text-field
                  color="primary"
                  v-model="state.username"
                  label="Username"
                  clearable
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="12">
                <v-text-field
                  color="primary"
                  v-model="state.password"
                  label="Password"
                  clearable
                  :error-messages="v$.password.$errors.map((e) => e.$message)"
                  @input="v$.password.$touch"
                  @blur="v$.password.$touch"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="12">
                <v-text-field
                  color="primary"
                  v-model="state.updateInterval"
                  label="Update interval (seconds)"
                  type="number"
                  min="1"
                ></v-text-field>
              </v-col>

              <v-checkbox
                color="primary"
                v-model="state.gzip"
                label="Use gzip compression"
              ></v-checkbox>

              <v-col cols="12" md="12">
                <v-text-field
                  color="primary"
                  v-model="state.job"
                  label="Pushgateway job name"
                  clearable
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="12">
                <v-textarea
                  color="primary"
                  v-model="state.labels"
                  label="Pushgateway additional labels"
                  clearable
                ></v-textarea>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="12">
                <v-data-table
                  :headers="state.enabledOriginsTableHeaders"
                  :items="enabledOriginsTable"
                >
                  <template v-slot:item="{ item }">
                    <tr>
                      <td>
                        <v-icon
                          icon="$delete"
                          @click="() => removeOrigin(item)"
                        ></v-icon>
                        {{ item.origin }}
                      </td>
                    </tr>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-container>

          <v-btn
            color="primary"
            type="submit"
            block
            :disabled="!state.valid"
            @click="v$.$validate"
            >Save options</v-btn
          >
        </v-form>
      </v-container>
    </v-main>
  </v-layout>
</template>

<style scoped>
.version {
  padding-right: 12px;
  text-decoration: none;
}
</style>