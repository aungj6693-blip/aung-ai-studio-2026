
const http = require("http");

const PORT = process.env.PORT || 3000;
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      name: "AUNG AI Studio",
      status: "online",
      service: "AI Backend"
    }));
  }

  if (req.url.startsWith("/api/")) {
    if (!WORKER_URL) {
      res.writeHead(503, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        error: "Cloudflare Worker URL is not configured"
      }));
    }

    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);

      const response = await fetch(
        WORKER_URL.replace(/\/$/, "") + req.url,
        {
          method: req.method,
          headers: {
            "Content-Type": req.headers["content-type"] || "application/json",
            "Authorization": req.headers.authorization || ""
          },
          body: ["GET", "HEAD"].includes(req.method)
            ? undefined
            : Buffer.concat(chunks)
        }
      );

      const data = await response.text();
      res.writeHead(response.status, {
        "Content-Type": response.headers.get("content-type") || "application/json"
      });
      return res.end(data);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Backend connection failed" }));
    }
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("AUNG AI Studio is running on port " + PORT);
});
