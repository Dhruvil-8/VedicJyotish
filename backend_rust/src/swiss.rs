use crate::{constants, ApiError};
use axum::http::StatusCode;
use once_cell::sync::Lazy;
use std::{env, ffi::CString, path::PathBuf, sync::Mutex};

pub static SWISS_LOCK: Lazy<Mutex<()>> = Lazy::new(|| Mutex::new(()));

pub fn init() {
    let ephe_path = env::var("SWISS_EPHE_PATH").ok().or_else(|| {
        let candidate = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../backend/ephe");
        candidate
            .exists()
            .then(|| candidate.to_string_lossy().to_string())
    });

    if let Some(path) = ephe_path {
        if let Ok(c_path) = CString::new(path) {
            let _guard = SWISS_LOCK.lock().expect("Swiss Ephemeris lock poisoned");
            unsafe {
                swiss_eph::swe_set_ephe_path(c_path.as_ptr());
            }
        }
    }
}

pub struct RawPlanet {
    pub name: &'static str,
    pub longitude: f64,
    pub speed: f64,
}

pub struct SwissSnapshot {
    pub ascendant_degree: f64,
    pub planets: Vec<RawPlanet>,
}

pub fn calculate_snapshot(jd_ut: f64, lat: f64, lon: f64) -> Result<SwissSnapshot, ApiError> {
    let _guard = SWISS_LOCK.lock().expect("Swiss Ephemeris lock poisoned");

    unsafe {
        swiss_eph::swe_set_sid_mode(swiss_eph::SE_SIDM_LAHIRI, 0.0, 0.0);
    }

    let mut cusps = [0.0_f64; 13];
    let mut ascmc = [0.0_f64; 10];
    let house_result = unsafe {
        swiss_eph::swe_houses_ex(
            jd_ut,
            constants::HOUSE_FLAGS,
            lat,
            lon,
            b'A' as i32,
            cusps.as_mut_ptr(),
            ascmc.as_mut_ptr(),
        )
    };
    if house_result < 0 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "House calculation failed for this location/date.",
        ));
    }

    let mut planets = Vec::with_capacity(constants::PLANETS.len());
    for (name, planet_id) in constants::PLANETS {
        let mut xx = [0.0_f64; 6];
        let mut serr = [0_i8; 256];
        let result = unsafe {
            swiss_eph::swe_calc_ut(
                jd_ut,
                planet_id,
                constants::PLANET_FLAGS,
                xx.as_mut_ptr(),
                serr.as_mut_ptr(),
            )
        };
        if result < 0 {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                format!("Planet calculation failed for {name}."),
            ));
        }
        planets.push(RawPlanet {
            name,
            longitude: normalize_degree(xx[0]),
            speed: xx[3],
        });
    }

    Ok(SwissSnapshot {
        ascendant_degree: normalize_degree(ascmc[0]),
        planets,
    })
}

pub fn normalize_degree(degree: f64) -> f64 {
    degree.rem_euclid(360.0)
}
