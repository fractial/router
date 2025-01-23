interface RouteRequest extends Request {
  pathParams: Map<string, string>;
}

interface RouteValue {
  handler: Handler;
  segments: string[];
  dynamics: number[];
}

type Path = string | string[];
type Handler = (request: RouteRequest) => Response | Promise<Response>;
type Route = (path: Path, handler: Handler) => void;

export const routes = new Map<string, RouteValue>();

export const handler: Handler = (request) => {
const routeRequest = request as RouteRequest;
  const pathname = new URL(request.url).pathname.split("/").filter(Boolean);

  return new Response("Not Found", { status: 404 });
};

export const route: Route = (path, handler) => {
  const segments = Array.isArray(path) ? path : path.split("/").filter(Boolean);

  const dynamics = segments
    .map((segment, index) =>
      segment.includes("[") && segment.includes("]") ? index : -1
    )
    .filter((index) => index !== -1);

  routes.set(segments.join("/"), {
    handler,
    segments,
    dynamics,
  });
};
