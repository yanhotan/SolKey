use anchor_lang::prelude::*;

pub const MAX_MEMBERS: usize = 10; // Example: Maximum 10 members per project

#[account]
pub struct Project {
    pub owner: Pubkey,
    pub members: Vec<Pubkey>,
    pub bump: u8, // Bump seed for PDA
}

impl Project {
    // Calculate space based on max_members
    // Discriminator (8) + owner (32) + members vector (4 for length + MAX_MEMBERS * 32) + bump (1)
    pub const MAX_SIZE: usize = 8 + 32 + 4 + (MAX_MEMBERS * 32) + 1;
} 