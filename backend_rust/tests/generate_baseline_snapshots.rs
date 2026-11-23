use std::fs;
use std::path::Path;
use vedic_engine::{
    compatibility,
    constants::NAKSHATRA_NAMES,
    engine,
    models::{BirthData, CalculationProfile, TransitRequest},
    muhurtha::{self, MuhurthaRequest},
    swiss,
};

#[tokio::test]
async fn capture_baseline_snapshots() {
    swiss::init();

    let snapshots_dir = Path::new("tests/snapshots");
    if !snapshots_dir.exists() {
        fs::create_dir_all(snapshots_dir).expect("Failed to create snapshots directory");
    }

    // Benchmark Case A (Standard Northern Hemisphere - New Delhi)
    let case_a = BirthData {
        date: "24/10/1990".to_string(),
        time: "14:30".to_string(),
        lat: Some(28.6139),
        lon: Some(77.2090),
        timezone: Some(5.5),
        city: Some("New Delhi".to_string()),
    };

    // Benchmark Case B (Southern Hemisphere / Negative Latitude - Sydney)
    let case_b = BirthData {
        date: "15/05/1985".to_string(),
        time: "08:15".to_string(),
        lat: Some(-33.8688),
        lon: Some(151.2093),
        timezone: Some(10.0),
        city: Some("Sydney".to_string()),
    };

    // Benchmark Case C (Western Hemisphere / Negative Longitude - New York)
    let case_c = BirthData {
        date: "01/01/2000".to_string(),
        time: "00:05".to_string(),
        lat: Some(40.7128),
        lon: Some(-74.0060),
        timezone: Some(-5.0),
        city: Some("New York".to_string()),
    };

    let cases = vec![
        ("case_a", case_a),
        ("case_b", case_b),
        ("case_c", case_c),
    ];

    let mut charts = Vec::new();

    for (name, birth_data) in &cases {
        // 1. Chart Response
        let chart = engine::compute_chart_sync(birth_data.clone(), CalculationProfile::default())
            .expect(&format!("Chart calculation failed for {}", name));
        let chart_json = serde_json::to_string_pretty(&chart).unwrap();
        fs::write(snapshots_dir.join(format!("baseline_chart_{}.json", name)), chart_json).unwrap();

        // 2. Muhurtha Response
        let muhurtha_req = MuhurthaRequest {
            date: birth_data.date.clone(),
            time: birth_data.time.clone(),
            lat: birth_data.lat.unwrap(),
            lon: birth_data.lon.unwrap(),
            timezone: birth_data.timezone.unwrap(),
            activity: "travel".to_string(),
            direction: Some("North".to_string()),
            birth_moon_nakshatra: Some(chart.moon_intelligence.nakshatra.clone()),
            birth_moon_sign: Some(chart.moon_intelligence.sign.clone()),
        };
        let muhurtha_res = muhurtha::calculate_muhurtha(muhurtha_req)
            .await
            .expect(&format!("Muhurtha calculation failed for {}", name));
        let muhurtha_json = serde_json::to_string_pretty(&muhurtha_res).unwrap();
        fs::write(snapshots_dir.join(format!("baseline_muhurtha_{}.json", name)), muhurtha_json).unwrap();

        // 3. Transits Response
        let transit_req = TransitRequest {
            birth_data: birth_data.clone(),
            transit_date: "01/06/2024".to_string(),
            transit_time: "10:00".to_string(),
        };
        let transit_res = engine::compute_transits_sync(transit_req)
            .expect(&format!("Transit calculation failed for {}", name));
        let transit_json = serde_json::to_string_pretty(&transit_res).unwrap();
        fs::write(snapshots_dir.join(format!("baseline_transit_{}.json", name)), transit_json).unwrap();

        charts.push((name, chart));
    }

    // 4. Compatibility Response (Case A with Case B, and Case B with Case C)
    let get_nak_and_pada = |chart: &vedic_engine::models::ChartResponse| {
        let nak_name = &chart.moon_intelligence.nakshatra;
        let pada = chart.moon_intelligence.pada;
        let nak_idx = NAKSHATRA_NAMES.iter().position(|&x| x == nak_name).unwrap() as u8 + 1;
        (nak_idx, pada)
    };

    let (a_nak, a_pada) = get_nak_and_pada(&charts[0].1);
    let (b_nak, b_pada) = get_nak_and_pada(&charts[1].1);
    let (c_nak, c_pada) = get_nak_and_pada(&charts[2].1);

    let comp_ab = compatibility::compute_guna_milan(a_nak, a_pada, b_nak, b_pada, "ashtakoota");
    fs::write(
        snapshots_dir.join("baseline_compatibility_a_b.json"),
        serde_json::to_string_pretty(&comp_ab).unwrap(),
    ).unwrap();

    let comp_bc = compatibility::compute_guna_milan(b_nak, b_pada, c_nak, c_pada, "ashtakoota");
    fs::write(
        snapshots_dir.join("baseline_compatibility_b_c.json"),
        serde_json::to_string_pretty(&comp_bc).unwrap(),
    ).unwrap();

    println!("All baseline snapshots successfully captured and stored in tests/snapshots!");
}
