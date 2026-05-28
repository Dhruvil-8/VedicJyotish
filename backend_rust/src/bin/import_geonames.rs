use rusqlite::{params, Connection};
use std::{
    env,
    fs::File,
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
};

#[derive(Debug)]
struct GeoNameRecord {
    geoname_id: i64,
    name: String,
    ascii_name: String,
    alternate_names: String,
    latitude: f64,
    longitude: f64,
    feature_class: String,
    feature_code: String,
    country_code: String,
    admin1_code: String,
    population: i64,
    timezone: String,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().skip(1).collect();
    let (inputs, output) = parse_args(&args)?;

    if let Some(parent) = output.parent() {
        std::fs::create_dir_all(parent)?;
    }

    if output.exists() {
        std::fs::remove_file(&output)?;
    }

    let conn = Connection::open(&output)?;
    configure_db(&conn)?;
    create_schema(&conn)?;
    for input in &inputs {
        import_file(&conn, input)?;
    }
    create_indexes(&conn)?;

    println!("Location database written to {}", output.display());
    Ok(())
}

fn parse_args(args: &[String]) -> Result<(Vec<PathBuf>, PathBuf), Box<dyn std::error::Error>> {
    if args.is_empty() {
        return Err("Usage: cargo run --bin import_geonames -- [--output data/locations.db] <geonames text file> [more files...]".into());
    }

    let mut output = default_output_path();
    let mut inputs = Vec::new();
    let mut i = 0;
    while i < args.len() {
        if args[i] == "--output" || args[i] == "-o" {
            i += 1;
            output = args
                .get(i)
                .ok_or("--output requires a database path")?
                .into();
        } else {
            inputs.push(PathBuf::from(&args[i]));
        }
        i += 1;
    }

    if inputs.is_empty() {
        return Err("At least one GeoNames text file is required.".into());
    }
    Ok((inputs, output))
}

fn default_output_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("data/locations.db")
}

fn configure_db(conn: &Connection) -> rusqlite::Result<()> {
    conn.pragma_update(None, "journal_mode", "OFF")?;
    conn.pragma_update(None, "synchronous", "OFF")?;
    conn.pragma_update(None, "temp_store", "MEMORY")?;
    Ok(())
}

fn create_schema(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE locations (
            id INTEGER PRIMARY KEY,
            geoname_id INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL,
            ascii_name TEXT NOT NULL,
            alternate_names TEXT NOT NULL,
            display_name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            country_code TEXT NOT NULL,
            admin1_code TEXT NOT NULL,
            feature_class TEXT NOT NULL,
            feature_code TEXT NOT NULL,
            population INTEGER NOT NULL,
            timezone TEXT NOT NULL
        );

        CREATE VIRTUAL TABLE locations_fts USING fts5(
            location_id UNINDEXED,
            name,
            ascii_name,
            alternate_names,
            display_name
        );
        "#,
    )
}

fn import_file(conn: &Connection, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    println!("Importing {}...", path.display());
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let tx = conn.unchecked_transaction()?;

    {
        let mut insert_location = tx.prepare(
            r#"
            INSERT OR IGNORE INTO locations (
                geoname_id, name, ascii_name, alternate_names, display_name,
                latitude, longitude, country_code, admin1_code, feature_class, feature_code,
                population, timezone
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
            "#,
        )?;
        let mut insert_fts = tx.prepare(
            r#"
            INSERT INTO locations_fts (
                rowid, location_id, name, ascii_name, alternate_names, display_name
            )
            VALUES (?1, ?1, ?2, ?3, ?4, ?5)
            "#,
        )?;

        let mut imported = 0_i64;
        for line in reader.lines() {
            let line = line?;
            let Some(record) = parse_geonames_line(&line) else {
                continue;
            };
            let display_name = display_name(&record);

            let inserted = insert_location.execute(params![
                record.geoname_id,
                record.name,
                record.ascii_name,
                record.alternate_names,
                display_name,
                record.latitude,
                record.longitude,
                record.country_code,
                record.admin1_code,
                record.feature_class,
                record.feature_code,
                record.population,
                record.timezone,
            ])?;
            if inserted == 0 {
                continue;
            }
            let rowid = tx.last_insert_rowid();
            insert_fts.execute(params![
                rowid,
                record.name,
                record.ascii_name,
                record.alternate_names,
                display_name,
            ])?;

            imported += 1;
            if imported % 25_000 == 0 {
                println!("Imported {imported} locations...");
            }
        }
        println!("Imported {imported} locations.");
    }

    tx.commit()?;
    Ok(())
}

fn create_indexes(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        r#"
        CREATE INDEX idx_locations_ascii_name ON locations(ascii_name);
        CREATE INDEX idx_locations_country ON locations(country_code);
        CREATE INDEX idx_locations_feature ON locations(feature_class, feature_code);
        CREATE INDEX idx_locations_population ON locations(population DESC);
        ANALYZE;
        VACUUM;
        "#,
    )
}

fn parse_geonames_line(line: &str) -> Option<GeoNameRecord> {
    let cols: Vec<&str> = line.split('\t').collect();
    if cols.len() < 19 {
        return None;
    }
    Some(GeoNameRecord {
        geoname_id: cols[0].parse().ok()?,
        name: cols[1].to_string(),
        ascii_name: cols[2].to_string(),
        alternate_names: cols[3].to_string(),
        latitude: cols[4].parse().ok()?,
        longitude: cols[5].parse().ok()?,
        feature_class: cols[6].to_string(),
        feature_code: cols[7].to_string(),
        country_code: cols[8].to_string(),
        admin1_code: cols[10].to_string(),
        population: cols[14].parse().unwrap_or(0),
        timezone: cols[17].to_string(),
    })
    .filter(|record| should_import(record))
}

fn should_import(record: &GeoNameRecord) -> bool {
    record.feature_class == "P"
}

fn display_name(record: &GeoNameRecord) -> String {
    let mut parts = vec![record.name.clone()];
    if !record.admin1_code.is_empty() {
        parts.push(record.admin1_code.clone());
    }
    if !record.country_code.is_empty() {
        parts.push(record.country_code.clone());
    }
    parts.join(", ")
}
