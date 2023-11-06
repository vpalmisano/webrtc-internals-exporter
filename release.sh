#!/bin/bash
set -ex

cd app && yarn publish --patch && git push && git push origin $(git tag | sort -V | tail -1) && cd -
