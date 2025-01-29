import { handler, route } from "./map/mod.ts";

route("/", (_) => {
  return new Response("Ich mag Bäume", { status: 200 });
});

route("/[id]", (_req) => {
  return new Response(_req.pathParams.get("id"));
});
route("/[id]/a", (_req) => {
  return new Response(`Amogus: ${_req.pathParams.get("id")}`);
});

route("/home", (_req) => {
  return new Response("Home");
});

if (import.meta.main) {
  Deno.serve({ port: 2000 }, handler);
}
