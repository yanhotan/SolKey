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
const { supabase } = require("../lib/supabase");

// Initialize Supabase client
const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get all projects
router.get("/", async (req, res) => {
  try {
    const { walletAddress } = req.query;

    // Build the query based on wallet address parameter
    let query = supabase
      .from("projects")
      .select("id, name, description, status");

    // If wallet address is provided, filter projects by user membership
    if (walletAddress) {
      // Join with project_members to get only projects associated with this wallet
      query = supabase
        .from("projects")
        .select(
          `
          id, 
          name, 
          description, 
          status,
          project_members!inner(wallet_address)
        `
        )
        .eq("project_members.wallet_address", walletAddress);
    }

    // Execute the query
    const { data: projects, error } = await query.order("name", {
      ascending: true,
    });

    if (error) {
      throw error;
    }

    // Format for frontend
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description || "",
      status: project.status,
    }));    // Format for frontend as expected
    res.json({
      projects: formattedProjects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
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

    if (error) {
      throw error;
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new project
router.post("/", async (req, res) => {
  try {
    const { name, description, environments, creatorId, creatorWalletAddress } = req.body;

    if (!name || !creatorId || !creatorWalletAddress) {
      return res.status(400).json({
        error: "Name, creatorId, and creatorWalletAddress are required fields",
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
          wallet_address: creatorWalletAddress,
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
    console.error("Error creating project:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update a project
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const { data: project, error } = await supabase
      .from("projects")
      .update({
        name,
        description,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a project
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add a team member to a project
router.post("/:projectId/members", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { walletAddress, role } = req.body;

    if (!walletAddress || !role) {
      return res.status(400).json({
        error: "walletAddress and role are required",
      });
    }

    // Get the user ID for the wallet address (invited user)
    const { data: invitedUser, error: invitedUserError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    if (invitedUserError) {
      console.error("Error finding invited user:", invitedUserError);
      return res.status(404).json({ error: "Invited user not found" });
    }

    // Check if user is already a member
    const { data: existingMember, error: memberError } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", invitedUser.id)
      .single();

    if (existingMember) {
      return res.status(400).json({
        error: "User is already a member of this project",
      });
    }

    // Add the new member
    const { data: member, error: insertError } = await supabase
      .from("project_members")
      .insert([
        {
          project_id: projectId,
          user_id: invitedUser.id,
          wallet_address: walletAddress,
          role: role
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error adding member:", insertError);
      throw insertError;
    }

    res.status(201).json(member);
  } catch (error) {
    console.error("Error adding project member:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
