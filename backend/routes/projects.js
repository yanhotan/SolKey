const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get all projects
router.get("/", async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single project
router.get("/:id", async (req, res) => {
  try {
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        environments (*),
        project_members (*)
      `
      )
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new project
router.post("/", async (req, res) => {
  try {
    const { name, description, environments } = req.body;

    // Start a transaction
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert([
        {
          name,
          description,
          status: "active",
        },
      ])
      .select()
      .single();

    if (projectError) throw projectError;

    // Create environments if provided
    if (environments && environments.length > 0) {
      const { error: envError } = await supabase.from("environments").insert(
        environments.map((env) => ({
          project_id: project.id,
          name: env,
        }))
      );

      if (envError) throw envError;
    }

    // Get the complete project with environments
    const { data: completeProject, error: fetchError } = await supabase
      .from("projects")
      .select(
        `
        *,
        environments (*)
      `
      )
      .eq("id", project.id)
      .single();

    if (fetchError) throw fetchError;

    res.status(201).json(completeProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a project
router.put("/:id", async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const { data: project, error } = await supabase
      .from("projects")
      .update({
        name,
        description,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a project
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
