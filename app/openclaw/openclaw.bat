@echo off
SET AI_MEMORY_PATH=E:\weP-APP-main\weP-APP-main\ai
SET GEP_ROOT_PATH=E:\weP-APP-main\weP-APP-main
SET OPENCLAW_GOVERNANCE_MODE=strict
REM API keys are loaded from .env by dotenv — do NOT override here
.\node_modules\.bin\tsx scripts/run.ts %*
