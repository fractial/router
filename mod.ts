export interface RouteRequest extends Request {
  pathParams: Map<string, string>;
}

export type RouteResponse = Response | Promise<Response>;
export type RouteHandler = (request: RouteRequest) => Response | Promise<Response>;
export type Route = (path: string, handler: RouteHandler) => void;

export const routes = new Map<string | RegExp, RouteHandler>();

export const route: Route = (path, handler) => {
  if (path.includes("<")) {
    const regExpPath = path.replace(/<(\w+)>/g, "(?<$1>[^/]+)");
    const regExp = new RegExp(`^${regExpPath}$`);
    routes.set(regExp, handler);
  } else {
    routes.set(path, handler);
  }
}

export const handler: Deno.ServeHandler<Deno.NetAddr> = (request) => {
  const routeRequest = request as RouteRequest;
  const url = new URL(routeRequest.url);
  // const pathSegments = url.pathname.split("/").filter(Boolean);

  for (const [routeKey, routeHandler] of routes) {
    let match: RegExpMatchArray | null;

    if (typeof routeKey === "string" && routeKey === url.pathname) {
      return routeHandler(request as RouteRequest);
    }

    if (routeKey instanceof RegExp) {
      match = url.pathname.match(routeKey);

      if (match !== null && match.groups && match.groups !== undefined) {
        const pathParams = new Map<string, string>();
        
          for (const groupName in match.groups) {
            if (Object.prototype.hasOwnProperty.call(match.groups, groupName)) {
              pathParams.set(groupName, match.groups[groupName]);
            }
          }

        routeRequest.pathParams = pathParams;
        return routeHandler(routeRequest);
      }
    }
  }

  return new Response("Not Found", {status: 404})
}