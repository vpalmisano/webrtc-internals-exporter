<script setup>
import { reactive } from "vue";

const props = defineProps([]);

const state = reactive({
  error: "",
  version: import.meta.env.PACKAGE_VERSION || "dev",
});

// Saves options to chrome.storage
const saveOptions = () => {
  const color = document.getElementById("color").value;
  const likesColor = document.getElementById("like").checked;

  // eslint-disable-next-line no-undef
  chrome.storage.sync.set(
    { favoriteColor: color, likesColor: likesColor },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(() => {
        status.textContent = "";
      }, 750);
    },
  );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  // eslint-disable-next-line no-undef
  chrome.storage.sync.get(
    { favoriteColor: "red", likesColor: true },
    (items) => {
      document.getElementById("color").value = items.favoriteColor;
      document.getElementById("like").checked = items.likesColor;
    },
  );
};
</script>

<template>
  <div class="container-fluid">
    <h4><i class="bi bi-tools"></i> Options</h4>
  </div>
</template>

<style scoped>
a.version {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.7rem;
  text-decoration: none;
}
</style>
