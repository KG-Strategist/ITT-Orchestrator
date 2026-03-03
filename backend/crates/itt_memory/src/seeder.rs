use crate::CorpusManager;
use crate::models::{ApiRegistryEntry, Zone, MdmRule};
use std::sync::Arc;
use uuid::Uuid;

pub async fn run(manager: &Arc<CorpusManager>) {
    tracing::info!("TEST_MODE is active. Seeding Smart Corpus with synthetic enterprise data...");

    // 1. Seed API Registry
    let apis = vec![
        ApiRegistryEntry {
            id: format!("api_{}", Uuid::new_v4()),
            name: "CoreBanking.GetBalance".to_string(),
            category: "REST".to_string(),
            spec_link: "Building Block".to_string(),
            semantic_tags: vec![],
            auth_protocol: "OAuth".to_string(),
            status: "Active".to_string(),
            depends_on: vec![],
            integration_id: "".to_string(),
        },
        ApiRegistryEntry {
            id: format!("api_{}", Uuid::new_v4()),
            name: "CoreBanking.CustomerProfile".to_string(),
            category: "gRPC".to_string(),
            spec_link: "Building Block".to_string(),
            semantic_tags: vec![],
            auth_protocol: "OAuth".to_string(),
            status: "Active".to_string(),
            depends_on: vec![],
            integration_id: "".to_string(),
        },
        ApiRegistryEntry {
            id: format!("api_{}", Uuid::new_v4()),
            name: "Loan.Origination".to_string(),
            category: "REST".to_string(),
            spec_link: "Process".to_string(),
            semantic_tags: vec![],
            auth_protocol: "OAuth".to_string(),
            status: "Active".to_string(),
            depends_on: vec![],
            integration_id: "".to_string(),
        },
        ApiRegistryEntry {
            id: format!("api_{}", Uuid::new_v4()),
            name: "Credit.RiskScoring".to_string(),
            category: "REST".to_string(),
            spec_link: "Process".to_string(),
            semantic_tags: vec![],
            auth_protocol: "OAuth".to_string(),
            status: "Active".to_string(),
            depends_on: vec![],
            integration_id: "".to_string(),
        },
        ApiRegistryEntry {
            id: format!("api_{}", Uuid::new_v4()),
            name: "Mobile.Dashboard.BFF".to_string(),
            category: "GraphQL".to_string(),
            spec_link: "Experience".to_string(),
            semantic_tags: vec![],
            auth_protocol: "OAuth".to_string(),
            status: "Active".to_string(),
            depends_on: vec![],
            integration_id: "".to_string(),
        },
        ApiRegistryEntry {
            id: format!("api_{}", Uuid::new_v4()),
            name: "NetBanking.Auth".to_string(),
            category: "REST".to_string(),
            spec_link: "Experience".to_string(),
            semantic_tags: vec![],
            auth_protocol: "OAuth".to_string(),
            status: "Active".to_string(),
            depends_on: vec![],
            integration_id: "".to_string(),
        },
    ];

    for api in apis {
        if let Err(e) = manager.add_api_node(api).await {
            tracing::error!("Failed to seed API: {:?}", e);
        }
    }

    // 2. Seed AGF Zones
    let zones = vec![
        Zone {
            id: format!("zone_{}", Uuid::new_v4()),
            name: "Zone 1: The Fortress".to_string(),
            description: "Highest security zone for core banking systems.".to_string(),
            ips: vec!["10.0.1.0/24".to_string()],
            filters: vec!["Strict MTLS".to_string(), "IP Whitelist".to_string()],
        },
        Zone {
            id: format!("zone_{}", Uuid::new_v4()),
            name: "Zone 2: Core Guard".to_string(),
            description: "Internal services and process APIs.".to_string(),
            ips: vec!["10.0.2.0/24".to_string()],
            filters: vec!["Token Validation".to_string()],
        },
        Zone {
            id: format!("zone_{}", Uuid::new_v4()),
            name: "Zone 3: Velocity Mesh".to_string(),
            description: "High-throughput experience APIs and BFFs.".to_string(),
            ips: vec!["10.0.3.0/24".to_string()],
            filters: vec!["Rate Limiting".to_string(), "Circuit Breaker".to_string()],
        },
        Zone {
            id: format!("zone_{}", Uuid::new_v4()),
            name: "Zone 4: Cognitive Edge".to_string(),
            description: "External facing and AI integrations.".to_string(),
            ips: vec!["10.0.4.0/24".to_string()],
            filters: vec!["Semantic Firewall".to_string(), "WAF".to_string()],
        },
    ];

    for zone in zones {
        if let Err(e) = manager.add_zone(zone).await {
            tracing::error!("Failed to seed Zone: {:?}", e);
        }
    }

    // 3. Seed MDM Rules
    let rules = vec![
        MdmRule {
            id: 1,
            name: "Aadhaar Number".to_string(),
            pattern: "\\d{4}-\\d{4}-\\d{4}".to_string(),
            token: "TKN-AADHAAR".to_string(),
        },
        MdmRule {
            id: 2,
            name: "PAN Card".to_string(),
            pattern: "[A-Z]{5}[0-9]{4}[A-Z]{1}".to_string(),
            token: "TKN-PAN".to_string(),
        },
        MdmRule {
            id: 3,
            name: "Email Address".to_string(),
            pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}".to_string(),
            token: "TKN-EMAIL".to_string(),
        },
    ];

    for rule in rules {
        if let Err(e) = manager.add_mdm_rule(rule).await {
            tracing::error!("Failed to seed MDM Rule: {:?}", e);
        }
    }

    tracing::info!("Synthetic data seeding complete.");
}
