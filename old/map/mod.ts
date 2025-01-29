export interface RouteRequest extends Request {
  pathParams: Map<string, string>;
}

export type OptionPromise<T> = T | Promise<T>;
export type RouteResponse = OptionPromise<Response>;
export type RouteHandler = (
  request: RouteRequest,
) => OptionPromise<Response>;
export type Route = (path: string, handler: RouteHandler) => void;

enum Param {
  Start = "[",
  End = "]",
}

export class Router {
  private static REGEXP = new RegExp(`\\${Param.Start}(\\w+)\\${Param.End}`, "g");
  private cache = new Map<string, RegExp>();
  private routes = new Map<string | RegExp, RouteHandler>();

  add: Route = (path, handler) => {
    if (path.includes(Param.Start)) {
      if (!this.cache.has(path)) {
        const regExpPath = path.replace(Router.REGEXP, "(?<$1>[^/]+)");
        const regExp = new RegExp(`^${regExpPath}$`);
        this.cache.set(path, regExp);
      }
      this.routes.set(this.cache.get(path)!, handler);
    } else {
      this.routes.set(path, handler);
    }
  };

  handler: Deno.ServeHandler<Deno.NetAddr> = (request) => {
    const routeRequest = request as RouteRequest;
    const url = new URL(routeRequest.url);

    if (this.routes.has(url.pathname)) {
      const routeHandler = this.routes.get(url.pathname)!;
      return routeHandler(routeRequest);
    }

    for (const [routeKey, routeHandler] of this.routes) {
      if (routeKey instanceof RegExp) {
        const match = url.pathname.match(routeKey);
        if (match?.groups) {
          const pathParams = new Map<string, string>();
          Object.entries(match.groups).forEach(([key, value]) => {
            pathParams.set(key, value);
          });
          routeRequest.pathParams = pathParams;
          return routeHandler(routeRequest);
        }
      }
    }

    return new Response("Not Found", { status: 404 });
  };
}
