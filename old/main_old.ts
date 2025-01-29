import { Router } from "./map/mod.ts";

const kv = await Deno.openKv();

const router = new Router();

router.add("/post", async (req) => {
  const body = await req.json();
  const id = crypto.randomUUID();

  const locationKey = ["locations", id];
  const locationData = {
    id,
    name: body.name,
    description: body.description,
    lat: body.lat,
    lng: body.lng,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await kv.set(locationKey, locationData);
  
  return new Response(JSON.stringify({ message: "Location saved", id }), { status: 201 });
})

// router.add("/get/[id]", async (req) => {
//   const id = req.pathParams.get("id");
//   const result = await kv.get(["locations", id]);

//   if (!result.value) {
//     return new Response(JSON.stringify({ error: "Location not found" }), { status: 404 });
//   }

//   return new Response(JSON.stringify(result.value), { status: 200 });
// })

router.add("/get", async (_req) => {
  const locations = [];
  for await (const entry of kv.list({ prefix: ["locations"] })) {
    locations.push(entry.value);
  }

  return new Response(JSON.stringify(locations), { status: 200 });
});

Deno.serve(router.handler)