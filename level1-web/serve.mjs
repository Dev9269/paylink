import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
app.use(express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)))));
app.listen(3100, () => console.log("[level1-web] http://localhost:3100"));