#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_initialize_and_reward() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(XpToken, ());
    let client = XpTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    // Reward for completing a quiz: 3 out of 4 correct, max 100 XP
    let challenge = String::from_str(&env, "mod-1");
    client.reward_quiz(&user, &challenge, &3, &4, &100);

    // Should get 75 XP (3/4 * 100)
    assert_eq!(client.balance(&user), 75);
    assert_eq!(client.historical_balance(&user), 75);
    assert_eq!(client.total_supply(), 75);
    assert!(client.is_completed(&user, &challenge));
}

#[test]
fn test_historical_never_decreases() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(XpToken, ());
    let client = XpTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    let c1 = String::from_str(&env, "mod-1");
    client.reward_quiz(&user, &c1, &4, &4, &50);
    assert_eq!(client.balance(&user), 50);
    assert_eq!(client.historical_balance(&user), 50);

    let c2 = String::from_str(&env, "mod-2");
    client.reward_quiz(&user, &c2, &2, &4, &75);
    // 2/4 * 75 = 37
    assert_eq!(client.balance(&user), 87); // 50 + 37
    assert_eq!(client.historical_balance(&user), 87);
}

#[test]
#[should_panic(expected = "challenge already completed")]
fn test_cannot_repeat_challenge() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(XpToken, ());
    let client = XpTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    let challenge = String::from_str(&env, "mod-1");
    client.reward_quiz(&user, &challenge, &4, &4, &100);
    // Second attempt should panic
    client.reward_quiz(&user, &challenge, &4, &4, &100);
}

#[test]
fn test_meets_requirement() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(XpToken, ());
    let client = XpTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    assert!(!client.meets_requirement(&user, &50));

    let c1 = String::from_str(&env, "mod-1");
    client.reward_quiz(&user, &c1, &4, &4, &50);

    assert!(client.meets_requirement(&user, &50));
    assert!(!client.meets_requirement(&user, &100));
}
