import { Router } from "./router/mod.ts";

class AsyncResponse extends Response {
  constructor(delay: number = 1000, body: string = "") {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        setTimeout(() => {
          controller.enqueue(new TextEncoder().encode(body));
          controller.close();
        }, delay);
      }
    });

    super(stream);
  }
}

const router = new Router();

router.add("/", (_request) => {
  return new AsyncResponse(10000, "Waited for 10s")
})

router.add("/home", (_request) => {
  return new Response("Home")
})

router.add("/:home", (request) => {
  return new Response(request.pathParams.get("home"))
})

router.add("/:home/:id", (request) => {
  return new Response(request.pathParams.get("id"))
})


Deno.serve(router)