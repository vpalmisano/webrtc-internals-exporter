#!/bin/bash
set -ex

NAME=webrtc-internals-pushgateway-exporter

rm -rf dist && cd app && yarn && yarn build && cd -

version=$(jq -r '.version' app/package.json)
jq ".version = \"${version}\"" manifest.json > dist/manifest.json
cp -r images app/background.js app/content-script.js app/override.js manifest.json README.md dist
cp app/node_modules/pako/dist/pako.min.js dist/assets

# zip ${NAME}_v${version}.zip -r dist
