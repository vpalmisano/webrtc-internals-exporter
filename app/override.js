function log(...args) {
  console.log.apply(null, ["[webrtc-internal-exporter:override]", ...args]);
}

log("Override RTCPeerConnection.");

class WebrtcInternalExporter {
  peerConnections = new Map();

  url = "";
  enabled = false;
  updateInterval = 2000;
  enabledStats = [];

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

  randomId() {
    return (
      window.crypto?.randomUUID() || (2 ** 64 * Math.random()).toString(16)
    );
  }

  add(pc) {
    const id = this.randomId();
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

    if (this.url && this.enabled) {
      try {
        const stats = await pc.getStats();
        const values = [...stats.values()].filter(
          (v) =>
            ["peer-connection", ...this.enabledStats].indexOf(v.type) !== -1,
        );
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

window.RTCPeerConnection = new Proxy(window.RTCPeerConnection, {
  construct(target, argumentsList) {
    log(`RTCPeerConnection`, argumentsList);

    const pc = new target(...argumentsList);

    webrtcInternalExporter.add(pc);

    return pc;
  },
});
