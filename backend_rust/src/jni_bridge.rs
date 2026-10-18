//! JNI Bridge for VedicJyotish Android Native Integration.
//!
//! Provides direct, offline in-process access to the Rust Vedic astrology calculation engine
//! for Android apps via native shared libraries (`.so`).

use jni::objects::{JClass, JString};
use jni::sys::jstring;
use jni::JNIEnv;

use crate::{
    compatibility, engine,
    models::{BirthData, CalculationProfile, TransitRequest},
    swiss,
};

/// Initialize custom Swiss Ephemeris data path if ephemeris files are deployed on Android.
/// If not called, Swiss Ephemeris automatically uses built-in high-precision Moshier analytical ephemeris.
#[no_mangle]
pub extern "system" fn Java_com_example_vedicjyotish_data_astrology_RustBridge_initEphemeris(
    mut env: JNIEnv,
    _class: JClass,
    path: JString,
) {
    if let Ok(p) = env.get_string(&path) {
        let path_str: String = p.into();
        if !path_str.is_empty() {
            if let Ok(c_path) = std::ffi::CString::new(path_str) {
                let _guard = swiss::SWISS_LOCK.lock().expect("Swiss lock poisoned");
                unsafe {
                    swiss_eph::swe_set_ephe_path(c_path.as_ptr());
                }
            }
        }
    }
}

/// Calculate a full Vedic Birth Chart (Kundali, Navamsha, Vargas D1-D60, Dashas, Ashtakavarga,
/// Shadbala, Yogas, Doshas, Panchanga) directly and synchronously.
#[no_mangle]
pub extern "system" fn Java_com_example_vedicjyotish_data_astrology_RustBridge_calculateChart(
    mut env: JNIEnv,
    _class: JClass,
    input_json: JString,
) -> jstring {
    let input: String = match env.get_string(&input_json) {
        Ok(s) => s.into(),
        Err(e) => {
            return env
                .new_string(format!("{{\"error\":\"Invalid UTF-8 string: {}\"}}", e))
                .unwrap()
                .into_raw();
        }
    };

    let birth_data: BirthData = match serde_json::from_str(&input) {
        Ok(b) => b,
        Err(e) => {
            return env
                .new_string(format!("{{\"error\":\"Failed to parse BirthData JSON: {}\"}}", e))
                .unwrap()
                .into_raw();
        }
    };

    let profile = CalculationProfile::default();
    match engine::compute_chart_sync(birth_data, profile) {
        Ok(chart) => match serde_json::to_string(&chart) {
            Ok(json_str) => env.new_string(json_str).unwrap().into_raw(),
            Err(e) => env
                .new_string(format!("{{\"error\":\"Failed to serialize ChartResponse: {}\"}}", e))
                .unwrap()
                .into_raw(),
        },
        Err(e) => env
            .new_string(format!("{{\"error\":\"{}\"}}", e.message))
            .unwrap()
            .into_raw(),
    }
}

/// Calculate real-time planetary transits (Gochara) overlaid on a birth chart.
#[no_mangle]
pub extern "system" fn Java_com_example_vedicjyotish_data_astrology_RustBridge_calculateTransits(
    mut env: JNIEnv,
    _class: JClass,
    input_json: JString,
) -> jstring {
    let input: String = match env.get_string(&input_json) {
        Ok(s) => s.into(),
        Err(e) => {
            return env
                .new_string(format!("{{\"error\":\"Invalid UTF-8 string: {}\"}}", e))
                .unwrap()
                .into_raw();
        }
    };

    let request: TransitRequest = match serde_json::from_str(&input) {
        Ok(r) => r,
        Err(e) => {
            return env
                .new_string(format!("{{\"error\":\"Failed to parse TransitRequest JSON: {}\"}}", e))
                .unwrap()
                .into_raw();
        }
    };

    match engine::compute_transits_sync(request) {
        Ok(resp) => match serde_json::to_string(&resp) {
            Ok(json_str) => env.new_string(json_str).unwrap().into_raw(),
            Err(e) => env
                .new_string(format!("{{\"error\":\"Failed to serialize TransitResponse: {}\"}}", e))
                .unwrap()
                .into_raw(),
        },
        Err(e) => env
            .new_string(format!("{{\"error\":\"{}\"}}", e.message))
            .unwrap()
            .into_raw(),
    }
}

#[derive(serde::Deserialize)]
struct MatchRequest {
    boy_nak_idx: u8,
    boy_pada: u8,
    girl_nak_idx: u8,
    girl_pada: u8,
    method: String,
}

/// Calculate Ashtakoota Kundali Matching / Guna Milan compatibility.
#[no_mangle]
pub extern "system" fn Java_com_example_vedicjyotish_data_astrology_RustBridge_calculateCompatibility(
    mut env: JNIEnv,
    _class: JClass,
    input_json: JString,
) -> jstring {
    let input: String = match env.get_string(&input_json) {
        Ok(s) => s.into(),
        Err(e) => {
            return env
                .new_string(format!("{{\"error\":\"Invalid UTF-8 string: {}\"}}", e))
                .unwrap()
                .into_raw();
        }
    };

    let req: MatchRequest = match serde_json::from_str(&input) {
        Ok(r) => r,
        Err(e) => {
            return env
                .new_string(format!("{{\"error\":\"Failed to parse MatchRequest JSON: {}\"}}", e))
                .unwrap()
                .into_raw();
        }
    };

    let report = compatibility::compute_guna_milan(
        req.boy_nak_idx,
        req.boy_pada,
        req.girl_nak_idx,
        req.girl_pada,
        &req.method,
    );

    match serde_json::to_string(&report) {
        Ok(json_str) => env.new_string(json_str).unwrap().into_raw(),
        Err(e) => env
            .new_string(format!("{{\"error\":\"Failed to serialize compatibility: {}\"}}", e))
            .unwrap()
            .into_raw(),
    }
}
