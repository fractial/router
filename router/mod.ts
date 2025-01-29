export interface RouteRequest extends Request {
  pathParams: Map<string, string>;
}

export type RouteHandler<Addr extends Deno.Addr = Deno.Addr> = (
  request: RouteRequest,
  info: Deno.ServeHandlerInfo<Addr>,
) => Response | Promise<Response>;

export type Route = (path: string, handler: RouteHandler<Deno.NetAddr>) => void;

class Trie {
  public children: Map<string, Trie> = new Map();
  public handler?: RouteHandler<Deno.NetAddr>;
}

export class Router {
  private root = new Trie();

  public add: Route = (path, handler) => {
    let node = this.root;

    const pathSegments = path.split("/").filter(Boolean);

    for (const pathSegment of pathSegments) {
      if (!node.children.has(pathSegment)) node.children.set(pathSegment, new Trie());

      node = node.children.get(pathSegment)!;
    }

    node.handler = handler;
  }

  public readonly handler: Deno.ServeHandler<Deno.NetAddr> = (request, info) => {
    const routeRequest = request as RouteRequest;
    const path = new URL(routeRequest.url).pathname;
    const pathSegments = path.split("/").filter(Boolean);
    let node = this.root;
    const pathParams: RouteRequest["pathParams"] = new Map();

    for (let i = 0; i < pathSegments.length; i++) {
      const pathSegment = pathSegments[i];

      if (node.children.has(pathSegment)) {
        node = node.children.get(pathSegment)!;
      } else {
        const dynamic = Array.from(node.children.keys()).find(key => key.startsWith(":"));
        if (dynamic) {
          node = node.children.get(dynamic)!;
          pathParams.set(dynamic.slice(1), pathSegment);
        } else {
          return new Response("Not Found", {status: 0});
        }
      }
    }

    routeRequest.pathParams = pathParams;

    if (node.handler) {
      return node.handler(routeRequest, info);
    }

    return new Response("Not Found", {status: 404})
  }
}