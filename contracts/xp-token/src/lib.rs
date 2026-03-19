#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Map};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Balance(Address),
    HistoricalBalance(Address),
    TotalSupply,
    CompletedChallenge(Address, String), // (user, challenge_id) -> bool
}

#[contract]
pub struct XpToken;

#[contractimpl]
impl XpToken {
    /// Initialize the contract with an admin address
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalSupply, &0i128);
    }

    /// Mint XP tokens to a user for completing a quiz.
    /// Only callable by admin. Records the challenge as completed.
    /// `correct` out of `total` questions, with `max_xp` as the total reward.
    pub fn reward_quiz(
        env: Env,
        user: Address,
        challenge_id: String,
        correct: u32,
        total: u32,
        max_xp: i128,
    ) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        // Check challenge not already completed
        let key = DataKey::CompletedChallenge(user.clone(), challenge_id.clone());
        if env.storage().persistent().has(&key) {
            panic!("challenge already completed");
        }

        // Calculate proportional reward
        let reward = (max_xp * correct as i128) / total as i128;

        if reward > 0 {
            // Update current balance
            let balance_key = DataKey::Balance(user.clone());
            let current: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0);
            env.storage().persistent().set(&balance_key, &(current + reward));

            // Update historical balance (only goes up, never decreases)
            let hist_key = DataKey::HistoricalBalance(user.clone());
            let historical: i128 = env.storage().persistent().get(&hist_key).unwrap_or(0);
            env.storage().persistent().set(&hist_key, &(historical + reward));

            // Update total supply
            let supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
            env.storage().instance().set(&DataKey::TotalSupply, &(supply + reward));

            // Emit event
            env.events().publish(
                (symbol_short!("xp_mint"), user.clone()),
                reward,
            );
        }

        // Mark challenge as completed
        env.storage().persistent().set(&key, &true);
    }

    /// Get current XP balance
    pub fn balance(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(user))
            .unwrap_or(0)
    }

    /// Get historical (all-time) XP balance — never decreases
    pub fn historical_balance(env: Env, user: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::HistoricalBalance(user))
            .unwrap_or(0)
    }

    /// Check if a user has completed a specific challenge
    pub fn is_completed(env: Env, user: Address, challenge_id: String) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::CompletedChallenge(user, challenge_id))
    }

    /// Check if user meets the minimum XP requirement (gating)
    pub fn meets_requirement(env: Env, user: Address, min_xp: i128) -> bool {
        let historical: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::HistoricalBalance(user))
            .unwrap_or(0);
        historical >= min_xp
    }

    /// Get total supply of XP tokens
    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    /// Get admin address
    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }
}

#[cfg(test)]
mod test;
