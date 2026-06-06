use crate::models::{CompatibilityResponse, KootaResult, PartnerDetails};

const NAKSHATRA_LIST: [&str; 27] = [
    "Ashwini",
    "Bharani",
    "Krittika",
    "Rohini",
    "Mrigashira",
    "Ardra",
    "Punarvasu",
    "Pushya",
    "Ashlesha",
    "Magha",
    "Purva Phalguni",
    "Uttara Phalguni",
    "Hasta",
    "Chitra",
    "Swati",
    "Vishakha",
    "Anuradha",
    "Jyeshtha",
    "Moola",
    "Purva Ashadha",
    "Uttara Ashadha",
    "Shravana",
    "Dhanishta",
    "Satabhisha",
    "Purva Bhadrapada",
    "Uttara Bhadrapada",
    "Revati",
];

const SIGNS: [&str; 12] = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
];

const VARNA_ARRAY: [[f64; 4]; 4] = [
    [1.0, 0.0, 0.0, 0.0],
    [1.0, 1.0, 0.0, 0.0],
    [1.0, 1.0, 1.0, 0.0],
    [1.0, 1.0, 1.0, 1.0],
];

const VARNA_RAASI_LIST: [usize; 12] = [1, 3, 2, 0, 1, 3, 2, 0, 1, 3, 2, 0];

const VASIYA_ARRAY: [[f64; 5]; 5] = [
    [2.0, 0.5, 1.0, 0.0, 2.0],
    [0.5, 2.0, 0.0, 0.0, 0.0],
    [1.0, 0.0, 2.0, 2.0, 2.0],
    [0.0, 0.0, 2.0, 2.0, 0.0],
    [1.0, 0.0, 1.0, 0.0, 2.0],
];

const GANA_ARRAY: [[f64; 3]; 3] = [[6.0, 6.0, 0.0], [5.0, 6.0, 0.0], [1.0, 0.0, 6.0]];

const YONI_MAPPINGS: [usize; 27] = [
    0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1,
];

const YONI_ARRAY: [[f64; 14]; 14] = [
    [
        4.0, 2.0, 2.0, 3.0, 2.0, 2.0, 2.0, 1.0, 0.0, 1.0, 1.0, 3.0, 2.0, 1.0,
    ],
    [
        2.0, 4.0, 3.0, 3.0, 2.0, 2.0, 2.0, 2.0, 3.0, 1.0, 2.0, 3.0, 2.0, 0.0,
    ],
    [
        2.0, 3.0, 4.0, 2.0, 1.0, 2.0, 1.0, 3.0, 3.0, 1.0, 2.0, 0.0, 3.0, 1.0,
    ],
    [
        3.0, 3.0, 2.0, 4.0, 2.0, 1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 0.0, 2.0,
    ],
    [
        2.0, 2.0, 1.0, 2.0, 4.0, 2.0, 1.0, 2.0, 2.0, 1.0, 0.0, 2.0, 1.0, 1.0,
    ],
    [
        2.0, 2.0, 2.0, 1.0, 2.0, 4.0, 0.0, 2.0, 2.0, 1.0, 3.0, 3.0, 2.0, 1.0,
    ],
    [
        2.0, 2.0, 1.0, 1.0, 1.0, 0.0, 4.0, 2.0, 2.0, 2.0, 2.0, 2.0, 1.0, 2.0,
    ],
    [
        1.0, 2.0, 3.0, 1.0, 2.0, 2.0, 2.0, 4.0, 3.0, 0.0, 3.0, 2.0, 2.0, 1.0,
    ],
    [
        0.0, 3.0, 3.0, 1.0, 2.0, 2.0, 2.0, 3.0, 4.0, 1.0, 2.0, 2.0, 2.0, 1.0,
    ],
    [
        1.0, 1.0, 1.0, 2.0, 1.0, 1.0, 2.0, 0.0, 1.0, 4.0, 1.0, 1.0, 2.0, 1.0,
    ],
    [
        1.0, 2.0, 2.0, 2.0, 0.0, 3.0, 2.0, 3.0, 2.0, 1.0, 4.0, 2.0, 2.0, 1.0,
    ],
    [
        3.0, 3.0, 0.0, 2.0, 2.0, 3.0, 2.0, 2.0, 2.0, 1.0, 2.0, 4.0, 3.0, 2.0,
    ],
    [
        2.0, 2.0, 3.0, 0.0, 1.0, 2.0, 1.0, 2.0, 2.0, 2.0, 2.0, 3.0, 4.0, 2.0,
    ],
    [
        1.0, 0.0, 1.0, 2.0, 1.0, 1.0, 2.0, 1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 4.0,
    ],
];

