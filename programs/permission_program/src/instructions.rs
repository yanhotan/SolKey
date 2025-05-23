use anchor_lang::prelude::*;
use crate::program_accounts::{InitializeProject, AddMember, RemoveMember, IsMember};
use crate::state::MAX_MEMBERS;
use crate::error::PermissionError;

pub fn initialize_project(ctx: Context<InitializeProject>) -> Result<()> {
    let project = &mut ctx.accounts.project;
    project.owner = *ctx.accounts.owner.key;
    project.members = Vec::new();
    project.bump = ctx.bumps.project;
    msg!("Project initialized for owner: {}", project.owner);
    Ok(())
}

pub fn add_member(ctx: Context<AddMember>, member_to_add: Pubkey) -> Result<()> {
    let project = &mut ctx.accounts.project;

    if project.members.contains(&member_to_add) {
        return err!(PermissionError::MemberAlreadyExists);
    }

    if project.members.len() >= MAX_MEMBERS {
        return err!(PermissionError::MaxMembersReached);
    }

    project.members.push(member_to_add);
    msg!("Member {} added to the project by owner {}", member_to_add, project.owner);
    Ok(())
}

pub fn remove_member(ctx: Context<RemoveMember>, member_to_remove: Pubkey) -> Result<()> {
    let project = &mut ctx.accounts.project;

    if let Some(index) = project.members.iter().position(|&m| m == member_to_remove) {
        project.members.remove(index);
        msg!("Member {} removed from the project by owner {}", member_to_remove, project.owner);
    } else {
        return err!(PermissionError::MemberNotFound);
    }

    Ok(())
}

pub fn process_check_is_member(ctx: Context<IsMember>, member_to_check: Pubkey, _project_owner_on_chain: Pubkey) -> Result<()> {
    let project = &ctx.accounts.project;
    
    if !project.members.contains(&member_to_check) {
        msg!("Member {} not found in project owned by {}.", member_to_check, project.owner);
        return err!(PermissionError::MemberNotFound);
    }
    msg!("Member {} is verified for project owned by {}.", member_to_check, project.owner);
    Ok(())
} 