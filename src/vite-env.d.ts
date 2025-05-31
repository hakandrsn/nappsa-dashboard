/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VITE_SUPABASE_KEY: string;
    [key: string]: string | undefined;
  };
}
