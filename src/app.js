const path = require("path");
const express = require("express");
const morgan = require("morgan");
const methodOverride = require("method-override");
const hbs = require("hbs");

const apiRoutes = require("./routes/api");
const viewRoutes = require("./routes/viewRoutes");

const app = express();

app.set("view engine", "hbs");
app.set("views", path.join(process.cwd(), "views", "pages"));
hbs.registerPartials(path.join(process.cwd(), "views", "partials"));

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "ArcherLabs" });
});

app.use("/api", apiRoutes);
app.use("/", viewRoutes);

app.use((req, res) => {
    if (req.originalUrl.startsWith("/api")) {
        return res.status(404).json({ error: "API route not found." });
    }
    res.status(404).render("error", {
        title: "Not Found",
        statusCode: 404,
        message: "Page not found."
    });
});

app.use((error, req, res, next) => {
    console.error(error);
    if (req.originalUrl.startsWith("/api")) {
        if (error && error.code === 11000) {
            return res.status(409).json({ error: "Duplicate key violation." });
        }
        return res.status(500).json({ error: "Internal server error." });
    }
    res.status(500).render("error", {
        title: "Server Error",
        statusCode: 500,
        message: "Internal server error."
    });
});

module.exports = app;
