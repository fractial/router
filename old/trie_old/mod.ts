enum Param {
  Start = "[",
  End = "]",
}

const REGEXP = new RegExp(`\\${Param.Start}(\\w+)\\${Param.End}`, "g");

export interface RouteRequest extends Request {
  pathParams: Map<string, string>;
}

export type RouteResponse = Response | Promise<Response>;
export type RouteHandler = (request: RouteRequest) => RouteResponse;

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  handler?: RouteHandler;
  paramName?: string; // Store parameter name
}

export class Router {
  root = new TrieNode();

  add(path: string, handler: RouteHandler) {
    const segments = path.split("/").filter(Boolean);
    let node = this.root;

    for (const segment of segments) {
      let key = segment;
      let paramName: string | null = null;

      // Check if it's a parameterized segment
      const match = segment.match(REGEXP);
      if (match) {
        key = "*"; // Wildcard for param segments
        paramName = match[1]; // Extract param name (e.g., "userId")
      }

      if (!node.children.has(key)) {
        node.children.set(key, new TrieNode());
      }

      node = node.children.get(key)!;

      // Store the param name in the node if it's a parameter
      if (paramName) {
        node.paramName = paramName;
      }
    }

    node.handler = handler;
  }

  match(path: string): { handler?: RouteHandler; params: Map<string, string> } {
    const params = new Map<string, string>();
    const segments = path.split("/").filter(Boolean);
    let node: TrieNode | undefined = this.root;

    for (const segment of segments) {
      if (node?.children.has(segment)) {
        node = node.children.get(segment);
      } else if (node?.children.has("*")) {
        node = node.children.get("*");
        if (node?.paramName) {
          params.set(node.paramName, segment); // Store correct param name
        }
      } else {
        return { handler: undefined, params };
      }
    }

    return { handler: node?.handler, params };
  }

  // Fixed handler to work with Deno.serve()
  handleRequest(request: Request): Response | Promise<Response> {
    const routeRequest = request as RouteRequest;
    const url = new URL(request.url);
    const { handler, params } = this.match(url.pathname);

    if (handler) {
      routeRequest.pathParams = params;
      return handler(routeRequest);
    }

    return new Response("Not Found", { status: 404 });
  }
}
