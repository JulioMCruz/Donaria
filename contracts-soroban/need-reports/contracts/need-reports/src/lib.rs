#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Vec, Symbol
};

/// Data structure for a need report
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NeedReport {
    pub id: u64,
    pub creator: Address,
    pub title: String,
    pub description: String,
    pub location: String,
    pub category: String,
    pub amount_needed: u64,
    pub amount_raised: u64,
    pub status: String, // "pending", "verified", "funded", "completed", "rejected"
    pub created_at: u64,
    pub updated_at: u64,
    pub image_urls: Vec<String>, // Firebase Storage URLs
    pub verification_notes: String,
}

/// Data structure for tracking changes (for transparency)
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ChangeLog {
    pub report_id: u64,
    pub changed_by: Address,
    pub field_changed: String,
    pub old_value: String,
    pub new_value: String,
    pub timestamp: u64,
    pub reason: String,
}

/// Data structure for report statistics
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReportStats {
    pub total_reports: u64,
    pub pending_reports: u64,
    pub verified_reports: u64,
    pub funded_reports: u64,
    pub completed_reports: u64,
    pub total_amount_needed: u64,
    pub total_amount_raised: u64,
}

/// Storage keys
const NEXT_REPORT_ID: Symbol = symbol_short!("NEXT_ID");
const REPORTS_COUNT: Symbol = symbol_short!("COUNT");
const ADMIN_LIST: Symbol = symbol_short!("ADMINS");

#[contract]
pub struct NeedReportsContract;

#[contractimpl]
impl NeedReportsContract {
    /// Initialize the contract with admin addresses
    pub fn initialize(env: Env, admins: Vec<Address>) {
        // Ensure this can only be called once
        if env.storage().instance().has(&NEXT_REPORT_ID) {
            panic!("Contract already initialized");
        }
        
        // Set initial values
        env.storage().instance().set(&NEXT_REPORT_ID, &1u64);
        env.storage().instance().set(&REPORTS_COUNT, &0u64);
        env.storage().instance().set(&ADMIN_LIST, &admins);
        
        // Extend TTL
        env.storage().instance().extend_ttl(5184000, 5184000); // ~60 days
    }

    /// Create a new need report
    pub fn create_report(
        env: Env,
        creator: Address,
        title: String,
        description: String,
        location: String,
        category: String,
        amount_needed: u64,
        image_urls: Vec<String>,
    ) -> u64 {
        // Authenticate the creator
        creator.require_auth();
        
        // Get next report ID
        let report_id = env.storage().instance().get::<Symbol, u64>(&NEXT_REPORT_ID).unwrap_or(1);
        
        // Create new report
        let report = NeedReport {
            id: report_id,
            creator: creator.clone(),
            title: title.clone(),
            description,
            location,
            category,
            amount_needed,
            amount_raised: 0,
            status: String::from_str(&env, "pending"),
            created_at: env.ledger().timestamp(),
            updated_at: env.ledger().timestamp(),
            image_urls,
            verification_notes: String::from_str(&env, ""),
        };
        
        // Store the report using report_id as key
        env.storage().persistent().set(&report_id, &report);
        env.storage().persistent().extend_ttl(&report_id, 5184000, 5184000);
        
        // Update counters
        env.storage().instance().set(&NEXT_REPORT_ID, &(report_id + 1));
        let current_count = env.storage().instance().get::<Symbol, u64>(&REPORTS_COUNT).unwrap_or(0);
        env.storage().instance().set(&REPORTS_COUNT, &(current_count + 1));
        
        // Log the creation
        Self::log_change(
            env.clone(),
            report_id,
            creator,
            String::from_str(&env, "created"),
            String::from_str(&env, ""),
            title,
            String::from_str(&env, "Initial report creation"),
        );
        
        // Extend instance TTL
        env.storage().instance().extend_ttl(5184000, 5184000);
        
        report_id
    }

    /// Get a specific report by ID
    pub fn get_report(env: Env, report_id: u64) -> Option<NeedReport> {
        if let Some(report) = env.storage().persistent().get::<u64, NeedReport>(&report_id) {
            // Extend TTL when accessed
            env.storage().persistent().extend_ttl(&report_id, 5184000, 5184000);
            Some(report)
        } else {
            None
        }
    }

