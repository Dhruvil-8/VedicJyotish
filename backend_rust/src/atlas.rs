use std::{env, path::PathBuf};

use axum::http::StatusCode;
use once_cell::sync::Lazy;
use rusqlite::{params, Connection, OpenFlags};

use crate::{models::CityResult, ApiError};

static LOCATION_DB_PATH: Lazy<PathBuf> = Lazy::new(|| {
    env::var("LOCATION_DB_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("data/locations.db"))
});

pub fn search_city(query: &str) -> Result<Vec<CityResult>, ApiError> {
    let query = query.trim();
    if query.chars().count() < 3 {
        return Ok(Vec::new());
    }

    if !LOCATION_DB_PATH.exists() {
        return Err(ApiError::new(
            StatusCode::SERVICE_UNAVAILABLE,
            format!(
                "Local location database not found at {}. Run `cargo run --bin import_geonames -- <cities.txt>` first.",
                LOCATION_DB_PATH.display()
            ),
        ));
    }

    let conn = Connection::open_with_flags(
        LOCATION_DB_PATH.as_path(),
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|_| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Could not open location database.",
        )
    })?;

    let fts_query = build_fts_query(query);
    let mut results = if fts_query.is_empty() {
        Vec::new()
    } else {
        search_fts(&conn, &fts_query)?
    };

    if results.is_empty() {
        results = search_like(&conn, query)?;
    }

    Ok(results)
}

fn search_fts(conn: &Connection, fts_query: &str) -> Result<Vec<CityResult>, ApiError> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT l.display_name, l.latitude, l.longitude
            FROM locations_fts f
            JOIN locations l ON l.id = f.location_id
            WHERE locations_fts MATCH ?1
            ORDER BY l.population DESC, rank
            LIMIT 8
            "#,
        )
        .map_err(|_| ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, "Location search failed."))?;

    rows_to_city_results(stmt.query_map(params![fts_query], |row| {
        Ok(CityResult {
            name: row.get(0)?,
            lat: row.get(1)?,
            lon: row.get(2)?,
        })
    }))
}

fn search_like(conn: &Connection, query: &str) -> Result<Vec<CityResult>, ApiError> {
    let pattern = format!("{}%", query.trim());
    let mut stmt = conn
        .prepare(
            r#"
            SELECT display_name, latitude, longitude
            FROM locations
            WHERE ascii_name LIKE ?1 COLLATE NOCASE
               OR name LIKE ?1 COLLATE NOCASE
            ORDER BY population DESC
            LIMIT 8
            "#,
        )
        .map_err(|_| ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, "Location search failed."))?;

    rows_to_city_results(stmt.query_map(params![pattern], |row| {
        Ok(CityResult {
            name: row.get(0)?,
            lat: row.get(1)?,
            lon: row.get(2)?,
        })
    }))
}

fn rows_to_city_results(
    rows: rusqlite::Result<
        rusqlite::MappedRows<'_, impl FnMut(&rusqlite::Row<'_>) -> rusqlite::Result<CityResult>>,
    >,
) -> Result<Vec<CityResult>, ApiError> {
    let rows = rows
        .map_err(|_| ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, "Location search failed."))?;
    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|_| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Location result parsing failed.",
            )
        })?);
    }
    Ok(results)
}

fn build_fts_query(query: &str) -> String {
    query
        .split(|c: char| !c.is_alphanumeric())
        .filter(|token| token.chars().count() >= 2)
        .take(6)
        .map(|token| format!("{}*", escape_fts_token(token)))
        .collect::<Vec<_>>()
        .join(" AND ")
}

fn escape_fts_token(token: &str) -> String {
    token
        .chars()
        .filter(|c| c.is_alphanumeric())
        .collect::<String>()
}
