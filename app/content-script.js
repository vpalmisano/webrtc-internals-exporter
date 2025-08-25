/* global chrome */

if (window.location.protocol.startsWith("http")) {
  const log = (...args) => {
    try {
      if (localStorage.getItem("webrtc-internal-exporter:debug") === "true") {
        console.log.apply(null, [
          "[webrtc-internal-exporter:content-script]",
          ...args,
        ]);
      }
    } catch (error) {
      // Ignore localStorage errors.
    }
  };

  const injectScript = (file_path) => {
    const head = document.querySelector("head");
    const script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", file_path);
    head.appendChild(script);
  };

  setTimeout(() => injectScript(chrome.runtime.getURL("override.js")));

  // Handle options.
  const options = {
    url: "",
    enabled: false,
    updateInterval: 2000,
    enabledStats: [],
  };

  const sendOptions = () => {
    window.postMessage({
      event: "webrtc-internal-exporter:options",
      options,
    });
  };

  try {
    chrome.storage.sync
      .get(["url", "enabledOrigins", "updateInterval", "enabledStats"])
      .then((ret) => {
        log(`options loaded:`, ret);
        options.url = ret.url || "";
        options.enabled =
          ret.enabledOrigins &&
          ret.enabledOrigins[window.location.origin] === true;
        options.updateInterval = (ret.updateInterval || 2) * 1000;
        options.enabledStats = Object.values(ret.enabledStats || {});
        sendOptions();
      });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;

      let changed = false;
      for (let [key, { newValue }] of Object.entries(changes)) {
        if (key === "url") {
          options.url = newValue;
          changed = true;
        } else if (key === "enabledOrigins") {
          options.enabled = newValue[window.location.origin] === true;
          changed = true;
        } else if (key === "updateInterval") {
          options.updateInterval = newValue * 1000;
          changed = true;
        } else if (key === "enabledStats") {
          options.enabledStats = Object.values(newValue);
          changed = true;
        }
      }
      if (changed) {
        log(`options changed:`, options);
        sendOptions();
      }
    });

    // Handle stats messages.
    window.addEventListener("message", async (message) => {
      if (!message?.data) return;
      const { event, url, id, state, values } = message.data;
      if (event === "webrtc-internal-exporter:ready") {
        sendOptions();
      } else if (event === "webrtc-internal-exporter:peer-connection-stats") {
        log("peer-connection-stats", { url, id, state, values });
        try {
          const response = await chrome.runtime.sendMessage({
            event: "peer-connection-stats",
            data: {
              url,
              id,
              state,
              values,
            },
          });
          if (response.error) {
            log(`error: ${response.error}`);
          }
        } catch (error) {
          log(`error: ${error.message}`);
        }
      }
    });
  } catch (error) {
    console.error(
      `[webrtc-internal-exporter:content-script] error: ${error.message}`,
      error,
    );
  }
}
