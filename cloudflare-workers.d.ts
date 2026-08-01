declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
  };
}

type D1Database = any;

type Fetcher = {
  fetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response>;
};
