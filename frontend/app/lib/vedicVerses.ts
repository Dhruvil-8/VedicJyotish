/**
 * Classical Vedic Verses, Devanagari Shlokas & Sacred Festival Greetings
 * Authentic scriptural citations from Upanishads, Rigveda, Bhagavad Gita, and Puranas.
 */

export interface VedicVerseGreeting {
  isFestival: boolean;
  festivalName?: string;
  greetingTitle: string;
  sanskritDevanagari: string;
  transliteration: string;
  sourceText: string;
  englishMeaning: string;
  spiritualReflection: string;
}

export const FESTIVAL_VERSES: Record<string, VedicVerseGreeting> = {
  diwali: {
    isFestival: true,
    festivalName: "Diwali / Deepavali",
    greetingTitle: "शुभ दीपावली • Joyous Deepavali",
    sanskritDevanagari: "ॐ असतो मा सद्गमय । तमसो मा ज्योतिर्गमय । मृत्योर्मा अमृतं गमय ॥",
    transliteration: "oṃ asato mā sadgamaya | tamaso mā jyotirgamaya | mṛtyormā amṛtaṃ gamaya ||",
    sourceText: "बृहदारण्यकोपनिषद् (Bṛhadāraṇyaka Upaniṣad 1.3.28)",
    englishMeaning:
      "Lead me from falsehood to truth, from darkness to light, from mortality to the eternal nectar of consciousness.",
    spiritualReflection:
      "On this festival of light, we kindle the inner lamp of discriminating wisdom (Viveka) to dispel the darkness of ignorance, welcoming the auspicious abundance of Devi Mahalakshmi.",
  },
  shivratri: {
    isFestival: true,
    festivalName: "Maha Shivratri",
    greetingTitle: "महाशिवरात्रि की हार्दिक शुभकामनाएँ • Auspicious Maha Shivratri",
    sanskritDevanagari:
      "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात् ॥",
    transliteration:
      "oṃ tryambakaṃ yajāmahe sugandhiṃ puṣṭivardhanam | urvārukamiva bandhanānmṛtyormukṣīya māmṛtāt ||",
    sourceText: "ऋग्वेद (Rigveda 7.59.12) • महामृत्युञ्जय मन्त्र",
    englishMeaning:
      "We worship the Fragrant Three-Eyed Lord Shiva, who nourishes and sustains all life. As a ripe cucumber is severed from its vine, may He liberate us from mortality to immortality.",
    spiritualReflection:
      "The great cosmic night of Shiva marks the silence of pure consciousness, dissolving conditioned ego into infinite stillness and transcendent peace.",
  },
  ramnavami: {
    isFestival: true,
    festivalName: "Rama Navami",
    greetingTitle: "श्री राम नवमी की मङ्गलकामनाएँ • Blessed Rama Navami",
    sanskritDevanagari: "रामो विग्रहवान् धर्मः साधुः सत्यपराक्रमः । राजा सर्वस्य लोकस्य देवानामिव वासवः ॥",
    transliteration: "rāmo vigrahavān dharmaḥ sādhuḥ satyaparākramaḥ | rājā sarvasya lokasya devānāmiva vāsavaḥ ||",
    sourceText: "वाल्मीकि रामायण (Vālmīki Rāmāyaṇa, Āraṇya Kāṇḍa 37.13)",
    englishMeaning:
      "Sri Rama is the living embodiment of Dharma, righteous, steadfast in truth and valor, the noble protector of all existence.",
    spiritualReflection:
      "Celebrating the birth of Sri Rama inspires us to align daily conduct with Maryada (ethical dignity), selfless duty, and unshakeable inner honor.",
  },
  janmashtami: {
    isFestival: true,
    festivalName: "Krishna Janmashtami",
    greetingTitle: "श्रीकृष्ण जन्माष्टमी की शुभकामनाएँ • Blessed Janmashtami",
    sanskritDevanagari: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत । अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥",
    transliteration: "yadā yadā hi dharmasya glānirbhavati bhārata | abhyutthānamadharmasya tadātmānaṃ sṛjāmyaham ||",
    sourceText: "श्रीमद्भगवद्गीता (Bhagavad Gītā 4.7)",
    englishMeaning:
      "Whenever there is a decline in righteousness, O Bharata, and an uprising of unrighteousness, then I manifest Myself for the protection of truth.",
    spiritualReflection:
      "The advent of Sri Krishna awakens the divine play (Lila) of love, unattached action (Nishkama Karma), and the highest spiritual liberation.",
  },
  sankranti: {
    isFestival: true,
    festivalName: "Makar Sankranti & Uttarayana",
    greetingTitle: "मकर संक्रान्ति व उत्तरायण की शुभकामनाएँ • Shubh Sankranti",
    sanskritDevanagari: "नमो धर्मनिधानाय नमः सुकृतसाक्षिणे । नमः प्रत्यक्षदेवाय भास्कराय नमो नमः ॥",
    transliteration: "namo dharmanidhānāya namaḥ sukṛtasākṣiṇe | namaḥ pratyakṣadevāya bhāskarāya namo namaḥ ||",
    sourceText: "सूर्य उपनिषद् / आदित्य हृदयम् (Sūrya Upaniṣad)",
    englishMeaning:
      "Salutations to the Sun, the eternal storehouse of Dharma, the witness of all noble deeds, the visible living Divinity. Prostrations to Bhaskara.",
    spiritualReflection:
      "As the Sun embarks on his northward journey (Uttarayana), consciousness moves from darkness towards light, harvest, and elevated spiritual aspiration.",
  },
  navratri: {
    isFestival: true,
    festivalName: "Navratri / Durga Puja",
    greetingTitle: "शुभ नवरात्रि • Auspicious Navratri",
    sanskritDevanagari: "सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके । शरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तु ते ॥",
    transliteration: "sarvamaṅgalamāṅgalye śive sarvārthasādhike | śaraṇye tryambake gauri nārāyaṇi namo'stu te ||",
    sourceText: "देवी माहात्म्यम् (Devī Māhātmyam 11.10)",
    englishMeaning:
      "O Auspicious One of all auspiciousness, the fulfiller of all pure aims, the refuge of all souls, Three-Eyed Gauri, O Narayani, prostrations unto Thee.",
    spiritualReflection:
      "The nine sacred nights honor the divine Shakti, transmuting inner impurities (tamas and rajas) into supreme clarity, spiritual strength, and victory.",
  },
  ganesh: {
    isFestival: true,
    festivalName: "Ganesh Chaturthi",
    greetingTitle: "गणेश चतुर्थी की हार्दिक मङ्गलकामनाएँ • Blessed Ganeshotsav",
    sanskritDevanagari: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥",
    transliteration: "vakratuṇḍa mahākāya sūryakoṭi samaprabha | nirvighnaṃ kuru me deva sarvakāryeṣu sarvadā ||",
    sourceText: "गणेश पुराण (Gaṇeśa Purāṇa)",
    englishMeaning:
      "O Lord of the curved trunk and immense cosmic form, radiant like ten million suns, please make all my noble undertakings free of impediments, always.",
    spiritualReflection:
      "Invoking Ganesha at the threshold of new beginnings clears mental hesitation, blessing the intellect with discernment and peaceful resolution.",
  },
  holi: {
    isFestival: true,
    festivalName: "Holi / Vasantotsav",
    greetingTitle: "होली व वसन्तोत्सव की शुभकामनाएँ • Joyous Holi",
    sanskritDevanagari: "मधु वाता ऋतायते मधु क्षरन्ति सिन्धवः । माध्वीर्नः सन्त्वोषधीः ॥",
    transliteration: "madhu vātā ṛtāyate madhu kṣaranti sindhavaḥ | mādhvīrnaḥ santvoṣadhīḥ ||",
    sourceText: "ऋग्वेद (Rigveda 1.90.6) • मधु सूक्त",
    englishMeaning:
      "Sweet blow the breezes of nature, sweet flow the rivers, and may all herbs and nourishment be filled with universal sweetness for us.",
    spiritualReflection:
      "Holi celebrates the triumphant burning of negativity (Holika Dahan) and the joyful renewal of nature's vibrant colors, friendship, and forgiveness.",
  },
  gurupurnima: {
    isFestival: true,
    festivalName: "Guru Purnima",
    greetingTitle: "गुरु पूर्णिमा की सादर वन्दना • Blessed Guru Purnima",
    sanskritDevanagari: "गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः । गुरुः साक्षात् परं ब्रह्म तस्मै श्रीगुरवे नमः ॥",
    transliteration: "gururbrahmā gururviṣṇuḥ gururdevo maheśvaraḥ | guruḥ sākṣāt paraṃ brahma tasmai śrīgurave namaḥ ||",
    sourceText: "गुरु गीता (Guru Gītā / Skanda Purāṇa)",
    englishMeaning:
      "The Guru is Brahma the creator, Vishnu the preserver, and Maheshvara the transformer. The Guru is verily the Supreme Reality itself. Salutations to that Holy Guru.",
    spiritualReflection:
      "We honor the timeless lineage of teachers, rishis, and inner conscience that illuminates the path from conditioned mind to self-realization.",
  },
};

