# WebRTC Internals Exporter
A Chromium browser extension that allows to collect WebRTC stats and export them to a Prometheus PushGateway service.

## Install
Run the `./build.sh` script and load the `build` folder as an unpacked extension in your Chromium browser.

## Usage
1. Visit the extension options page, set the PushGateway URL and, optionally, the username and password.
2. Load the page where you want to collect the stats and click on the extension icon to enable the stats collection on that URL (disabled by default).
3. The stats will be collected and sent to the PushGateway service. You can use the provided [Grafana dashboard](https://github.com/vpalmisano/webrtc-internals-exporter/tree/main/grafana) to visualize them.
