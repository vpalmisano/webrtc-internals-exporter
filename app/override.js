function log(...args) {
  console.log.apply(null, ["[webrtc-internal-exporter-override]", ...args]);
}

log("Override RTCPeerConnection.");

const NativeRTCPeerConnection = window.RTCPeerConnection;

class WebrtcInternalExporter {
  peerConnections = new Map();
  peerConnectionNextId = 0;

  enabled = false;
  updateInterval = 2000;

  constructor() {
    window.addEventListener("message", async (message) => {
      const { event, options } = message.data;
      if (event === "webrtc-internal-exporter:options") {
        log("options updated:", options);
        Object.assign(this, options);
      }
    });

    window.postMessage({ event: "webrtc-internal-exporter:ready" });
  }

  add(pc) {
    const id = this.peerConnectionNextId++;
    this.peerConnections.set(id, pc);
    pc.addEventListener("connectionstatechange", () => {
      if (pc.connectionState === "closed") {
        this.peerConnections.delete(id);
      }
    });
    this.collectStats(id);
  }

  async collectStats(id) {
    const pc = this.peerConnections.get(id);
    if (!pc) return;

    if (this.enabled) {
      try {
        const stats = await pc.getStats();
        const values = [...stats.values()];
        window.postMessage(
          {
            event: "webrtc-internal-exporter:peer-connection-stats",
            url: window.location.href,
            id,
            state: pc.connectionState,
            values,
          },
          [values],
        );
      } catch (error) {
        log(`collectStats error: ${error.message}`);
      }
    }

    if (pc.connectionState === "closed") {
      this.peerConnections.delete(id);
    } else {
      setTimeout(this.collectStats.bind(this), this.updateInterval, id);
    }
  }
}

const webrtcInternalExporter = new WebrtcInternalExporter();

window.RTCPeerConnection = function (options) {
  log(`RTCPeerConnection`, options);

  const pc = new NativeRTCPeerConnection({
    ...options,
  });

  webrtcInternalExporter.add(pc);

  return pc;
};

for (const key of Object.keys(NativeRTCPeerConnection)) {
  window.RTCPeerConnection[key] = NativeRTCPeerConnection[key];
}
window.RTCPeerConnection.prototype = NativeRTCPeerConnection.prototype;
