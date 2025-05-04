#!/bin/bash

set -e

VENV_DIR="venv"

sudo apt install -y python3 python3-venv python3-pip

python3 -m venv "$VENV_DIR"

source "$VENV_DIR/bin/activate"

pip install --upgrade pip
pip install -r requirements.txt

chmod +x entrypoint.prod.sh

./entrypoint.prod.sh
