use cosmwasm_std::{Addr, Binary};
use schemars::JsonSchema;
use secret_toolkit::{permit::Permit, utils::HandleCallback};
use serde::{Deserialize, Serialize};
use tnls::{PostExecutionMsg, PrivContractHandleMsg};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub gateway_address: Addr,
    pub gateway_hash: String,
    pub gateway_key: Binary,
}


#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Input { message: PrivContractHandleMsg },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub struct EncryptedContent {
    pub payload: Vec<u8>,
    pub public_key: Vec<u8>,
}


#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct CreateReceiptMsg {
    pub id: u128,
    pub user: Addr,
    pub content: EncryptedContent,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct AddNewAddressMsg {
    pub id: u128,
    pub user: Addr,
}


#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseStoreMsg {
    // Key of the StorageItem
    pub key: String,
    // response message
    pub message: String,
}


#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum GatewayMsg {
    Output { outputs: PostExecutionMsg },
}


impl HandleCallback for GatewayMsg {
    const BLOCK_SIZE: usize = 256;
}



#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetContractKey {},
    WithPermit {
        permit: Permit,
        query: QueryWithPermit,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryWithPermit {
    RetrieveContent { 
        key: u128,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct ContractKeyResponse {
    pub public_key: Vec<u8>, 
}