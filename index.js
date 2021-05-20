const express = require("express");
const fs = require("fs");
const app = express();
// const cors = require("cors");
const path = require("path");

app.use(express.json());
// app.use(cors());

app.use(express.static(path.join(__dirname, "build")));

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const routesPath = "./routes";

fs.readdirSync(routesPath).forEach(function (file) {
  if (~file.indexOf(".js")) {
    let route = require(routesPath + "/" + file);
    route.setRouter(app);
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server Running at http://localhost:${PORT}/`);
});
