#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    NextTokenId,
    Badge(u64),         // token_id -> BadgeInfo
    UserBadges(Address), // user -> Vec<u64> (token IDs)
    ModuleBadge(Address, String), // (user, module_id) -> token_id
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct BadgeInfo {
    pub owner: Address,
    pub module_id: String,
    pub module_title: String,
    pub xp_earned: i128,
    pub quiz_score: u32,
    pub timestamp: u64,
}

#[contract]
pub struct BadgeNft;

#[contractimpl]
impl BadgeNft {
    /// Initialize the contract with an admin address
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextTokenId, &1u64);
    }

    /// Mint a badge NFT for completing a module.
    /// Only callable by admin. One badge per user per module.
    pub fn mint_badge(
        env: Env,
        user: Address,
        module_id: String,
        module_title: String,
        xp_earned: i128,
        quiz_score: u32,
    ) -> u64 {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        // Check not already minted for this module
        let module_key = DataKey::ModuleBadge(user.clone(), module_id.clone());
        if env.storage().persistent().has(&module_key) {
            panic!("badge already minted for this module");
        }

        // Get next token ID
        let token_id: u64 = env.storage().instance().get(&DataKey::NextTokenId).unwrap();
        env.storage().instance().set(&DataKey::NextTokenId, &(token_id + 1));

        // Create badge info
        let badge = BadgeInfo {
            owner: user.clone(),
            module_id: module_id.clone(),
            module_title,
            xp_earned,
            quiz_score,
            timestamp: env.ledger().timestamp(),
        };

        // Store badge
        env.storage().persistent().set(&DataKey::Badge(token_id), &badge);

        // Add to user's badge list
        let user_key = DataKey::UserBadges(user.clone());
        let mut badges: Vec<u64> = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or(Vec::new(&env));
        badges.push_back(token_id);
        env.storage().persistent().set(&user_key, &badges);

        // Map module -> token
        env.storage().persistent().set(&module_key, &token_id);

        // Emit event
        env.events().publish(
            (symbol_short!("badge"), user.clone()),
            token_id,
        );

        token_id
    }

    /// Get badge info by token ID
    pub fn get_badge(env: Env, token_id: u64) -> BadgeInfo {
        env.storage()
            .persistent()
            .get(&DataKey::Badge(token_id))
            .unwrap()
    }

    /// Get all badge token IDs for a user
    pub fn user_badges(env: Env, user: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::UserBadges(user))
            .unwrap_or(Vec::new(&env))
    }

    /// Check if user has a badge for a specific module
    pub fn has_badge(env: Env, user: Address, module_id: String) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::ModuleBadge(user, module_id))
    }

    /// Get the total number of badges minted
    pub fn total_badges(env: Env) -> u64 {
        let next: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextTokenId)
            .unwrap_or(1);
        next - 1
    }

    /// Get admin address
    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }
}

#[cfg(test)]
mod test;
