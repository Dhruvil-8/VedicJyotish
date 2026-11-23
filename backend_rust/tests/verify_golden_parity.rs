//! Automated Golden Snapshot Parity Verification Suite
//!
//! Validates that all newly computed outputs from `backend_rust` (consuming `vedic_core`)
//! match the Phase 0 golden baseline snapshots with zero divergence (Δ <= 0.0001°).

use std::fs;
use std::path::PathBuf;
use serde_json::Value;

use vedic_engine::{
    compatibility,
    constants::NAKSHATRA_NAMES,
    engine,
    models::{BirthData, CalculationProfile, TransitRequest},
    muhurtha::{self, MuhurthaRequest},
    swiss,
};

fn get_snapshot_path(filename: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/snapshots")
        .join(filename)
}

fn assert_json_close(actual: &Value, expected: &Value, path: &str) {
    match (actual, expected) {
        (Value::Number(a), Value::Number(b)) => {
            let a_f = a.as_f64().unwrap();
            let b_f = b.as_f64().unwrap();
            let diff = (a_f - b_f).abs();
            assert!(
                diff <= 0.0001,
                "Numerical divergence at {path}: actual={a_f}, expected={b_f}, diff={diff}"
            );
        }
        (Value::String(a), Value::String(b)) => {
            assert_eq!(a, b, "String divergence at {path}: actual={a}, expected={b}");
        }
        (Value::Bool(a), Value::Bool(b)) => {
            assert_eq!(a, b, "Boolean divergence at {path}: actual={a}, expected={b}");
        }
        (Value::Null, Value::Null) => {}
        (Value::Array(a_arr), Value::Array(b_arr)) => {
            assert_eq!(
                a_arr.len(),
                b_arr.len(),
                "Array length mismatch at {path}: actual={}, expected={}",
                a_arr.len(),
                b_arr.len()
            );
            for (i, (a_item, b_item)) in a_arr.iter().zip(b_arr.iter()).enumerate() {
                assert_json_close(a_item, b_item, &format!("{path}[{i}]"));
            }
        }
        (Value::Object(a_obj), Value::Object(b_obj)) => {
            for (key, b_val) in b_obj {
                let current_path = format!("{path}.{key}");
                if let Some(a_val) = a_obj.get(key) {
                    assert_json_close(a_val, b_val, &current_path);
                } else {
                    panic!("Missing key in actual output at {current_path}");
                }
            }
        }
        _ => {
            panic!("Type mismatch at {path}: actual={actual:?}, expected={expected:?}");
        }
    }
}

#[tokio::test]
async fn verify_case_a_chart_parity() {
    swiss::init();
    let birth_data = BirthData {
        date: "24/10/1990".to_string(),
        time: "14:30".to_string(),
        city: Some("New Delhi".to_string()),
        lat: Some(28.6139),
        lon: Some(77.2090),
        timezone: Some(5.5),
    };
    let chart = engine::compute_chart_with_profile(birth_data, CalculationProfile::default())
        .await
        .expect("compute chart");
    let actual_val: Value = serde_json::to_value(&chart).unwrap();

    let raw_snapshot = fs::read_to_string(get_snapshot_path("baseline_chart_case_a.json"))
        .expect("read baseline_chart_case_a.json");
    let expected_val: Value = serde_json::from_str(&raw_snapshot).unwrap();

    assert_json_close(&actual_val, &expected_val, "case_a_chart");
}

#[tokio::test]
async fn verify_case_b_chart_parity() {
    swiss::init();
    let birth_data = BirthData {
        date: "15/05/1985".to_string(),
        time: "08:15".to_string(),
        city: Some("Sydney".to_string()),
        lat: Some(-33.8688),
        lon: Some(151.2093),
        timezone: Some(10.0),
    };
    let chart = engine::compute_chart_with_profile(birth_data, CalculationProfile::default())
        .await
        .expect("compute chart");
    let actual_val: Value = serde_json::to_value(&chart).unwrap();

    let raw_snapshot = fs::read_to_string(get_snapshot_path("baseline_chart_case_b.json"))
        .expect("read baseline_chart_case_b.json");
    let expected_val: Value = serde_json::from_str(&raw_snapshot).unwrap();

    assert_json_close(&actual_val, &expected_val, "case_b_chart");
}

#[tokio::test]
async fn verify_case_c_chart_parity() {
    swiss::init();
    let birth_data = BirthData {
        date: "01/01/2000".to_string(),
        time: "00:05".to_string(),
        city: Some("New York".to_string()),
        lat: Some(40.7128),
        lon: Some(-74.0060),
        timezone: Some(-5.0),
    };
    let chart = engine::compute_chart_with_profile(birth_data, CalculationProfile::default())
        .await
        .expect("compute chart");
    let actual_val: Value = serde_json::to_value(&chart).unwrap();

    let raw_snapshot = fs::read_to_string(get_snapshot_path("baseline_chart_case_c.json"))
        .expect("read baseline_chart_case_c.json");
    let expected_val: Value = serde_json::from_str(&raw_snapshot).unwrap();

    assert_json_close(&actual_val, &expected_val, "case_c_chart");
}

