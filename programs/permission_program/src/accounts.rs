use anchor_lang::prelude::*;
use crate::state::{Project};
use crate::error::PermissionError; // Required for the constraint message

#[derive(Accounts)]
pub struct InitializeProject<'info> {
    #[account(
        init,
        payer = owner,
        space = Project::MAX_SIZE,
        seeds = [b"project".as_ref(), owner.key().as_ref()],
        bump
    )]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddMember<'info> {
    #[account(
        mut,
        seeds = [b"project".as_ref(), owner.key().as_ref()],
        bump = project.bump,
        has_one = owner @ PermissionError::Unauthorized
    )]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct RemoveMember<'info> {
    #[account(
        mut,
        seeds = [b"project".as_ref(), owner.key().as_ref()],
        bump = project.bump,
        has_one = owner @ PermissionError::Unauthorized
    )]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(member_to_check: Pubkey, project_owner_on_chain: Pubkey)]
pub struct IsMember<'info> {
    #[account(
        seeds = [b"project".as_ref(), project_owner_on_chain.as_ref()],
        bump = project.bump,
        constraint = project.owner == project_owner_on_chain @ PermissionError::Unauthorized
    )]
    pub project: Account<'info, Project>,
} 