const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const {
  getAllProjects,
  getProjectById,
  getProjectsByUserId,
  getProjectsByMemberId,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
} = require("../db/projects");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get all projects
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    const projects = await getAllProjects(userId);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get projects where user is a team member
router.get("/member/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const projects = await getProjectsByMemberId(userId);
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
        project_members (*), 
        secrets (*)
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
    const { name, description, environments, creatorId } = req.body;

    if (!name || !creatorId) {
      return res.status(400).json({
        error: "Name and creatorId are required fields",
      });
    }

    // Start a transaction
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert([
        {
          name,
          description,
          status: "active",
          creator_id: creatorId,
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

    // Add creator as a project member with 'owner' role
    const { error: memberError } = await supabase
      .from("project_members")
      .insert([
        {
          project_id: project.id,
          user_id: creatorId,
          role: "owner",
        },
      ]);

    if (memberError) throw memberError;

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

// Add a team member to a project
router.post("/:projectId/members", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }

    const member = await addProjectMember(projectId, userId, role);
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
