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

fn jd_local_midnight(jd_ut: f64, offset_hours: f64) -> f64 {
    let unix_timestamp = (jd_ut - 2440587.5) * 86400.0;
    if let Some(naive_utc) = chrono::DateTime::from_timestamp(unix_timestamp.round() as i64, 0).map(|dt| dt.naive_utc()) {
        let local_dt = naive_utc + chrono::Duration::seconds((offset_hours * 3600.0).round() as i64);
        let local_midnight = chrono::NaiveDateTime::new(
            local_dt.date(),
            chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap(),
        );
        let utc_midnight = local_midnight - chrono::Duration::seconds((offset_hours * 3600.0).round() as i64);
        let utc_timestamp = utc_midnight.and_utc().timestamp();
        (utc_timestamp as f64 / 86400.0) + 2440587.5
    } else {
        jd_ut - 0.5
    }
}

pub fn calculate_sunrise_sunset(
    jd_ut: f64,
    lat: f64,
    lon: f64,
    offset_hours: f64,
) -> Result<(f64, f64), ApiError> {
    let search_start_jd = jd_local_midnight(jd_ut, offset_hours);
    let _guard = SWISS_LOCK.lock().expect("Swiss Ephemeris lock poisoned");
    let mut tret_rise = 0.0;
    let mut tret_set = 0.0;
    let mut serr = [0_i8; 256];
    let mut geopos = [lon, lat, 0.0];


    unsafe {
        let res_rise = swiss_eph::swe_rise_trans(
            search_start_jd,
            swiss_eph::SE_SUN,
            std::ptr::null_mut(),
            swiss_eph::SEFLG_SWIEPH,
            1, // rise (apparent rising: upper limb of Sun with refraction)
            geopos.as_mut_ptr(),
            0.0,
            0.0,
            &mut tret_rise,
            serr.as_mut_ptr(),
        );
        if res_rise < 0 {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Sunrise calculation failed.",
            ));
        }

        let res_set = swiss_eph::swe_rise_trans(
            search_start_jd,
            swiss_eph::SE_SUN,
            std::ptr::null_mut(),
            swiss_eph::SEFLG_SWIEPH,
            2, // set (apparent setting: upper limb of Sun with refraction)
            geopos.as_mut_ptr(),
            0.0,
            0.0,
            &mut tret_set,
            serr.as_mut_ptr(),
        );
        if res_set < 0 {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Sunset calculation failed.",
            ));
        }
    }

    Ok((tret_rise, tret_set))
}

