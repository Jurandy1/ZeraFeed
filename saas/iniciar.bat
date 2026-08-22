@echo off
cd /d "%~dp0"
if not exist .venv (
  python -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install -r requirements.txt -q
if not exist .env (
  echo Copie o .env.example para .env, gere a FERNET_KEY e preencha admin/PIX.
  pause
  exit /b 1
)
python app.py
