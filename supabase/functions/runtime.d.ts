// Only the Deno APIs used by our entrypoints; shared billing code uses standard Web APIs.
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): unknown;
};
