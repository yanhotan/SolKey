const express = require("express");
const router = express.Router();
const { supabase } = require("../lib/supabase");

// Get all environments
router.get("/", async (req, res) => {
  try {
    const { projectId } = req.query;
    
    let query = supabase
      .from("environments")
      .select("id, name, project_id")
      .order("name", { ascending: true });
      
    // Filter by project if provided
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    
    const { data: environments, error } = await query;

    if (error) {
      throw error;
    }

    // Format for frontend as expected
    res.json({ 
      environments: environments.map(env => ({
        id: env.id,
        name: env.name,
        projectId: env.project_id
      })) 
    });
  } catch (error) {
    console.error("Error fetching environments:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single environment
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data: environment, error } = await supabase
      .from("environments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    res.json(environment);
  } catch (error) {
    console.error("Error fetching environment:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new environment
router.post("/", async (req, res) => {
  try {
    const { name, projectId } = req.body;
    
    if (!name || !projectId) {
      return res.status(400).json({ 
        error: "Environment name and project ID are required" 
      });
    }

    const { data: environment, error } = await supabase
      .from("environments")
      .insert([{ 
        name, 
        project_id: projectId 
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(environment);
  } catch (error) {
    console.error("Error creating environment:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update an environment
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Environment name is required" });
    }

    const { data: environment, error } = await supabase
      .from("environments")
      .update({ name })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(environment);
  } catch (error) {
    console.error("Error updating environment:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete an environment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("environments")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting environment:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 