#[tokio::test]
async fn verify_muhurtha_parity_all_cases() {
    swiss::init();
    let cases = [
        ("case_a", "24/10/1990", "14:30", 28.6139, 77.2090, 5.5, "New Delhi"),
        ("case_b", "15/05/1985", "08:15", -33.8688, 151.2093, 10.0, "Sydney"),
        ("case_c", "01/01/2000", "00:05", 40.7128, -74.0060, -5.0, "New York"),
    ];

    for (name, date, time, lat, lon, tz, city) in cases {
        let birth = BirthData {
            date: date.to_string(),
            time: time.to_string(),
            city: Some(city.to_string()),
            lat: Some(lat),
            lon: Some(lon),
            timezone: Some(tz),
        };
        let chart = engine::compute_chart(birth).await.expect("chart");

        let req = MuhurthaRequest {
            date: date.to_string(),
            time: time.to_string(),
            lat,
            lon,
            timezone: tz,
            activity: "travel".to_string(),
            direction: Some("North".to_string()),
            birth_moon_nakshatra: Some(chart.moon_intelligence.nakshatra.clone()),
            birth_moon_sign: Some(chart.moon_intelligence.sign.clone()),
        };
        let res = muhurtha::calculate_muhurtha(req).await.expect("calculate muhurtha");
        let actual_val: Value = serde_json::to_value(&res).unwrap();

        let snapshot_file = format!("baseline_muhurtha_{name}.json");
        let raw_snapshot = fs::read_to_string(get_snapshot_path(&snapshot_file)).expect(&snapshot_file);
        let expected_val: Value = serde_json::from_str(&raw_snapshot).unwrap();

        assert_json_close(&actual_val, &expected_val, &snapshot_file);
    }
}

#[tokio::test]
async fn verify_transit_parity_all_cases() {
    swiss::init();
    let cases = [
        ("case_a", "24/10/1990", "14:30", "New Delhi", 28.6139, 77.2090, 5.5),
        ("case_b", "15/05/1985", "08:15", "Sydney", -33.8688, 151.2093, 10.0),
        ("case_c", "01/01/2000", "00:05", "New York", 40.7128, -74.0060, -5.0),
    ];

    for (name, date, time, city, lat, lon, tz) in cases {
        let req = TransitRequest {
            birth_data: BirthData {
                date: date.to_string(),
                time: time.to_string(),
                city: Some(city.to_string()),
                lat: Some(lat),
                lon: Some(lon),
                timezone: Some(tz),
            },
            transit_date: "01/06/2024".to_string(),
            transit_time: "10:00".to_string(),
        };
        let res = engine::compute_transits(req).await.expect("compute transits");
        let actual_val: Value = serde_json::to_value(&res).unwrap();

        let snapshot_file = format!("baseline_transit_{name}.json");
        let raw_snapshot = fs::read_to_string(get_snapshot_path(&snapshot_file)).expect(&snapshot_file);
        let expected_val: Value = serde_json::from_str(&raw_snapshot).unwrap();

        assert_json_close(&actual_val, &expected_val, &snapshot_file);
    }
}

#[tokio::test]
async fn verify_compatibility_parity_all_cases() {
    swiss::init();
    let birth_a = BirthData {
        date: "24/10/1990".to_string(),
        time: "14:30".to_string(),
        city: Some("New Delhi".to_string()),
        lat: Some(28.6139),
        lon: Some(77.2090),
        timezone: Some(5.5),
    };
    let birth_b = BirthData {
        date: "15/05/1985".to_string(),
        time: "08:15".to_string(),
        city: Some("Sydney".to_string()),
        lat: Some(-33.8688),
        lon: Some(151.2093),
        timezone: Some(10.0),
    };
    let birth_c = BirthData {
        date: "01/01/2000".to_string(),
        time: "00:05".to_string(),
        city: Some("New York".to_string()),
        lat: Some(40.7128),
        lon: Some(-74.0060),
        timezone: Some(-5.0),
    };

    let chart_a = engine::compute_chart(birth_a).await.unwrap();
    let chart_b = engine::compute_chart(birth_b).await.unwrap();
    let chart_c = engine::compute_chart(birth_c).await.unwrap();

    let get_nak_and_pada = |chart: &vedic_engine::models::ChartResponse| {
        let nak_name = &chart.moon_intelligence.nakshatra;
        let pada = chart.moon_intelligence.pada;
        let nak_idx = NAKSHATRA_NAMES.iter().position(|&x| x == nak_name).unwrap() as u8 + 1;
        (nak_idx, pada)
    };

    let (a_nak, a_pada) = get_nak_and_pada(&chart_a);
    let (b_nak, b_pada) = get_nak_and_pada(&chart_b);
    let (c_nak, c_pada) = get_nak_and_pada(&chart_c);

    // Pair A & B
    let rep_ab = compatibility::compute_guna_milan(a_nak, a_pada, b_nak, b_pada, "ashtakoota");
    let actual_ab: Value = serde_json::to_value(&rep_ab).unwrap();
    let expected_ab: Value = serde_json::from_str(
        &fs::read_to_string(get_snapshot_path("baseline_compatibility_a_b.json")).unwrap(),
    )
    .unwrap();
    assert_json_close(&actual_ab, &expected_ab, "compat_ab");

    // Pair B & C
    let rep_bc = compatibility::compute_guna_milan(b_nak, b_pada, c_nak, c_pada, "ashtakoota");
    let actual_bc: Value = serde_json::to_value(&rep_bc).unwrap();
    let expected_bc: Value = serde_json::from_str(
        &fs::read_to_string(get_snapshot_path("baseline_compatibility_b_c.json")).unwrap(),
    )
    .unwrap();
    assert_json_close(&actual_bc, &expected_bc, "compat_bc");
}
