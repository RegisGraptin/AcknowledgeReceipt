use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Binary};

use secret_toolkit::storage::{Item, Keymap};

pub const KEY_CONTRACT_KEYS: &[u8] = b"contract_keys";
pub const KEY_READ_PERMISSIONS: &[u8] = b"read_permissions";
pub const KEY_CONTENT: &[u8] = b"secret_content";

pub const PREFIX_REVOKED_PERMITS: &str = "revoked_permits";

/// Item to store the public/private key of the Secret Smart Contract
pub static CONTRACT_KEYS: Item<ContractKeys> = Item::new(KEY_CONTRACT_KEYS);

/// Gateway config
pub static CONFIG: Item<State> = Item::new(b"config");


/// (id, user_address) => access
pub static FILE_PERMISSIONS: Keymap<(u128, Addr), bool> = Keymap::new(KEY_READ_PERMISSIONS);

// id => content
pub static FILE_CONTENT: Keymap<u128, String> = Keymap::new(KEY_CONTENT);


#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct ContractKeys {
    pub private_key: Vec<u8>,
    pub public_key: Vec<u8>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub contract_address: Addr,
    pub gateway_address: Addr,
    pub gateway_hash: String,
    pub gateway_key: Binary,
}

