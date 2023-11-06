function log(...args) {
  console.log.apply(null, ["[webrtc-internal-exporter-override]", ...args]);
}

const PeerConnections = new Map();

log("Override RTCPeerConnection.");

const NativeRTCPeerConnection = window.RTCPeerConnection;
let peerConnectionNextId = 0;

window.RTCPeerConnection = function (options) {
  log(`RTCPeerConnection`, options);

  const pc = new NativeRTCPeerConnection({
    ...options,
  });

  const id = peerConnectionNextId++;
  PeerConnections.set(id, pc);

  const statsInterval = setInterval(async () => {
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
    if (pc.connectionState === "closed") {
      clearInterval(statsInterval);
      PeerConnections.delete(id);
    }
  }, 2000);

  pc.addEventListener("connectionstatechange", () => {
    if (pc.connectionState === "closed") {
      log(`RTCPeerConnection closed (connectionState: ${pc.connectionState})`);
      clearInterval(statsInterval);
      PeerConnections.delete(id);
    }
  });

  return pc;
};

for (const key of Object.keys(NativeRTCPeerConnection)) {
  window.RTCPeerConnection[key] = NativeRTCPeerConnection[key];
}
window.RTCPeerConnection.prototype = NativeRTCPeerConnection.prototype;
