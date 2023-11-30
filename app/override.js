class WebrtcInternalsExporter {
  peerConnections = new Map();

  url = "";
  enabled = false;
  updateInterval = 2000;
  enabledStats = [];

  constructor() {
    window.addEventListener("message", async (message) => {
      const { event, options } = message.data;
      if (event === "webrtc-internal-exporter:options") {
        Object.assign(this, options);
      }
    });

    window.postMessage({ event: "webrtc-internal-exporter:ready" });
  }

  static log(...args) {
    console.log.apply(null, ["[webrtc-internal-exporter:override]", ...args]);
  }

  static randomId() {
    if ("randomUUID" in window.crypto) {
      return window.crypto.randomUUID();
    } else {
      return (2 ** 64 * Math.random()).toString(16);
    }
  }

  add(pc) {
    const id = WebrtcInternalsExporter.randomId();
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
        WebrtcInternalsExporter.log(`collectStats error: ${error.message}`);
      }
    }

    if (pc.connectionState === "closed") {
      this.peerConnections.delete(id);
    } else {
      setTimeout(this.collectStats.bind(this), this.updateInterval, id);
    }
  }
}

const webrtcInternalsExporter = new WebrtcInternalsExporter();

window.RTCPeerConnection = new Proxy(window.RTCPeerConnection, {
  construct(target, argumentsList) {
    WebrtcInternalsExporter.log(`RTCPeerConnection`, argumentsList);

    const pc = new target(...argumentsList);

    webrtcInternalsExporter.add(pc);

    return pc;
  },
});