const RAASI_ADHIPATHI_MAPPINGS: [usize; 12] = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4];

const RAASI_ADHIPATHI_ARRAY: [[f64; 7]; 7] = [
    [5.0, 5.0, 5.0, 4.0, 5.0, 0.0, 0.0],
    [5.0, 5.0, 4.0, 1.0, 4.0, 0.5, 0.5],
    [5.0, 4.0, 5.0, 0.5, 5.0, 3.0, 0.5],
    [4.0, 1.0, 0.5, 5.0, 0.5, 5.0, 4.0],
    [5.0, 4.0, 5.0, 0.5, 5.0, 0.5, 3.0],
    [0.0, 0.5, 3.0, 5.0, 0.5, 5.0, 5.0],
    [0.0, 0.5, 0.5, 4.0, 3.0, 5.0, 5.0],
];

const RAASI_ARRAY: [[f64; 12]; 12] = [
    [7.0, 0.0, 7.0, 7.0, 0.0, 0.0, 7.0, 0.0, 0.0, 7.0, 7.0, 0.0],
    [0.0, 7.0, 0.0, 7.0, 7.0, 0.0, 0.0, 7.0, 0.0, 0.0, 7.0, 7.0],
    [7.0, 0.0, 7.0, 0.0, 7.0, 7.0, 0.0, 0.0, 7.0, 0.0, 0.0, 7.0],
    [7.0, 7.0, 0.0, 7.0, 0.0, 7.0, 7.0, 0.0, 0.0, 7.0, 0.0, 0.0],
    [0.0, 7.0, 7.0, 0.0, 7.0, 0.0, 7.0, 7.0, 0.0, 0.0, 7.0, 0.0],
    [0.0, 0.0, 7.0, 7.0, 0.0, 7.0, 0.0, 7.0, 7.0, 0.0, 0.0, 7.0],
    [7.0, 0.0, 0.0, 7.0, 7.0, 0.0, 7.0, 0.0, 7.0, 7.0, 0.0, 0.0],
    [0.0, 7.0, 0.0, 0.0, 7.0, 7.0, 0.0, 7.0, 0.0, 7.0, 7.0, 0.0],
    [0.0, 0.0, 7.0, 0.0, 0.0, 7.0, 7.0, 0.0, 7.0, 0.0, 7.0, 7.0],
    [7.0, 0.0, 0.0, 7.0, 0.0, 0.0, 7.0, 7.0, 0.0, 7.0, 0.0, 7.0],
    [7.0, 7.0, 0.0, 7.0, 7.0, 0.0, 0.0, 7.0, 7.0, 0.0, 7.0, 0.0],
    [0.0, 7.0, 7.0, 0.0, 0.0, 7.0, 0.0, 0.0, 7.0, 7.0, 0.0, 7.0],
];

const NADI_MAPPINGS: [usize; 27] = [
    0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2,
];

const NADI_ARRAY: [[f64; 3]; 3] = [[0.0, 8.0, 8.0], [8.0, 0.0, 8.0], [8.0, 8.0, 0.0]];

const MAHENDRA_PORUTHAM_ARRAY: [u8; 8] = [4, 7, 10, 13, 16, 19, 22, 25];
const HEAD_RAJJU: [u8; 3] = [5, 14, 23];
const NECK_RAJJU: [u8; 6] = [4, 6, 13, 15, 22, 24];
const STOMACH_RAJJU: [u8; 6] = [3, 7, 12, 16, 21, 25];
const WAIST_RAJJU: [u8; 6] = [2, 8, 11, 17, 20, 26];
const FOOT_RAJJU: [u8; 6] = [1, 9, 10, 18, 19, 27];

