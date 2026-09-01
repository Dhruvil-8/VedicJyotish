use chrono::{Duration, NaiveDateTime};

use crate::{
    constants::{DASHA_SEQ, DASHA_YEARS, SAVANA_YEAR, SIDEREAL_YEAR, TROPICAL_YEAR},
    models::{AntarDasha, MahaDasha, Nakshatra, PratyantarDasha},
};

pub fn parse_dasha_year_days(dasha_year: &str) -> f64 {
    let lower = dasha_year.to_lowercase();
    if lower.contains("360") || lower.contains("savana") {
        SAVANA_YEAR
    } else if lower.contains("tropical") || lower.contains("solar") {
        TROPICAL_YEAR
    } else {
        SIDEREAL_YEAR
    }
}

#[allow(dead_code)]
pub fn vimshottari_timeline(
    moon_nakshatra: &Nakshatra,
    birth_date: NaiveDateTime,
) -> Vec<MahaDasha> {
    vimshottari_timeline_with_year(moon_nakshatra, birth_date, SIDEREAL_YEAR)
}

pub fn vimshottari_timeline_with_year(
    moon_nakshatra: &Nakshatra,
    birth_date: NaiveDateTime,
    year_days: f64,
) -> Vec<MahaDasha> {
    let total_years = *DASHA_YEARS
        .get(moon_nakshatra.lord.as_str())
        .unwrap_or(&0.0);
    let passed_years = total_years * moon_nakshatra.fraction;
    let theoretical_start = add_years_with_rate(birth_date, -passed_years, year_days);

    let mut timeline = Vec::new();
    let mut current_maha_start = theoretical_start;
    let start_idx = DASHA_SEQ
        .iter()
        .position(|lord| *lord == moon_nakshatra.lord)
        .unwrap_or(0);

    for i in 0..12 {
        let maha_lord = DASHA_SEQ[(start_idx + i) % DASHA_SEQ.len()];
        let maha_duration = *DASHA_YEARS.get(maha_lord).unwrap_or(&0.0);
        let maha_end = add_years_with_rate(current_maha_start, maha_duration, year_days);

        if maha_end < birth_date {
            current_maha_start = maha_end;
            continue;
        }

        let mut antardashas = Vec::new();
        let mut current_antar = current_maha_start;
        let sub_idx = DASHA_SEQ
            .iter()
            .position(|lord| *lord == maha_lord)
            .unwrap_or(0);
        for j in 0..9 {
            let antar_lord = DASHA_SEQ[(sub_idx + j) % DASHA_SEQ.len()];
            let antar_duration =
                maha_duration * DASHA_YEARS.get(antar_lord).unwrap_or(&0.0) / 120.0;
            let antar_end = add_years_with_rate(current_antar, antar_duration, year_days);
            if antar_end > birth_date {
                // Compute Level 3: Pratyantardasha
                let mut pratyantardashas = Vec::new();
                let mut current_pratyantar = current_antar;
                let pratyantar_idx = DASHA_SEQ
                    .iter()
                    .position(|lord| *lord == antar_lord)
                    .unwrap_or(0);
                for k in 0..9 {
                    let pratyantar_lord = DASHA_SEQ[(pratyantar_idx + k) % DASHA_SEQ.len()];
                    let pratyantar_duration =
                        antar_duration * DASHA_YEARS.get(pratyantar_lord).unwrap_or(&0.0) / 120.0;
                    let pratyantar_end =
                        add_years_with_rate(current_pratyantar, pratyantar_duration, year_days);
                    if pratyantar_end > birth_date {
                        pratyantardashas.push(PratyantarDasha {
                            lord: pratyantar_lord.to_string(),
                            start: format_date(current_pratyantar.max(birth_date)),
                            end: format_date(pratyantar_end),
                        });
                    }
                    current_pratyantar = pratyantar_end;
                }

                antardashas.push(AntarDasha {
                    lord: antar_lord.to_string(),
                    start: format_date(current_antar.max(birth_date)),
                    end: format_date(antar_end),
                    pratyantardashas: Some(pratyantardashas),
                });
            }
            current_antar = antar_end;
        }

        timeline.push(MahaDasha {
            lord: maha_lord.to_string(),
            start: format_date(current_maha_start.max(birth_date)),
            end: format_date(maha_end),
            antardashas,
        });

        current_maha_start = maha_end;
        if current_maha_start.year() > birth_date.year() + 110 {
            break;
        }
    }

    timeline
}

fn add_years_with_rate(dt: NaiveDateTime, years: f64, year_days: f64) -> NaiveDateTime {
    let seconds = years * year_days * 86_400.0;
    dt + Duration::seconds(seconds.round() as i64)
}

fn format_date(dt: NaiveDateTime) -> String {
    dt.format("%d-%m-%Y").to_string()
}

trait Year {
    fn year(&self) -> i32;
}

impl Year for NaiveDateTime {
    fn year(&self) -> i32 {
        chrono::Datelike::year(self)
    }
}
