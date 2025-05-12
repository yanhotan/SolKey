require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY"
  );
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get all projects with their environments and member count
async function getAllProjects() {
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(
      `
      *,
      environments:environments(count),
      members:project_members(count)
    `
    )
    .order("updated_at", { ascending: false });

  if (projectsError) throw projectsError;

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    environments: project.environments[0].count,
    members: project.members[0].count,
    updatedAt: project.updated_at,
    status: project.status,
  }));
}

// Get a single project with all its details
async function getProjectById(id) {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `
      *,
      environments:environments(
        id,
        name,
        secrets:secrets(
          id,
          name,
          is_locked
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (projectError) throw projectError;

  // Transform the data to match the frontend structure
  const environmentConfigs = {};
  project.environments.forEach((env) => {
    environmentConfigs[env.name] = {
      configs: env.secrets.length,
      secrets: env.secrets.map((secret) => ({
        name: secret.name,
        locked: secret.is_locked,
      })),
    };
  });

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    environments: project.environments.map((e) => e.name),
    updatedAt: project.updated_at,
    status: project.status,
    secrets: environmentConfigs,
  };
}

// Create a new project
async function createProject(projectData) {
  const { name, description, environments } = projectData;

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

  // Create environments
  const environmentInserts = environments.map((envName) => ({
    project_id: project.id,
    name: envName,
  }));

  const { error: envError } = await supabase
    .from("environments")
    .insert(environmentInserts);

  if (envError) throw envError;

  return project;
}

// Update a project
async function updateProject(id, updates) {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a project
async function deleteProject(id) {
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) throw error;
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