/// Resolves the 1-indexed Rasi number (1 to 12) from Nakshatra index (1..27) and Pada (1..4)
pub fn resolve_rasi(nakshatra: u8, pada: u8) -> u8 {
    let nak_dur = 360.0 / 27.0;
    let rasi_dur = 360.0 / 12.0;
    let pada_dur = nak_dur / 4.0;
    let total_dur =
        ((nakshatra - 1) as f64 * nak_dur) + ((pada - 1) as f64 * pada_dur) + (0.5 * pada_dur);
    ((total_dur / rasi_dur) as u8) + 1
}

/// Computes Guna Milan score between boy and girl.
/// All Nakshatra inputs are 1-indexed (1 to 27) and Padas are 1 to 4.
pub fn compute_guna_milan(
    boy_nak: u8,
    boy_pada: u8,
    girl_nak: u8,
    girl_pada: u8,
    method: &str,
) -> CompatibilityResponse {
    let boy_rasi = resolve_rasi(boy_nak, boy_pada);
    let girl_rasi = resolve_rasi(girl_nak, girl_pada);

    // Sign index (0-indexed 0..11)
    let b_rasi_idx = (boy_rasi - 1) as usize;
    let g_rasi_idx = (girl_rasi - 1) as usize;

    let b_nak_idx = (boy_nak - 1) as usize;
    let g_nak_idx = (girl_nak - 1) as usize;

    // 1. Varna (Max 1 pt)
    let bv_varna = VARNA_RAASI_LIST[b_rasi_idx];
    let gv_varna = VARNA_RAASI_LIST[g_rasi_idx];
    let varna_score = VARNA_ARRAY[gv_varna][bv_varna];

    // 2. Vashya (Max 2 pts)
    let chatushpada = |r: u8, p: u8| {
        r == 1 || r == 2 || (r == 9 && (p == 3 || p == 4)) || (r == 10 && (p == 1 || p == 2))
    };
    let manava =
        |r: u8, p: u8| r == 3 || r == 6 || r == 7 || r == 11 || (r == 9 && (p == 1 || p == 2));
    let jalachara = |r: u8, p: u8| r == 4 || r == 12 || (r == 10 && (p == 3 || p == 4));
    let vanachara = |r: u8| r == 5;

    let get_vashya_category = |r: u8, p: u8| -> usize {
        if chatushpada(r, p) {
            0
        } else if manava(r, p) {
            1
        } else if jalachara(r, p) {
            2
        } else if vanachara(r) {
            3
        } else {
            4
        } // Keeta (insect)
    };
    let bv_vashya = get_vashya_category(boy_rasi, boy_pada);
    let gv_vashya = get_vashya_category(girl_rasi, girl_pada);
    let vashya_score = VASIYA_ARRAY[gv_vashya][bv_vashya];

    // 3. Tara / Dina (Max 3 pts)
    let count_from_girl = if boy_nak >= girl_nak {
        boy_nak - girl_nak + 1
    } else {
        boy_nak + 27 - girl_nak + 1
    };
    let count_from_boy = if girl_nak >= boy_nak {
        girl_nak - boy_nak + 1
    } else {
        girl_nak + 27 - boy_nak + 1
    };

    let mut tara_score = 0.0;
    let g_rem = count_from_girl % 9;
    if ![3, 5, 7].contains(&g_rem) {
        tara_score += 1.5;
    }
    let b_rem = count_from_boy % 9;
    if ![3, 5, 7].contains(&b_rem) {
        tara_score += 1.5;
    }

    // 4. Yoni (Max 4 pts)
    let by_yoni = YONI_MAPPINGS[b_nak_idx];
    let gy_yoni = YONI_MAPPINGS[g_nak_idx];
    let yoni_score = YONI_ARRAY[gy_yoni][by_yoni];

    // 5. Graha Maitri (Max 5 pts)
    let b_lord = RAASI_ADHIPATHI_MAPPINGS[b_rasi_idx];
    let g_lord = RAASI_ADHIPATHI_MAPPINGS[g_rasi_idx];
    let graha_maitri_score = RAASI_ADHIPATHI_ARRAY[g_lord][b_lord];

    // 6. Gana (Max 6 pts)
    let get_gana_category = |nak_idx: usize| -> usize {
        if [0, 4, 6, 7, 12, 14, 16, 21, 26].contains(&nak_idx) {
            0
        }
        // Deva
        else if [1, 3, 5, 10, 11, 19, 20, 24, 25].contains(&nak_idx) {
            1
        }
        // Manushya
        else {
            2
        } // Rakshasa
    };
    let b_gana = get_gana_category(b_nak_idx);
    let g_gana = get_gana_category(g_nak_idx);
    let gana_score = GANA_ARRAY[g_gana][b_gana];

    // 7. Bhakoot / Rasi (Max 7 pts)
    let bhakoot_score = RAASI_ARRAY[g_rasi_idx][b_rasi_idx];

    // 8. Naadi (Max 8 pts)
    let b_nadi = NADI_MAPPINGS[b_nak_idx];
    let g_nadi = NADI_MAPPINGS[g_nak_idx];
    let naadi_score = NADI_ARRAY[g_nadi][b_nadi];

    // Southern Poruthams
    // Mahendra
    let mahendra = MAHENDRA_PORUTHAM_ARRAY.contains(&count_from_girl);

    // Vedha
    let vedha = !(boy_nak + girl_nak == 19 || boy_nak + girl_nak == 28 || boy_nak + girl_nak == 37);

    // Rajju
    let rp = (HEAD_RAJJU.contains(&boy_nak) && HEAD_RAJJU.contains(&girl_nak))
        || (NECK_RAJJU.contains(&boy_nak) && NECK_RAJJU.contains(&girl_nak))
        || (STOMACH_RAJJU.contains(&boy_nak) && STOMACH_RAJJU.contains(&girl_nak))
        || (WAIST_RAJJU.contains(&boy_nak) && WAIST_RAJJU.contains(&girl_nak))
        || (FOOT_RAJJU.contains(&boy_nak) && FOOT_RAJJU.contains(&girl_nak));
    let rajju = !rp;

    // Sthree Dheerga
    let sthree_dheerga = count_from_girl > 13;

    // Calculate Total Scores
    let total_score = varna_score
        + vashya_score
        + tara_score
        + yoni_score
        + graha_maitri_score
        + gana_score
        + bhakoot_score
        + naadi_score;

    let minimum_porutham_matched = rajju && vedha && mahendra && sthree_dheerga;

    CompatibilityResponse {
        boy_details: PartnerDetails {
            sign: SIGNS[b_rasi_idx].to_string(),
            nakshatra: NAKSHATRA_LIST[b_nak_idx].to_string(),
            pada: boy_pada,
        },
        girl_details: PartnerDetails {
            sign: SIGNS[g_rasi_idx].to_string(),
            nakshatra: NAKSHATRA_LIST[g_nak_idx].to_string(),
            pada: girl_pada,
        },
        method: method.to_string(),
        varna: KootaResult {
            name: "Varna".to_string(),
            score: varna_score,
            max_score: 1.0,
            matched: varna_score >= 1.0,
        },
        vashya: KootaResult {
            name: "Vashya".to_string(),
            score: vashya_score,
            max_score: 2.0,
            matched: vashya_score >= 1.5,
        },
        tara: KootaResult {
            name: "Tara".to_string(),
            score: tara_score,
            max_score: 3.0,
            matched: tara_score >= 1.5,
        },
        yoni: KootaResult {
            name: "Yoni".to_string(),
            score: yoni_score,
            max_score: 4.0,
            matched: yoni_score >= 2.0,
        },
        graha_maitri: KootaResult {
            name: "Graha Maitri".to_string(),
            score: graha_maitri_score,
            max_score: 5.0,
            matched: graha_maitri_score >= 3.0,
        },
        gana: KootaResult {
            name: "Gana".to_string(),
            score: gana_score,
            max_score: 6.0,
            matched: gana_score >= 5.0,
        },
        bhakoot: KootaResult {
            name: "Bhakoot".to_string(),
            score: bhakoot_score,
            max_score: 7.0,
            matched: bhakoot_score >= 7.0,
        },
        naadi: KootaResult {
            name: "Naadi".to_string(),
            score: naadi_score,
            max_score: 8.0,
            matched: naadi_score >= 8.0,
        },
        mahendra,
        vedha,
        rajju,
        sthree_dheerga,
        total_score,
        max_score: 36.0,
        minimum_porutham_matched,
    }
}

