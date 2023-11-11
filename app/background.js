/* global chrome, pako, base64 */

function log(...args) {
  console.log.apply(null, ["[webrtc-internal-exporter]", ...args]);
}

log("loaded");

import "/assets/pako.min.js";

const DEFAULT_OPTIONS = {
  url: "http://localhost:9091",
  username: "",
  password: "",
  updateInterval: 2,
  gzip: false,
  job: "webrtc-internals-exporter",
  enabledOrigins: {},
  stats: {
    messagesSent: 0,
    bytesSent: 0,
    totalTime: 0,
    errors: 0,
  },
};

// Handle install/update.
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  log("onInstalled", reason);
  if (reason === "install") {
    await chrome.storage.local.set(DEFAULT_OPTIONS);
  } else if (reason === "update") {
    const options = await chrome.storage.local.get();
    await chrome.storage.local.set({
      ...DEFAULT_OPTIONS,
      ...options,
    });
  }
});

// Send data to pushgateway.
async function sendData(data) {
  const { url, username, password, gzip, job, stats } =
    await chrome.storage.local.get();
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (username && password) {
    headers.Authorization =
      "Basic " + base64.encode(`${username}:${password}}`);
  }
  if (gzip) {
    headers["Content-Encoding"] = "gzip";
    data = await pako.gzip(data);
  }
  /* console.log(
    `[webrtc-internals-exporter] sendData: ${data.length} bytes (gzip: ${gzip}) url: ${url} job: ${job}`,
  ); */
  const start = Date.now();
  const response = await fetch(`${url}/metrics/job/${job}`, {
    method: "POST",
    headers,
    body: data,
  });
  stats.messagesSent++;
  stats.bytesSent += data.length;
  stats.totalTime += Date.now() - start;
  if (!response.ok) {
    const text = await response.text();
    stats.errors++;
    throw new Error(`Response status: ${response.status} error: ${text}`);
  }
  await chrome.storage.local.set({ stats });
  return response.text();
}

const QualityLimitationReasons = {
  none: 0,
  bandwidth: 1,
  cpu: 2,
  other: 3,
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // log("message:", message);
  if (message.event === "peer-connection-stats") {
    // log("peer-connection-stats", message.data);
    const { url, id, state, values } = message.data;

    let data = "";
    const sentTypes = new Set();

    values.forEach((value) => {
      const type = value.type.replace(/-/g, "_");
      const labels = [`pageUrl="${url}",peerConnectionId="${id}"`];
      const metrics = [];

      Object.entries(value).forEach(([key, v]) => {
        if (typeof v === "number") {
          metrics.push([key, v]);
        } else if (typeof v === "object") {
          Object.entries(v).forEach(([subkey, subv]) => {
            if (typeof subv === "number") {
              metrics.push([`${key}_${subkey}`, subv]);
            }
          });
        } else if (
          key === "qualityLimitationReason" &&
          QualityLimitationReasons[v] !== undefined
        ) {
          metrics.push([key, QualityLimitationReasons[v]]);
        } else if (key === "googTimingFrameInfo") {
          // TODO
        } else {
          labels.push(`${key}="${v}"`);
        }
      });

      metrics.forEach(([key, v]) => {
        const name = `${type}_${key.replace(/-/g, "_")}`;
        let typeDesc = "";

        if (!sentTypes.has(name)) {
          typeDesc = `# TYPE ${name} gauge\n`;
          sentTypes.add(name);
        }
        data += `${typeDesc}${name}{${labels.join(",")}} ${v}\n`;
      });
    });

    if (data.length > 0) {
      sendData(data + "\n")
        .then((response) => {
          sendResponse({ response });
        })
        .catch((err) => {
          sendResponse({ error: err.message });
        });
    } else {
      sendResponse({});
    }
  } else {
    sendResponse({ error: "unknown event" });
  }

  return true;
});
