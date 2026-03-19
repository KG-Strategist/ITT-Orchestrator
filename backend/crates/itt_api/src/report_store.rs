//! Report Store — MongoDB-backed custom reports persistence
use mongodb::{
    bson::{doc, Document},
    Collection, Database,
};
use tracing::{info, instrument};
use futures::stream::StreamExt;
use crate::models::CustomReport;

/// Thread-safe MongoDB reports store.
pub struct ReportStore {
    collection: Collection<Document>,
}

impl ReportStore {
    /// Initialize the report store, connected to the `custom_reports` collection.
    pub fn new(db: &Database) -> Self {
        let collection = db.collection::<Document>("custom_reports");
        info!("ReportStore initialized (collection: custom_reports)");
        Self { collection }
    }

    #[instrument(name = "ReportStore::create_report", skip(self, report))]
    pub async fn create_report(&self, report: CustomReport) -> Result<CustomReport, String> {
        let doc = doc! {
            "id": &report.id,
            "name": &report.name,
            "dataSource": &report.data_source,
            "visualizationType": &report.visualization_type,
            "allowedRoles": &report.allowed_roles,
        };

        // Upsert logic based on ID
        let filter = doc! { "id": &report.id };
        let options = mongodb::options::ReplaceOptions::builder().upsert(true).build();
        
        self.collection
            .replace_one(filter, doc, options)
            .await
            .map_err(|e| format!("Failed to insert report: {}", e))?;

        info!("Report '{}' upserted successfully", report.id);
        Ok(report)
    }

    #[instrument(name = "ReportStore::get_all_reports", skip(self))]
    pub async fn get_all_reports(&self) -> Result<Vec<CustomReport>, String> {
        let mut cursor = self
            .collection
            .find(None, None)
            .await
            .map_err(|e| format!("MongoDB query failed: {}", e))?;

        let mut reports = Vec::new();
        while let Some(result) = cursor.next().await {
            match result {
                Ok(doc) => {
                    let id = doc.get_str("id").unwrap_or_default().to_string();
                    let name = doc.get_str("name").unwrap_or_default().to_string();
                    let data_source = doc.get_str("dataSource").unwrap_or_default().to_string();
                    let visualization_type = doc.get_str("visualizationType").unwrap_or_default().to_string();
                    
                    let roles_array = doc.get_array("allowedRoles").unwrap_or(&mongodb::bson::Array::new()).clone();
                    let allowed_roles: Vec<String> = roles_array.into_iter().filter_map(|b| b.as_str().map(|s| s.to_string())).collect();

                    reports.push(CustomReport {
                        id,
                        name,
                        data_source,
                        visualization_type,
                        allowed_roles,
                    });
                }
                Err(e) => return Err(format!("Error parsing report doc: {}", e)),
            }
        }

        Ok(reports)
    }

    #[instrument(name = "ReportStore::delete_report", skip(self))]
    pub async fn delete_report(&self, id: &str) -> Result<(), String> {
        self.collection
            .delete_one(doc! { "id": id }, None)
            .await
            .map_err(|e| format!("MongoDB delete failed: {}", e))?;
        Ok(())
    }
}
