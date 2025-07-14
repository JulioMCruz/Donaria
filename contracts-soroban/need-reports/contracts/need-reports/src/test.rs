#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, Address, String, Vec};

#[test]
fn test_initialize_contract() {
    let env = Env::default();
    let contract_id = env.register_contract(None, NeedReportsContract);
    let client = NeedReportsContractClient::new(&env, &contract_id);

    let admin1 = Address::generate(&env);
    let admin2 = Address::generate(&env);
    let mut admins = Vec::new(&env);
    admins.push_back(admin1.clone());
    admins.push_back(admin2.clone());

    client.initialize(&admins);

    // Test that admins are properly set
    assert!(client.is_admin(&admin1));
    assert!(client.is_admin(&admin2));
    
    let random_user = Address::generate(&env);
    assert!(!client.is_admin(&random_user));
}

#[test]
fn test_create_report() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, NeedReportsContract);
    let client = NeedReportsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let mut admins = Vec::new(&env);
    admins.push_back(admin);
    client.initialize(&admins);

    let creator = Address::generate(&env);
    let title = String::from_str(&env, "Emergency Medical Aid");
    let description = String::from_str(&env, "Need medical supplies for earthquake victims");
    let location = String::from_str(&env, "City Center");
    let category = String::from_str(&env, "Medical");
    let amount_needed = 5000u64;
    let mut image_urls = Vec::new(&env);
    image_urls.push_back(String::from_str(&env, "https://firebase.com/image1.jpg"));

    let report_id = client.create_report(
        &creator,
        &title,
        &description,
        &location,
        &category,
        &amount_needed,
        &image_urls,
    );

    assert_eq!(report_id, 1);

    // Verify the report was created correctly
    let report = client.get_report(&report_id).unwrap();
    assert_eq!(report.creator, creator);
    assert_eq!(report.title, title);
    assert_eq!(report.amount_needed, amount_needed);
    assert_eq!(report.amount_raised, 0);
    assert_eq!(report.status, String::from_str(&env, "pending"));
}

#[test]
fn test_update_report() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, NeedReportsContract);
    let client = NeedReportsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let mut admins = Vec::new(&env);
    admins.push_back(admin);
    client.initialize(&admins);

    let creator = Address::generate(&env);
    let title = String::from_str(&env, "Emergency Medical Aid");
    let description = String::from_str(&env, "Need medical supplies");
    let location = String::from_str(&env, "City Center");
    let category = String::from_str(&env, "Medical");
    let amount_needed = 5000u64;
    let mut image_urls = Vec::new(&env);
    image_urls.push_back(String::from_str(&env, "https://firebase.com/image1.jpg"));

    let report_id = client.create_report(
        &creator,
        &title,
        &description,
        &location,
        &category,
        &amount_needed,
        &image_urls,
    );

    // Update the report
    let new_title = String::from_str(&env, "Updated Emergency Medical Aid");
    let reason = String::from_str(&env, "Adding more details");
    
    let success = client.update_report(
        &report_id,
        &creator,
        &Some(new_title.clone()),
        &None,
        &None,
        &None,
        &None,
        &None,
        &reason,
    );

    assert!(success);

    // Verify the update
    let updated_report = client.get_report(&report_id).unwrap();
    assert_eq!(updated_report.title, new_title);

    // Check change log
    let change_log = client.get_change_log(&report_id);
    assert!(change_log.len() >= 2); // Creation + update
}

#[test]
fn test_update_status_admin_only() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, NeedReportsContract);
    let client = NeedReportsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let mut admins = Vec::new(&env);
    admins.push_back(admin.clone());
    client.initialize(&admins);

    let creator = Address::generate(&env);
    let title = String::from_str(&env, "Emergency Medical Aid");
    let description = String::from_str(&env, "Need medical supplies");
    let location = String::from_str(&env, "City Center");
    let category = String::from_str(&env, "Medical");
    let amount_needed = 5000u64;
    let image_urls = Vec::new(&env);

    let report_id = client.create_report(
        &creator,
        &title,
        &description,
        &location,
        &category,
        &amount_needed,
        &image_urls,
    );

    // Admin updates status
    let new_status = String::from_str(&env, "verified");
    let notes = String::from_str(&env, "Verified by admin team");
    
    let success = client.update_status(&report_id, &admin, &new_status, &notes);
    assert!(success);

    // Verify status update
    let updated_report = client.get_report(&report_id).unwrap();
    assert_eq!(updated_report.status, new_status);
    assert_eq!(updated_report.verification_notes, notes);
}