    /// Update a report (only by creator or admin)
    pub fn update_report(
        env: Env,
        report_id: u64,
        updater: Address,
        title: Option<String>,
        description: Option<String>,
        location: Option<String>,
        category: Option<String>,
        amount_needed: Option<u64>,
        image_urls: Option<Vec<String>>,
        reason: String,
    ) -> bool {
        // Authenticate the updater
        updater.require_auth();
        
        if let Some(mut report) = env.storage().persistent().get::<u64, NeedReport>(&report_id) {
            // Check if updater is creator or admin
            let is_creator = report.creator == updater;
            let is_admin = Self::is_admin(env.clone(), updater.clone());
            
            if !is_creator && !is_admin {
                panic!("Unauthorized: Only creator or admin can update report");
            }
            
            // Update fields and log changes
            if let Some(new_title) = title {
                Self::log_change(
                    env.clone(),
                    report_id,
                    updater.clone(),
                    String::from_str(&env, "title"),
                    report.title.clone(),
                    new_title.clone(),
                    reason.clone(),
                );
                report.title = new_title;
            }
            
            if let Some(new_description) = description {
                Self::log_change(
                    env.clone(),
                    report_id,
                    updater.clone(),
                    String::from_str(&env, "description"),
                    String::from_str(&env, "[description_updated]"),
                    String::from_str(&env, "[new_description]"),
                    reason.clone(),
                );
                report.description = new_description;
            }
            
            if let Some(new_location) = location {
                Self::log_change(
                    env.clone(),
                    report_id,
                    updater.clone(),
                    String::from_str(&env, "location"),
                    report.location.clone(),
                    new_location.clone(),
                    reason.clone(),
                );
                report.location = new_location;
            }
            
            if let Some(new_category) = category {
                Self::log_change(
                    env.clone(),
                    report_id,
                    updater.clone(),
                    String::from_str(&env, "category"),
                    report.category.clone(),
                    new_category.clone(),
                    reason.clone(),
                );
                report.category = new_category;
            }
            
            if let Some(new_amount) = amount_needed {
                Self::log_change(
                    env.clone(),
                    report_id,
                    updater.clone(),
                    String::from_str(&env, "amount_needed"),
                    String::from_str(&env, "amount_updated"),
                    String::from_str(&env, "new_amount"),
                    reason.clone(),
                );
                report.amount_needed = new_amount;
            }
            
            if let Some(new_images) = image_urls {
                Self::log_change(
                    env.clone(),
                    report_id,
                    updater.clone(),
                    String::from_str(&env, "images"),
                    String::from_str(&env, "[images_updated]"),
                    String::from_str(&env, "[new_images]"),
                    reason.clone(),
                );
                report.image_urls = new_images;
            }
            
            // Update timestamp
            report.updated_at = env.ledger().timestamp();
            
            // Save updated report
            env.storage().persistent().set(&report_id, &report);
            env.storage().persistent().extend_ttl(&report_id, 5184000, 5184000);
            
            true
        } else {
            false
        }
    }

    /// Update report status (admin only)
    pub fn update_status(
        env: Env,
        report_id: u64,
        admin: Address,
        new_status: String,
        verification_notes: String,
    ) -> bool {
        admin.require_auth();
        
        // Check if admin
        if !Self::is_admin(env.clone(), admin.clone()) {
            panic!("Unauthorized: Only admin can update status");
        }
        
        if let Some(mut report) = env.storage().persistent().get::<u64, NeedReport>(&report_id) {
            // Log status change
            Self::log_change(
                env.clone(),
                report_id,
                admin,
                String::from_str(&env, "status"),
                report.status.clone(),
                new_status.clone(),
                verification_notes.clone(),
            );
            
            report.status = new_status;
            report.verification_notes = verification_notes;
            report.updated_at = env.ledger().timestamp();
            
            // Save updated report
            env.storage().persistent().set(&report_id, &report);
            env.storage().persistent().extend_ttl(&report_id, 5184000, 5184000);
            
            true
        } else {
            false
        }
    }

    /// Update amount raised (when donations are received)
    pub fn update_amount_raised(
        env: Env,
        report_id: u64,
        new_amount_raised: u64,
        updater: Address,
    ) -> bool {
        updater.require_auth();
        
        // Check if admin (only admin can update raised amounts)
        if !Self::is_admin(env.clone(), updater.clone()) {
            panic!("Unauthorized: Only admin can update amount raised");
        }
        
        if let Some(mut report) = env.storage().persistent().get::<u64, NeedReport>(&report_id) {
            // Log amount change
            Self::log_change(
                env.clone(),
                report_id,
                updater,
                String::from_str(&env, "amount_raised"),
                String::from_str(&env, "amount_updated"),
                String::from_str(&env, "new_amount_raised"),
                String::from_str(&env, "Donation received"),
            );
            
            report.amount_raised = new_amount_raised;
            report.updated_at = env.ledger().timestamp();
            
            // Auto-update status if fully funded
            let pending_status = String::from_str(&env, "pending");
            let verified_status = String::from_str(&env, "verified");
            let funded_status = String::from_str(&env, "funded");
            
            if new_amount_raised >= report.amount_needed && report.status == verified_status {
                report.status = funded_status;
            }
            
            // Save updated report
            env.storage().persistent().set(&report_id, &report);
            env.storage().persistent().extend_ttl(&report_id, 5184000, 5184000);
            
            true
        } else {
            false
        }
    }

    /// Get all reports by a specific user
    pub fn get_user_reports(env: Env, user: Address) -> Vec<NeedReport> {
        let mut user_reports = Vec::new(&env);
        let total_count = env.storage().instance().get::<Symbol, u64>(&REPORTS_COUNT).unwrap_or(0);
        
        for i in 1..=total_count {
            if let Some(report) = env.storage().persistent().get::<u64, NeedReport>(&i) {
                if report.creator == user {
                    user_reports.push_back(report);
                }
            }
        }
        
        user_reports
    }

