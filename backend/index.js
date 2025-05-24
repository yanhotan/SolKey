require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { supabase } = require("./lib/supabase");
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require("./db/projects");

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Routes
const projectsRouter = require("./routes/projects");
const secretsRouter = require("./routes/secrets");
const usersRouter = require("./routes/users");
const environmentsRouter = require("./routes/environments");

app.use("/api/projects", projectsRouter);
app.use("/api/secrets", secretsRouter);
app.use("/api/users", usersRouter);
app.use("/api/environments", environmentsRouter);

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Get all projects
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single project
app.get("/api/projects/:id", async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new project
app.post("/api/projects", async (req, res) => {
  try {
    const project = await createProject(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a project
app.put("/api/projects/:id", async (req, res) => {
  try {
    const project = await updateProject(req.params.id, req.body);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a project
app.delete("/api/projects/:id", async (req, res) => {
  try {
    await deleteProject(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
