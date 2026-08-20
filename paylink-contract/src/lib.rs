//! PayLink escrow contract.
//! Payment links hold funds in escrow until the payee claims them.
//! Events (Funded/Claimed) drive the dApp's live payment feed.
#![no_std]

use soroban_sdk::{contract, contractimpl, contractevent, contracttype, token, Address, Env, Symbol};

#[derive(Clone, Debug, PartialEq, Eq)]
#[contracttype]
pub struct Link {
    pub creator: Address, // merchant / freelancer who creates the link
    pub payee: Address,   // who may claim escrowed funds
    pub asset: Address,   // token contract address (native XLM or USDC)
    pub amount: i128,
    pub funded: bool,
    pub claimed: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
#[contracttype]
pub enum DataKey {
    Link(Symbol),
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct Funded {
    pub link_id: Symbol,
    pub payer: Address,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct Claimed {
    pub link_id: Symbol,
    pub payee: Address,
}

#[contract]
pub struct PayLink;

#[contractimpl]
impl PayLink {
    pub fn create(env: Env, link_id: Symbol, payee: Address, asset: Address, amount: i128) {
        payee.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let key = DataKey::Link(link_id.clone());
        if env.storage().persistent().has(&key) {
            panic!("link already exists");
        }
        let link = Link {
            creator: env.current_contract_address(),
            payee,
            asset,
            amount,
            funded: false,
            claimed: false,
        };
        env.storage().persistent().set(&key, &link);
        Self::extend_ttl(&env, &key);
    }

    /// Payer sends `amount` of the link's asset into escrow.
    pub fn fund(env: Env, link_id: Symbol, payer: Address) {
        payer.require_auth();
        let mut link = Self::get_link(&env, link_id.clone());
        if link.funded {
            panic!("already funded");
        }
        let token = token::Client::new(&env, &link.asset);
        token.transfer(&payer, &env.current_contract_address(), &link.amount);
        link.funded = true;
        let key = DataKey::Link(link_id.clone());
        env.storage().persistent().set(&key, &link);
        Self::extend_ttl(&env, &key);
        env.events().publish_event(&Funded {
            link_id: link_id.clone(),
            payer,
        });
    }

    /// Payee withdraws escrowed funds. One-time claim.
    pub fn claim(env: Env, link_id: Symbol, payee: Address) {
        payee.require_auth();
        let mut link = Self::get_link(&env, link_id.clone());
        if !link.funded {
            panic!("not funded");
        }
        if link.claimed {
            panic!("already claimed");
        }
        link.payee.require_auth();
        let token = token::Client::new(&env, &link.asset);
        token.transfer(&env.current_contract_address(), &link.payee, &link.amount);
        link.claimed = true;
        let key = DataKey::Link(link_id.clone());
        env.storage().persistent().set(&key, &link);
        Self::extend_ttl(&env, &key);
        env.events().publish_event(&Claimed { link_id, payee });
    }

    pub fn get_link(env: &Env, link_id: Symbol) -> Link {
        let key = DataKey::Link(link_id);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("link not found"))
    }

    fn extend_ttl(env: &Env, key: &DataKey) {
        let max = env.storage().max_ttl();
        env.storage().persistent().extend_ttl(key, max, max);
    }
}

#[cfg(test)]
mod test {
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{token, Address, Env, Symbol};

    use super::*;

    fn setup() -> (Env, Address, Address, Address, Address) {
        let env = Env::default();
        let payer = Address::generate(&env);
        let payee = Address::generate(&env);
        let other = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let token = env.register_stellar_asset_contract_v2(token_admin.clone());
        env.mock_all_auths();
        token::StellarAssetClient::new(&env, &token.address()).mint(&payer, &1000i128);
        (env, payer, payee, other, token.address())
    }

    fn deploy(env: &Env) -> Address {
        env.register(PayLink, ())
    }

    #[test]
    fn full_flow() {
        let (env, payer, payee, _other, token) = setup();
        let id = deploy(&env);
        let client = PayLinkClient::new(&env, &id);

        env.mock_all_auths();
        client.create(&Symbol::new(&env, "inv1"), &payee, &token, &100i128);
        client.fund(&Symbol::new(&env, "inv1"), &payer);
        client.claim(&Symbol::new(&env, "inv1"), &payee);

        let link = client.get_link(&Symbol::new(&env, "inv1"));
        assert!(link.funded);
        assert!(link.claimed);
        assert_eq!(token::Client::new(&env, &token).balance(&payee), 100i128);
    }

    #[test]
    #[should_panic(expected = "already claimed")]
    fn double_claim_fails() {
        let (env, payer, payee, _other, token) = setup();
        let id = deploy(&env);
        let client = PayLinkClient::new(&env, &id);

        env.mock_all_auths();
        client.create(&Symbol::new(&env, "inv1"), &payee, &token, &100i128);
        client.fund(&Symbol::new(&env, "inv1"), &payer);
        client.claim(&Symbol::new(&env, "inv1"), &payee);
        client.claim(&Symbol::new(&env, "inv1"), &payee);
    }

    #[test]
    #[should_panic(expected = "not funded")]
    fn claim_before_fund_fails() {
        let (env, _payer, payee, _other, token) = setup();
        let id = deploy(&env);
        let client = PayLinkClient::new(&env, &id);

        env.mock_all_auths();
        client.create(&Symbol::new(&env, "inv1"), &payee, &token, &100i128);
        client.claim(&Symbol::new(&env, "inv1"), &payee);
    }
}