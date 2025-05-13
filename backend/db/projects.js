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
async function getAllProjects(userId = null) {
  let query = supabase
    .from("projects")
    .select(
      `
      *,
      environments:environments(count),
      members:project_members(count)
    `
    )
    .order("updated_at", { ascending: false });

  // If userId is provided, filter projects by creator_id
  if (userId) {
    query = query.eq("creator_id", userId);
  }

  const { data: projects, error: projectsError } = await query;

  if (projectsError) throw projectsError;

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    environments: project.environments[0].count,
    members: project.members[0].count,
    updatedAt: project.updated_at,
    status: project.status,
    creatorId: project.creator_id,
  }));
}

// Get projects by user ID
async function getProjectsByUserId(userId) {
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(
      `
      *,
      environments:environments(count),
      members:project_members(count)
    `
    )
    .eq("creator_id", userId)
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
    creatorId: project.creator_id,
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
  const { name, description, environments, creatorId } = projectData;

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

// Get projects where user is a team member
async function getProjectsByMemberId(userId) {
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(
      `
      *,
      environments:environments(count),
      members:project_members(count),
      project_members!inner(
        role,
        wallet_address
      )
    `
    )
    .eq("project_members.user_id", userId)
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
    creatorId: project.creator_id,
    role: project.project_members[0].role,
    walletAddress: project.project_members[0].wallet_address,
  }));
}

// Add a team member to a project
async function addProjectMember(projectId, userId, role = "member") {
  try {
    // First check if the project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (projectError) throw new Error("Project not found");

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, wallet_address")
      .eq("id", userId)
      .single();

    if (userError) throw new Error("User not found");

    // Check if user is already a member
    const { data: existingMember, error: memberError } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (existingMember) {
      throw new Error("User is already a member of this project");
    }

    // Add the new member
    const { data: member, error: insertError } = await supabase
      .from("project_members")
      .insert([
        {
          project_id: projectId,
          user_id: userId,
          wallet_address: user.wallet_address,
          role: role,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return member;
  } catch (error) {
    throw new Error(`Failed to add team member: ${error.message}`);
  }
}

async function getEnvironmentsByProjectId(projectId) {
  const { data, error } = await supabase
    .from("environments")
    .select("*")
    .eq("project_id", projectId)

  if (error) throw error
  return data
}


module.exports = {
  getAllProjects,
  getProjectById,
  getProjectsByUserId,
  getProjectsByMemberId,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  getEnvironmentsByProjectId,
};
