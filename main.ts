import { handler, route } from "./mod.ts";

route("/", (_) => {
  return new Response("Ich mag Bäume", {status: 200})
})

route("/<id>/<id2>", (_req) => {
  return new Response(_req.pathParams.get("id2"))
})

route("/home", (_req) => {
  return new Response(_req.method)
})

if (import.meta.main) {
  Deno.serve({port: 2000}, handler);
}