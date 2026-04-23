@echo off
setlocal
cd /d "%~dp0\license-backend"

python generate_license_gui.py
