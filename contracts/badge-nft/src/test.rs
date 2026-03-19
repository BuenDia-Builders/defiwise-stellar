#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_mint_badge() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(BadgeNft, ());
    let client = BadgeNftClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    let module_id = String::from_str(&env, "mod-1");
    let module_title = String::from_str(&env, "Que es DeFi");

    let token_id = client.mint_badge(&user, &module_id, &module_title, &50, &100);
    assert_eq!(token_id, 1);

    let badge = client.get_badge(&token_id);
    assert_eq!(badge.owner, user);
    assert_eq!(badge.xp_earned, 50);
    assert_eq!(badge.quiz_score, 100);

    assert!(client.has_badge(&user, &module_id));
    assert_eq!(client.user_badges(&user).len(), 1);
    assert_eq!(client.total_badges(), 1);
}

#[test]
fn test_multiple_badges() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(BadgeNft, ());
    let client = BadgeNftClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    let m1 = String::from_str(&env, "mod-1");
    let t1 = String::from_str(&env, "Que es DeFi");
    let m2 = String::from_str(&env, "mod-2");
    let t2 = String::from_str(&env, "Como funciona DeFi");

    let id1 = client.mint_badge(&user, &m1, &t1, &50, &100);
    let id2 = client.mint_badge(&user, &m2, &t2, &75, &85);

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert_eq!(client.user_badges(&user).len(), 2);
    assert_eq!(client.total_badges(), 2);
}

#[test]
#[should_panic(expected = "badge already minted for this module")]
fn test_cannot_mint_duplicate() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(BadgeNft, ());
    let client = BadgeNftClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    let module_id = String::from_str(&env, "mod-1");
    let title = String::from_str(&env, "Que es DeFi");

    client.mint_badge(&user, &module_id, &title, &50, &100);
    // Should panic — duplicate
    client.mint_badge(&user, &module_id, &title, &50, &100);
}

#[test]
fn test_different_users_same_module() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(BadgeNft, ());
    let client = BadgeNftClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    client.initialize(&admin);

    let module_id = String::from_str(&env, "mod-1");
    let title = String::from_str(&env, "Que es DeFi");

    client.mint_badge(&user1, &module_id, &title, &50, &100);
    client.mint_badge(&user2, &module_id, &title, &50, &90);

    assert!(client.has_badge(&user1, &module_id));
    assert!(client.has_badge(&user2, &module_id));
    assert_eq!(client.total_badges(), 2);
}
