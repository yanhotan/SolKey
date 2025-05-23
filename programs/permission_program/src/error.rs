use anchor_lang::prelude::*;

#[error_code]
pub enum PermissionError {
    #[msg("The user is not authorized to perform this action.")]
    Unauthorized,
    #[msg("The member is already part of the project.")]
    MemberAlreadyExists,
    #[msg("The member was not found in the project.")]
    MemberNotFound,
    #[msg("Maximum number of members reached.")]
    MaxMembersReached,
} 