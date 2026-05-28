use crate::ApiError;
use axum::http::StatusCode;
use chrono::{Datelike, LocalResult, NaiveDate, NaiveDateTime, Offset, TimeZone, Timelike, Utc};
use once_cell::sync::Lazy;
use tzf_rs::DefaultFinder;

static TIMEZONE_FINDER: Lazy<DefaultFinder> = Lazy::new(DefaultFinder::new);

pub struct ResolvedTime {
    pub jd_ut: f64,
    pub local_naive: NaiveDateTime,
    pub offset_hours: f64,
    pub timezone_name: Option<String>,
}

pub fn resolve(
    date: &str,
    time: &str,
    lat: f64,
    lon: f64,
    explicit_offset: Option<f64>,
) -> Result<ResolvedTime, ApiError> {
    let local_naive = parse_local_datetime(date, time)?;
    let (utc, offset_hours, timezone_name): (NaiveDateTime, f64, Option<String>) = if let Some(
        offset,
    ) =
        explicit_offset
    {
        let seconds = (offset * 3600.0).round() as i64;
        (
            local_naive - chrono::Duration::seconds(seconds),
            offset,
            None,
        )
    } else {
        let tz_name = TIMEZONE_FINDER.get_tz_name(lon, lat).to_string();
        if tz_name.is_empty() {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Could not resolve timezone from latitude/longitude.",
            ));
        }
        let tz: chrono_tz::Tz = tz_name.parse().map_err(|_| {
            ApiError::new(
                StatusCode::BAD_REQUEST,
                "Resolved timezone is not supported by chrono-tz.",
            )
        })?;
        let local_dt = match tz.from_local_datetime(&local_naive) {
            LocalResult::Single(dt) => dt,
            LocalResult::Ambiguous(earlier, _) => earlier,
            LocalResult::None => {
                return Err(ApiError::new(
                    StatusCode::BAD_REQUEST,
                    "Birth time does not exist in the resolved timezone because of a timezone transition.",
                ))
            }
        };
        let offset = local_dt.offset().fix().local_minus_utc() as f64 / 3600.0;
        (
            local_dt.with_timezone(&Utc).naive_utc(),
            offset,
            Some(tz_name),
        )
    };

    let utc_hour = utc.hour() as f64 + utc.minute() as f64 / 60.0 + utc.second() as f64 / 3600.0;
    let jd_ut = unsafe {
        swiss_eph::swe_julday(
            utc.year(),
            utc.month() as i32,
            utc.day() as i32,
            utc_hour,
            swiss_eph::SE_GREG_CAL,
        )
    };

    Ok(ResolvedTime {
        jd_ut,
        local_naive,
        offset_hours,
        timezone_name,
    })
}

fn parse_local_datetime(date: &str, time: &str) -> Result<NaiveDateTime, ApiError> {
    let normalized_date = date.trim().replace(['-', '.'], "/");
    let date = NaiveDate::parse_from_str(&normalized_date, "%d/%m/%Y").map_err(|_| {
        ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "Invalid date. Please use DD/MM/YYYY format.",
        )
    })?;

    let cleaned_time = clean_time(time)?;
    let mut parts = cleaned_time.split(':');
    let hour = parts
        .next()
        .and_then(|v| v.parse::<u32>().ok())
        .unwrap_or(24);
    let minute = parts
        .next()
        .and_then(|v| v.parse::<u32>().ok())
        .unwrap_or(60);

    date.and_hms_opt(hour, minute, 0).ok_or_else(|| {
        ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "Invalid time. Please use HH:MM format.",
        )
    })
}

fn clean_time(input: &str) -> Result<String, ApiError> {
    let mut normalized = String::new();
    for c in input.trim().chars() {
        if c.is_ascii_digit() || c == ':' {
            normalized.push(c);
        } else if matches!(c, ';' | '.' | ',' | '-' | ' ') {
            normalized.push(':');
        }
    }
    let parts: Vec<&str> = normalized.split(':').filter(|v| !v.is_empty()).collect();
    if parts.len() < 2 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "Invalid time. Please use HH:MM format.",
        ));
    }
    let hour = parts[0].parse::<u32>().map_err(|_| {
        ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "Invalid time. Please use HH:MM format.",
        )
    })?;
    let minute = parts[1].parse::<u32>().map_err(|_| {
        ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "Invalid time. Please use HH:MM format.",
        )
    })?;
    if hour > 23 || minute > 59 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "Invalid time. Please use HH:MM format.",
        ));
    }
    Ok(format!("{hour:02}:{minute:02}"))
}