export const DAILY_BENEDICTIONS: VedicVerseGreeting[] = [
  {
    isFestival: false,
    greetingTitle: "वैदिक मङ्गल वचन • Daily Vedic Benediction",
    sanskritDevanagari: "सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः । सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत् ॥",
    transliteration: "sarve bhavantu sukhinaḥ sarve santu nirāmayāḥ | sarve bhadrāṇi paśyantu mā kaścidduḥkhabhāgbhavet ||",
    sourceText: "बृहदारण्यकोपनिषद् / शान्ति मन्त्र (Bṛhadāraṇyaka Upaniṣad)",
    englishMeaning:
      "May all beings everywhere be happy. May all beings be free from illness. May all behold what is auspicious. May no one suffer sorrow.",
    spiritualReflection:
      "The quintessential Vedic prayer expressing universal goodwill (Sarva-hita), cultivating an open heart aligned with cosmic harmony.",
  },
  {
    isFestival: false,
    greetingTitle: "गायत्री प्रार्थना • Solar Illuminating Invocation",
    sanskritDevanagari: "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥",
    transliteration: "oṃ bhūrbhuvaḥ svaḥ tatsaviturvareṇyaṃ bhargo devasya dhīmahi dhiyo yo naḥ pracodayāt ||",
    sourceText: "ऋग्वेद (Rigveda 3.62.10) • सावित्री गायत्री मन्त्र",
    englishMeaning:
      "We meditate upon the supreme, adorable radiance of the Divine Solar Creator; may that Light inspire and illuminate our intellect.",
    spiritualReflection:
      "The mother of the Vedas, aligning the mortal mind with the boundless solar intelligence that sustains all life across the cosmos.",
  },
  {
    isFestival: false,
    greetingTitle: "विश्व शान्ति मन्त्र • Universal Cosmic Peace",
    sanskritDevanagari:
      "ॐ द्यौः शान्तिरन्तरिक्षं शान्तिः पृथिवी शान्तिरापः शान्तिरोषधयः शान्तिः । वनस्पतयः शान्तिर्विश्वेदेवाः शान्तिर्ब्रह्म शान्तिः सर्वं शान्तिः शान्तिरेव शान्तिः सा मा शान्तिरेधि ॥",
    transliteration:
      "oṃ dyauḥ śāntirantarikṣaṃ śāntiḥ pṛthivī śāntirāpaḥ śāntiroṣadhayaḥ śāntiḥ | vanaspatayaḥ śāntirviśvedevāḥ śāntirbrahma śāntiḥ sarvaṃ śāntiḥ śāntireva śāntiḥ sā mā śāntiredhi ||",
    sourceText: "शुक्ल यजुर्वेद (Yajurveda 36.17)",
    englishMeaning:
      "Peace in the heavens, peace in the atmosphere, peace on earth, peace in waters, peace in herbs and trees. May all divinity and the cosmos be filled with peace. May that true peace dwell within me.",
    spiritualReflection:
      "Ecological and spiritual equilibrium: recognizing our deep kinship with earth, sky, water, and all living entities.",
  },
];

/**
 * Returns festival verse if matched, otherwise picks a daily benediction
 */
export function getActiveVedicGreeting(festivalNameOrDay?: string): VedicVerseGreeting {
  if (festivalNameOrDay) {
    const fLower = festivalNameOrDay.toLowerCase();
    for (const [key, val] of Object.entries(FESTIVAL_VERSES)) {
      if (fLower.includes(key) || (val.festivalName && fLower.includes(val.festivalName.toLowerCase()))) {
        return val;
      }
    }
  }

  // Choose a daily benediction based on day-of-year so it changes harmoniously
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const index = Math.abs(dayOfYear) % DAILY_BENEDICTIONS.length;
  return DAILY_BENEDICTIONS[index];
}
