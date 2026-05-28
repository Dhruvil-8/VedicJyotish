use std::{env, path::PathBuf, sync::Mutex};

use axum::http::StatusCode;
use once_cell::sync::Lazy;
use rusqlite::{params, Connection, OpenFlags};

use crate::{models::CityResult, ApiError};

static LOCATION_DB_PATH: Lazy<PathBuf> = Lazy::new(|| {
    env::var("LOCATION_DB_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("data/locations.db"))
});

/// Cached read-only SQLite connection to avoid open/close overhead per request.
static DB_CONN: Lazy<Option<Mutex<Connection>>> = Lazy::new(|| {
    if !LOCATION_DB_PATH.exists() {
        return None;
    }
    Connection::open_with_flags(
        LOCATION_DB_PATH.as_path(),
        OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .ok()
    .map(Mutex::new)
});

pub fn search_city(query: &str) -> Result<Vec<CityResult>, ApiError> {
    let query = query.trim();
    if query.chars().count() < 3 {
        return Ok(Vec::new());
    }

    let conn_guard = DB_CONN
        .as_ref()
        .ok_or_else(|| {
            ApiError::new(
                StatusCode::SERVICE_UNAVAILABLE,
                format!(
                    "Local location database not found at {}. Run `cargo run --bin import_geonames -- <cities.txt>` first.",
                    LOCATION_DB_PATH.display()
                ),
            )
        })?
        .lock()
        .map_err(|_| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Location database lock poisoned.",
            )
        })?;

    let fts_query = build_fts_query(query);
    let mut results = if fts_query.is_empty() {
        Vec::new()
    } else {
        search_fts(&conn_guard, &fts_query)?
    };

    if results.is_empty() {
        results = search_like(&conn_guard, query)?;
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