    /// Get all reports with pagination
    pub fn get_all_reports(env: Env, offset: u64, limit: u64) -> Vec<NeedReport> {
        let mut reports = Vec::new(&env);
        let total_count = env.storage().instance().get::<Symbol, u64>(&REPORTS_COUNT).unwrap_or(0);
        
        let start = offset.max(1);
        let end = (start + limit - 1).min(total_count);
        
        for i in start..=end {
            if let Some(report) = env.storage().persistent().get::<u64, NeedReport>(&i) {
                reports.push_back(report);
            }
        }
        
        reports
    }

    /// Get reports by status
    pub fn get_reports_by_status(env: Env, status: String) -> Vec<NeedReport> {
        let mut filtered_reports = Vec::new(&env);
        let total_count = env.storage().instance().get::<Symbol, u64>(&REPORTS_COUNT).unwrap_or(0);
        
        for i in 1..=total_count {
            if let Some(report) = env.storage().persistent().get::<u64, NeedReport>(&i) {
                if report.status == status {
                    filtered_reports.push_back(report);
                }
            }
        }
        
        filtered_reports
    }

    /// Get change log for a specific report
    pub fn get_change_log(env: Env, report_id: u64) -> Vec<ChangeLog> {
        // Use a different storage namespace for logs
        let log_key = Symbol::new(&env, &"LOG");
        let combined_key = (log_key, report_id);
        
        if let Some(logs) = env.storage().persistent().get::<(Symbol, u64), Vec<ChangeLog>>(&combined_key) {
            logs
        } else {
            Vec::new(&env)
        }
    }

    /// Get platform statistics
    pub fn get_stats(env: Env) -> ReportStats {
        let total_count = env.storage().instance().get::<Symbol, u64>(&REPORTS_COUNT).unwrap_or(0);
        let mut stats = ReportStats {
            total_reports: total_count,
            pending_reports: 0,
            verified_reports: 0,
            funded_reports: 0,
            completed_reports: 0,
            total_amount_needed: 0,
            total_amount_raised: 0,
        };
        
        let pending_status = String::from_str(&env, "pending");
        let verified_status = String::from_str(&env, "verified");
        let funded_status = String::from_str(&env, "funded");
        let completed_status = String::from_str(&env, "completed");
        
        for i in 1..=total_count {
            if let Some(report) = env.storage().persistent().get::<u64, NeedReport>(&i) {
                stats.total_amount_needed += report.amount_needed;
                stats.total_amount_raised += report.amount_raised;
                
                if report.status == pending_status {
                    stats.pending_reports += 1;
                } else if report.status == verified_status {
                    stats.verified_reports += 1;
                } else if report.status == funded_status {
                    stats.funded_reports += 1;
                } else if report.status == completed_status {
                    stats.completed_reports += 1;
                }
            }
        }
        
        stats
    }

    /// Check if an address is an admin
    pub fn is_admin(env: Env, address: Address) -> bool {
        if let Some(admins) = env.storage().instance().get::<Symbol, Vec<Address>>(&ADMIN_LIST) {
            for admin in admins.iter() {
                if admin == address {
                    return true;
                }
            }
        }
        false
    }

    /// Add admin (existing admin only)
    pub fn add_admin(env: Env, current_admin: Address, new_admin: Address) -> bool {
        current_admin.require_auth();
        
        if !Self::is_admin(env.clone(), current_admin) {
            panic!("Unauthorized: Only admin can add new admin");
        }
        
        if let Some(mut admins) = env.storage().instance().get::<Symbol, Vec<Address>>(&ADMIN_LIST) {
            // Check if already admin
            for admin in admins.iter() {
                if admin == new_admin {
                    return false; // Already an admin
                }
            }
            
            admins.push_back(new_admin);
            env.storage().instance().set(&ADMIN_LIST, &admins);
            env.storage().instance().extend_ttl(5184000, 5184000);
            true
        } else {
            false
        }
    }

    /// Internal function to log changes
    fn log_change(
        env: Env,
        report_id: u64,
        changed_by: Address,
        field_changed: String,
        old_value: String,
        new_value: String,
        reason: String,
    ) {
        let log_key = Symbol::new(&env, &"LOG");
        let combined_key = (log_key, report_id);
        
        let change_entry = ChangeLog {
            report_id,
            changed_by,
            field_changed,
            old_value,
            new_value,
            timestamp: env.ledger().timestamp(),
            reason,
        };
        
        let mut logs = env.storage().persistent()
            .get::<(Symbol, u64), Vec<ChangeLog>>(&combined_key)
            .unwrap_or_else(|| Vec::new(&env));
        
        logs.push_back(change_entry);
        
        env.storage().persistent().set(&combined_key, &logs);
        env.storage().persistent().extend_ttl(&combined_key, 5184000, 5184000);
    }
}

mod test;