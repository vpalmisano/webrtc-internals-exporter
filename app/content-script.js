/* global chrome */

function log(...args) {
  if (localStorage.getItem("webrtc-internal-exporter:debug") === "true") {
    console.log.apply(null, ["[webrtc-internal-exporter]", ...args]);
  }
}

function injectScript(file_path) {
  const head = document.querySelector("head");
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file_path);
  head.appendChild(script);
}

setTimeout(() => {
  injectScript(chrome.runtime.getURL("override.js"));
});

//
window.addEventListener("message", async (message) => {
  const { event, url, id, state, values } = message.data;
  if (event === "webrtc-internal-exporter:peer-connection-stats") {
    log("message", { event, url, id, state, values });
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
