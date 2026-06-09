/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOVIDESK_TOKEN: string
  readonly VITE_PLANNER_PLAN_ID: string
  readonly VITE_TENANT_ID: string
  readonly VITE_CLIENT_ID: string
  readonly VITE_CLIENT_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
