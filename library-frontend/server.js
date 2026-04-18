const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const BASE_DIR = __dirname;
const PORT = Number(process.env.PORT || 5173);

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
};

function getContentType(filePath) {
    return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function resolvePath(requestUrl) {
    const url = new URL(requestUrl, `http://localhost:${PORT}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === "/" || pathname === "") {
        return path.join(BASE_DIR, "index.html");
    }

    if (pathname.startsWith("/static/")) {
        return path.join(BASE_DIR, pathname);
    }

    const filePath = path.join(BASE_DIR, pathname);
    if (path.extname(filePath)) {
        return filePath;
    }

    return path.join(BASE_DIR, "index.html");
}

const server = http.createServer((req, res) => {
    const filePath = resolvePath(req.url || "/");

    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end("Not found");
            return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", getContentType(filePath));
        res.setHeader("Cache-Control", "no-store");
        res.end(data);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Serving vanilla JS frontend at http://localhost:${PORT}`);
});