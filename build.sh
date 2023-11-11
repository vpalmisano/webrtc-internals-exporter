#!/bin/bash
set -ex

NAME=webrtc-internals-exporter
OUTDIR=build

cd app && yarn && yarn build && cd -

npm_package_version=$(jq -r '.version' app/package.json)
jq ".version = \"${npm_package_version}\"" manifest.json > ${OUTDIR}/manifest.json
cp -r images app/background.js app/content-script.js app/override.js README.md ${OUTDIR}
cp app/node_modules/pako/dist/pako.min.js ${OUTDIR}/assets

zip ${NAME}_v${npm_package_version}.zip -r ${OUTDIR}
