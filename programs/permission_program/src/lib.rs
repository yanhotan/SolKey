use anchor_lang::prelude::*;

mod program_accounts;
mod error;
mod instructions;
mod state;

use program_accounts::*; // Brings InitializeProject, AddMember, RemoveMember, IsMember into scope

// Replace with your program's actual ID after deployment.
// You can get this ID after running `anchor deploy` or `anchor build` and then `solana address -k target/deploy/permission_program-keypair.json`
declare_id!("5vgcyZfQpbG1Fwthj4fkVfvwe371gTzUtjUN6p5nzUZ3"); 

#[program]
pub mod permission_program {
    use super::*; // Makes items from outer scope (like InitializeProject, instructions module) available

    pub fn initialize_project(ctx: Context<InitializeProject>) -> Result<()> {
        instructions::initialize_project(ctx)
    }

    pub fn add_member(ctx: Context<AddMember>, member_to_add: Pubkey) -> Result<()> {
        instructions::add_member(ctx, member_to_add)
    }

    pub fn remove_member(ctx: Context<RemoveMember>, member_to_remove: Pubkey) -> Result<()> {
        instructions::remove_member(ctx, member_to_remove)
    }

    pub fn check_is_member(ctx: Context<IsMember>, member_to_check: Pubkey, project_owner_on_chain: Pubkey) -> Result<()> {
        instructions::process_check_is_member(ctx, member_to_check, project_owner_on_chain)
    }
}
