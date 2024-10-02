
use aes_siv::siv::Aes128Siv;
use bech32::{ToBase32, Variant};
use cosmwasm_std::{
    entry_point, to_binary, Addr, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError,
    StdResult,
};

use secret_toolkit::permit::{pubkey_to_account, Permit, RevokedPermits, SignedPermit};
use secret_toolkit::utils::{pad_handle_result, HandleCallback};

use secp256k1::ecdh::SharedSecret;
use secp256k1::{PublicKey, Secp256k1, SecretKey};
use secret_toolkit::serialization::{Json, Serde};
use serde::Serialize;
use sha2::digest::generic_array::GenericArray;
use tnls::state::Task;
use tnls::{PostExecutionMsg, PrivContractHandleMsg};


use sha3::{Digest, Keccak256};

use crate::error::ContractError;
use crate::msg::{
    AddNewAddressMsg, ContractKeyResponse, CreateReceiptMsg, ExecuteMsg, GatewayMsg, InstantiateMsg, QueryMsg, QueryWithPermit, ResponseStoreMsg
};
use crate::state::{
    ContractKeys, State, CONFIG, CONTRACT_KEYS, FILE_CONTENT, FILE_PERMISSIONS,
    PREFIX_REVOKED_PERMITS,
};

/// pad handle responses and log attributes to blocks of 256 bytes to prevent leaking info based on
/// response size
pub const BLOCK_SIZE: usize = 256;

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    // Create the public/private keys for the contract
    let rng = env.block.random.unwrap().0;
    let secp = Secp256k1::new();

    let private_key = SecretKey::from_slice(&rng).unwrap();
    let private_key_string = private_key.display_secret().to_string();
    let private_key_bytes = hex::decode(private_key_string).unwrap();

    let public_key = PublicKey::from_secret_key(&secp, &private_key);
    let public_key_bytes = public_key.serialize().to_vec();

    let my_keys = ContractKeys {
        private_key: private_key_bytes,
        public_key: public_key_bytes,
    };

    CONTRACT_KEYS.save(deps.storage, &my_keys)?;

    // Save Gateway information
    let state = State {
        contract_address: env.contract.address,
        gateway_address: msg.gateway_address,
        gateway_hash: msg.gateway_hash,
        gateway_key: msg.gateway_key,
    };
    CONFIG.save(deps.storage, &state)?;

    deps.api
        .debug(&format!("Contract was initialized by {}", info.sender));

    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
    let response = match msg {
        ExecuteMsg::Input { message } => try_handle(deps, env, info, message),
    };
    pad_handle_result(response, BLOCK_SIZE)
}

// acts like a gateway message handle filter
fn try_handle(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    msg: PrivContractHandleMsg,
) -> Result<Response, ContractError> {
    // verify signature with stored gateway public key
    let gateway_key = CONFIG.load(deps.storage)?.gateway_key;
    deps.api
        .secp256k1_verify(
            msg.input_hash.as_slice(),
            msg.signature.as_slice(),
            gateway_key.as_slice(),
        )
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    // determine which function to call based on the included handle
    let handle = msg.handle.as_str();
    match handle {
        "store" => store_value(deps, env, msg.input_values, msg.task, msg.input_hash),
        "add_view" => add_view(deps, env, msg.input_values, msg.task, msg.input_hash),
        _ => Err(ContractError::UnknownContractHandle),
    }
}

fn store_value(
    deps: DepsMut,
    _env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;

    let input: CreateReceiptMsg =
        Json::deserialize::<CreateReceiptMsg>(&input_values.as_bytes()).unwrap();

    // Decypher encrypted content with contract key
    let decrypt_msg =
        _decrypt_with_user_public_key(&deps, input.content.payload, input.content.public_key)?;

    // Store data in map
    let _ = FILE_CONTENT.insert(deps.storage, &input.id, &decrypt_msg);

    // Add view right to current user
    FILE_PERMISSIONS.insert(deps.storage, &(input.id, input.user.clone()), &true)?;

    // Done
    let data = ResponseStoreMsg {
        key: input.id.to_string(),
        message: "Value store completed successfully".to_string(),
    };

    // Serialize the struct to a JSON string1
    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    // Encode the JSON string to base64
    let result = base64::encode(json_string);

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        config.gateway_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "stored value with key"))
}

fn add_view(
    deps: DepsMut,
    _env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;

    let input: AddNewAddressMsg =
        Json::deserialize::<AddNewAddressMsg>(&input_values.as_bytes()).unwrap();

    FILE_PERMISSIONS.insert(deps.storage, &(input.id, input.user.clone()), &true)?;

    // Done
    let data = ResponseStoreMsg {
        key: input.id.to_string(),
        message: "Value store completed successfully".to_string(),
    };

    // Serialize the struct to a JSON string1
    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    // Encode the JSON string to base64
    let result = base64::encode(json_string);

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        config.gateway_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "added view right"))
}

