// server.js
const path = require("path");
const express = require("express");
const { createRequestHandler } = require("@remix-run/express");
const compression = require("compression");
require("dotenv").config();

const BUILD_DIR = path.join(process.cwd(), "build");

const app = express();

// Add request size limit to handle large API calls
app.use(express.json({ limit: "50mb" }));
app.use(compression());

// Handle asset requests
app.use(
  "/build",
  express.static("public/build", { immutable: true, maxAge: "1y" })
);
app.use(express.static("public", { maxAge: "1h" }));

// Handle Remix requests
app.all(
  "*",
  createRequestHandler({
    build: require(BUILD_DIR),
    mode: process.env.NODE_ENV,
    getLoadContext(req, res) {
      return {
        env: {
          JITSI_DOMAIN: process.env.JITSI_DOMAIN || "meet.jit.si",
          APP_NAME: process.env.APP_NAME || "Jitsi Wrapper",
        },
      };
    },
  })
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
