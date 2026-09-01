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

#[allow(dead_code)]
pub struct SwissSnapshot {
    pub ascendant_degree: f64,
    pub mc_degree: f64,
    pub armc: f64,
    pub vertex_degree: f64,
    pub house_cusps: [f64; 13],
    pub planets: Vec<RawPlanet>,
    pub ayanamsa_value: f64,
}

pub fn ayanamsa_to_sid_mode(name: &str) -> (i32, bool) {
    match name.to_lowercase().replace(['-', ' '], "_").as_str() {
        "raman" => (swiss_eph::SE_SIDM_RAMAN, true),
        "kp" | "krishnamurti" => (swiss_eph::SE_SIDM_KRISHNAMURTI, true),
        "yukteshwar" => (swiss_eph::SE_SIDM_YUKTESHWAR, true),
        "true_chitra" | "true_citra" => (swiss_eph::SE_SIDM_TRUE_CITRA, true),
        "true_pushya" => (swiss_eph::SE_SIDM_TRUE_PUSHYA, true),
        "surya_siddhanta" | "suryasiddhanta" => (swiss_eph::SE_SIDM_SURYASIDDHANTA, true),
        "fagan_bradley" => (swiss_eph::SE_SIDM_FAGAN_BRADLEY, true),
        "tropical" => (0, false),
        _ => (swiss_eph::SE_SIDM_LAHIRI, true),
    }
}

pub fn house_system_to_hsys(name: &str) -> i32 {
    match name.to_lowercase().replace(['-', ' '], "_").as_str() {
        "placidus" => b'P' as i32,
        "koch" => b'K' as i32,
        "campanus" => b'C' as i32,
        "regiomontanus" => b'R' as i32,
        "porphyry" | "sripati" => b'O' as i32,
        _ => b'A' as i32, // Default to Equal / Ascendant cusp
    }
}

pub fn calculate_snapshot(jd_ut: f64, lat: f64, lon: f64) -> Result<SwissSnapshot, ApiError> {
    calculate_snapshot_with_profile(jd_ut, lat, lon, "lahiri", "mean", "wholesign")
}

pub fn calculate_snapshot_with_profile(
    jd_ut: f64,
    lat: f64,
    lon: f64,
    ayanamsa_name: &str,
    node_type: &str,
    house_system_name: &str,
) -> Result<SwissSnapshot, ApiError> {
    let _guard = SWISS_LOCK.lock().expect("Swiss Ephemeris lock poisoned");

    let (sid_mode, is_sidereal) = ayanamsa_to_sid_mode(ayanamsa_name);
    let mut planet_flags = swiss_eph::SEFLG_SPEED | swiss_eph::SEFLG_SWIEPH;
    let mut house_flags = swiss_eph::SEFLG_SWIEPH;

    if is_sidereal {
        unsafe {
            swiss_eph::swe_set_sid_mode(sid_mode, 0.0, 0.0);
        }
        planet_flags |= swiss_eph::SEFLG_SIDEREAL;
        house_flags |= swiss_eph::SEFLG_SIDEREAL;
    }

    let ayanamsa_val = if is_sidereal {
        unsafe { swiss_eph::swe_get_ayanamsa_ut(jd_ut) }
    } else {
        0.0
    };

    let hsys = house_system_to_hsys(house_system_name);
    let mut cusps = [0.0_f64; 13];
    let mut ascmc = [0.0_f64; 10];
    let house_result = unsafe {
        swiss_eph::swe_houses_ex(
            jd_ut,
            house_flags,
            lat,
            lon,
            hsys,
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

    let use_true_node = node_type.eq_ignore_ascii_case("true");
    let mut planets = Vec::with_capacity(constants::PLANETS.len());
    for (name, planet_id) in constants::PLANETS {
        let actual_id = if name == "Rahu" && use_true_node {
            swiss_eph::SE_TRUE_NODE
        } else {
            planet_id
        };

        let mut xx = [0.0_f64; 6];
        let mut serr = [0_i8; 256];
        let result = unsafe {
            swiss_eph::swe_calc_ut(
                jd_ut,
                actual_id,
                planet_flags,
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
        mc_degree: normalize_degree(ascmc[1]),
        armc: ascmc[2],
        vertex_degree: normalize_degree(ascmc[3]),
        house_cusps: cusps,
        planets,
        ayanamsa_value: ayanamsa_val,
    })
}

pub fn normalize_degree(degree: f64) -> f64 {
    degree.rem_euclid(360.0)
}

pub fn get_sun_moon_sidereal(jd_ut: f64) -> (f64, f64) {
    let _guard = SWISS_LOCK.lock().expect("Swiss Ephemeris lock poisoned");
    unsafe {
        swiss_eph::swe_set_sid_mode(swiss_eph::SE_SIDM_LAHIRI, 0.0, 0.0);
        let mut xx_sun = [0.0_f64; 6];
        let mut serr = [0_i8; 256];
        swiss_eph::swe_calc_ut(
            jd_ut,
            swiss_eph::SE_SUN,
            constants::PLANET_FLAGS,
            xx_sun.as_mut_ptr(),
            serr.as_mut_ptr(),
        );

        let mut xx_moon = [0.0_f64; 6];
        swiss_eph::swe_calc_ut(
            jd_ut,
            swiss_eph::SE_MOON,
            constants::PLANET_FLAGS,
            xx_moon.as_mut_ptr(),
            serr.as_mut_ptr(),
        );
        (
            normalize_degree(xx_sun[0]),
            normalize_degree(xx_moon[0]),
        )
    }
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