/// Decrypt a cyphertext using a given public key and the contract private key.
///
/// Create a shared secret by using the user public key and the contract private key.
/// Then, used this shared secet to decrypt the cyphertext.
///
/// Note: for the ExecutePermitMsg, we cannot use Bincode2 as encoder as we are using
/// enum values, which is not manage by this library.
fn _decrypt_with_user_public_key(
    deps: &DepsMut,
    payload: Vec<u8>,
    user_public_key: Vec<u8>,
) -> Result<String, ContractError> {
    // Read the private key from the storage
    let contract_keys = CONTRACT_KEYS.load(deps.storage)?;
    let contract_private_key = SecretKey::from_slice(contract_keys.private_key.as_slice()).unwrap();

    // Conver the user public key
    let user_public_key = PublicKey::from_slice(user_public_key.as_slice())
        .map_err(|e| ContractError::InvalidPublicKey { val: e.to_string() })?;

    // Create a shared secret from the user public key and the conrtact private key
    let shared_secret = SharedSecret::new(&user_public_key, &contract_private_key);
    let key = shared_secret.secret_bytes();

    let ad_data: &[&[u8]] = &[];
    let ad = Some(ad_data);

    // Decrypt the data and deserialized the message
    let decrypted_data = aes_siv_decrypt(&Binary::from(payload), ad, &key)?;
    let data = Json::deserialize::<String>(&decrypted_data).map(Some);

    match data {
        Ok(execute_permit_message) => match execute_permit_message {
            Some(msg) => Ok(msg),
            None => Err(ContractError::UnknownExecutePermitMsg),
        },
        Err(err) => Err(ContractError::ErrorDeserializeExectueMsg {
            val: err.to_string(),
        }),
    }
}

/// Decrypt AES message.
pub fn aes_siv_decrypt(
    plaintext: &[u8],
    ad: Option<&[&[u8]]>,
    key: &[u8],
) -> Result<Vec<u8>, ContractError> {
    let ad = ad.unwrap_or(&[&[]]);

    let mut cipher = Aes128Siv::new(GenericArray::clone_from_slice(key));
    cipher
        .decrypt(ad, plaintext)
        .map_err(|_e| ContractError::EncryptionError)
}

fn to_binary_pretty<T>(data: &T) -> StdResult<Binary>
where
    T: Serialize + ?Sized,
{
    const INDENT: &[u8; 4] = b"    ";
    super::pretty::to_vec_pretty(data, INDENT)
        .map_err(|e| StdError::serialize_err(std::any::type_name::<T>(), e))
        .map(Binary)
}

/// Verify the permit and check if it is the right users.
/// Returns: verified user address.
fn _verify_permit(
    deps: Deps,
    permit: Permit,
    contract_address: Addr,
) -> Result<Addr, ContractError> {
    let account_hrp = "secret";
    let contract_address_str = contract_address.into_string();
    let storage_prefix = PREFIX_REVOKED_PERMITS;

    if !permit.check_token(&contract_address_str) {
        return Err(ContractError::Std(StdError::generic_err(format!(
            "Permit doesn't apply to token {:?}, allowed tokens: {:?}",
            contract_address_str,
            permit
                .params
                .allowed_tokens
                .iter()
                .map(|a| a.as_str())
                .collect::<Vec<&str>>()
        ))));
    }

    // Derive account from pubkey
    let pubkey = &permit.signature.pub_key.value;

    let base32_addr = pubkey_to_account(pubkey).0.as_slice().to_base32();
    let account: String = bech32::encode(account_hrp, base32_addr, Variant::Bech32).unwrap();

    // Validate permit_name
    let permit_name = &permit.params.permit_name;
    let is_permit_revoked =
        RevokedPermits::is_permit_revoked(deps.storage, storage_prefix, &account, permit_name);
    if is_permit_revoked {
        return Err(ContractError::Std(StdError::generic_err(format!(
            "Permit {:?} was revoked by account {:?}",
            permit_name,
            account.as_str()
        ))));
    }

    let user_data = &SignedPermit::from_params(&permit.params);

    let mut signed_bytes = vec![];
    signed_bytes.extend_from_slice(b"\x19Ethereum Signed Message:\n");

    let signed_tx_pretty_amino_json = to_binary_pretty(user_data)?;

    signed_bytes.extend_from_slice(signed_tx_pretty_amino_json.len().to_string().as_bytes());
    signed_bytes.extend_from_slice(signed_tx_pretty_amino_json.as_slice());

    
    let mut hasher = Keccak256::new();

    hasher.update(&signed_bytes);

    let signed_bytes_hash = hasher.finalize();

    let verified = deps
        .api
        .secp256k1_verify(&signed_bytes_hash, &permit.signature.signature.0, &pubkey.0)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    if !verified {
        return Err(ContractError::Std(StdError::generic_err(
            "Failed to verify signatures for the given permit",
        )));
    }

    let account_address = Addr::unchecked(account);

    Ok(account_address)
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetContractKey {} => to_binary(&query_key(deps)?),
        QueryMsg::WithPermit { permit, query } => permit_queries(deps, permit, query),
    }
}

fn query_key(deps: Deps) -> StdResult<ContractKeyResponse> {
    let contract_keys = CONTRACT_KEYS.load(deps.storage)?;
    Ok(ContractKeyResponse {
        public_key: contract_keys.public_key,
    })
}


fn permit_queries(deps: Deps, permit: Permit, query: QueryWithPermit) -> Result<Binary, StdError> {
    // Verify the account through the permit
    let contract_address = CONFIG.load(deps.storage)?.contract_address;
    let account = match _verify_permit(deps, permit, contract_address) {
        Ok(account) => account,
        Err(e) => panic!("Error {:?}", e),
    };

    // Permit validated! We can now execute the query.
    match query {
        QueryWithPermit::RetrieveContent { key } => {
            // Check the permission - whitelisted
            let whitelisted = FILE_PERMISSIONS.get(deps.storage, &(key, account));

            match whitelisted {
                Some(authorized) => {
                    if !authorized {
                        return Err(StdError::generic_err(format!(
                            "Unauthorized access for the given file."
                        )));
                    }
                }
                _ => {
                    return Err(StdError::generic_err(format!(
                        "Unauthorized access for the given file."
                    )));
                }
            };


            let file_content = FILE_CONTENT.get(deps.storage, &key);
            match file_content {
                Some(data) => {
                    return to_binary(&data);
                }
                _ => {
                    return Err(StdError::generic_err(format!(
                        "Error when retrieving the data."
                    )));
                }
            }

        }
    }
}
