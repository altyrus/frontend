/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_MQTT_BROKER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