#[test]
fn test_get_user_reports() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, NeedReportsContract);
    let client = NeedReportsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let mut admins = Vec::new(&env);
    admins.push_back(admin);
    client.initialize(&admins);

    let creator1 = Address::generate(&env);
    let creator2 = Address::generate(&env);
    
    // Create reports for different users
    let image_urls = Vec::new(&env);
    
    client.create_report(
        &creator1,
        &String::from_str(&env, "Report 1 by User 1"),
        &String::from_str(&env, "Description 1"),
        &String::from_str(&env, "Location 1"),
        &String::from_str(&env, "Medical"),
        &1000u64,
        &image_urls,
    );
    
    client.create_report(
        &creator1,
        &String::from_str(&env, "Report 2 by User 1"),
        &String::from_str(&env, "Description 2"),
        &String::from_str(&env, "Location 2"),
        &String::from_str(&env, "Food"),
        &2000u64,
        &image_urls,
    );
    
    client.create_report(
        &creator2,
        &String::from_str(&env, "Report 1 by User 2"),
        &String::from_str(&env, "Description 3"),
        &String::from_str(&env, "Location 3"),
        &String::from_str(&env, "Shelter"),
        &3000u64,
        &image_urls,
    );

    // Get reports for creator1
    let user1_reports = client.get_user_reports(&creator1);
    assert_eq!(user1_reports.len(), 2);

    // Get reports for creator2
    let user2_reports = client.get_user_reports(&creator2);
    assert_eq!(user2_reports.len(), 1);
}

#[test]
fn test_get_reports_by_status() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, NeedReportsContract);
    let client = NeedReportsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let mut admins = Vec::new(&env);
    admins.push_back(admin.clone());
    client.initialize(&admins);

    let creator = Address::generate(&env);
    let image_urls = Vec::new(&env);
    
    // Create reports
    let report1_id = client.create_report(
        &creator,
        &String::from_str(&env, "Report 1"),
        &String::from_str(&env, "Description 1"),
        &String::from_str(&env, "Location 1"),
        &String::from_str(&env, "Medical"),
        &1000u64,
        &image_urls,
    );
    
    let report2_id = client.create_report(
        &creator,
        &String::from_str(&env, "Report 2"),
        &String::from_str(&env, "Description 2"),
        &String::from_str(&env, "Location 2"),
        &String::from_str(&env, "Food"),
        &2000u64,
        &image_urls,
    );

    // Update one report to verified
    client.update_status(
        &report2_id,
        &admin,
        &String::from_str(&env, "verified"),
        &String::from_str(&env, "Verified"),
    );

    // Get pending reports
    let pending_reports = client.get_reports_by_status(&String::from_str(&env, "pending"));
    assert_eq!(pending_reports.len(), 1);
    assert_eq!(pending_reports.get(0).unwrap().id, report1_id);

    // Get verified reports
    let verified_reports = client.get_reports_by_status(&String::from_str(&env, "verified"));
    assert_eq!(verified_reports.len(), 1);
    assert_eq!(verified_reports.get(0).unwrap().id, report2_id);
}

#[test]
fn test_platform_stats() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, NeedReportsContract);
    let client = NeedReportsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let mut admins = Vec::new(&env);
    admins.push_back(admin.clone());
    client.initialize(&admins);

    let creator = Address::generate(&env);
    let image_urls = Vec::new(&env);
    
    // Create reports with different amounts
    client.create_report(
        &creator,
        &String::from_str(&env, "Report 1"),
        &String::from_str(&env, "Description 1"),
        &String::from_str(&env, "Location 1"),
        &String::from_str(&env, "Medical"),
        &1000u64,
        &image_urls,
    );
    
    client.create_report(
        &creator,
        &String::from_str(&env, "Report 2"),
        &String::from_str(&env, "Description 2"),
        &String::from_str(&env, "Location 2"),
        &String::from_str(&env, "Food"),
        &2000u64,
        &image_urls,
    );

    let stats = client.get_stats();
    assert_eq!(stats.total_reports, 2);
    assert_eq!(stats.pending_reports, 2);
    assert_eq!(stats.verified_reports, 0);
    assert_eq!(stats.total_amount_needed, 3000);
    assert_eq!(stats.total_amount_raised, 0);
}