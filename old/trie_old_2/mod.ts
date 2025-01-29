export interface RouteRequest extends Request {
  pathParams?: Record<string, string>;
}

export type RouteHandler = (request: RouteRequest) => Response | Promise<Response>;
export type Middleware = (request: RouteRequest, next: () => Response | Promise<Response>) => Response | Promise<Response>;

export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  handler?: RouteHandler;
  isDynamic: boolean = false;
  paramName?: string;
}

export class Router {
  private root: TrieNode = new TrieNode();
  private middlewares: Middleware[] = [];

  // Add a middleware
  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  // Register a route
  addRoute(path: string, handler: RouteHandler) {
    const segments = path.split("/").filter(Boolean);
    let currentNode = this.root;

    for (const segment of segments) {
      if (segment.startsWith(":")) {
        const paramName = segment.slice(1);
        if (!currentNode.children.has(":dynamic")) {
          const dynamicNode = new TrieNode();
          dynamicNode.isDynamic = true;
          dynamicNode.paramName = paramName;
          currentNode.children.set(":dynamic", dynamicNode);
        }
        currentNode = currentNode.children.get(":dynamic")!;
      } else {
        if (!currentNode.children.has(segment)) {
          currentNode.children.set(segment, new TrieNode());
        }
        currentNode = currentNode.children.get(segment)!;
      }
    }

    currentNode.handler = handler;
  }

  // Match a route and extract parameters
  match(path: string): { handler?: RouteHandler; params: Record<string, string> } {
    const segments = path.split("/").filter(Boolean);
    let currentNode = this.root;
    const params: Record<string, string> = {};

    for (const segment of segments) {
      if (currentNode.children.has(segment)) {
        currentNode = currentNode.children.get(segment)!;
      } else if (currentNode.children.has(":dynamic")) {
        currentNode = currentNode.children.get(":dynamic")!;
        if (currentNode.paramName) {
          params[currentNode.paramName] = segment;
        }
      } else {
        return { handler: undefined, params: {} };
      }
    }

    return { handler: currentNode.handler, params };
  }

  // Handle an incoming request
  handle(request: Request): Response | Promise<Response> {
    const url = new URL(request.url);
    const { handler, params } = this.match(url.pathname);

    if (!handler) {
      return new Response("Not Found", { status: 404 });
    }

    const routeRequest = request as RouteRequest;
    routeRequest.pathParams = params;

    // Middleware pipeline
    let i = -1;
    const next = async (): Promise<Response> => {
      i++;
      if (i < this.middlewares.length) {
        return await this.middlewares[i](routeRequest, next);
      }
      return handler(routeRequest);
    };

    return next();
  }
}
