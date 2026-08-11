import re
from typing import Dict, Any, List, Optional, Tuple

# ----------------------------------------------------
# Real Estate Synonym and Typo Normalization Map
# ----------------------------------------------------
TYPO_ALIASES = {
    "mohamad": "mohammed",
    "mohammad": "mohammed",
    "muhammad": "mohammed",
    "muhammed": "mohammed",
    "mahamad": "mohammed",
    "dubia": "dubai",
    "dubia hills": "dubai hills",
    "emare": "emaar",
    "damak": "damac",
    "nakhil": "nakheel",
    "apartmnt": "apartment",
    "appartment": "apartment",
    "apt": "apartment",
    "vilas": "villa",
    "vila": "villa",
    "twnhouse": "townhouse",
    "town house": "townhouse",
}

# Backwards-compatible alias used by endpoints.py
SEARCH_ALIASES = TYPO_ALIASES

NATIONALITY_MAP = {
    "india": "Indian",
    "indian": "Indian",
    "indians": "Indian",
    "russia": "Russian",
    "russian": "Russian",
    "russians": "Russian",
    "canada": "Canadian",
    "canadian": "Canadian",
    "canadians": "Canadian",
    "britain": "British",
    "british": "British",
    "uk": "British",
    "england": "British",
    "emirati": "Emirati",
    "emiratis": "Emirati",
    "uae": "Emirati",
    "pakistan": "Pakistani",
    "pakistani": "Pakistani",
    "pakistanis": "Pakistani",
    "egypt": "Egyptian",
    "egyptian": "Egyptian",
    "france": "French",
    "french": "French",
    "saudi": "Saudi",
    "china": "Chinese",
    "chinese": "Chinese",
}

PROPERTY_TYPE_MAP = {
    "apartment": "Apartment",
    "apartments": "Apartment",
    "apt": "Apartment",
    "flat": "Apartment",
    "flats": "Apartment",
    "villa": "Villa",
    "villas": "Villa",
    "townhouse": "Townhouse",
    "townhouses": "Townhouse",
    "town house": "Townhouse",
    "studio": "Studio",
    "studios": "Studio",
    "penthouse": "Penthouse",
    "penthouses": "Penthouse",
    "residential": "Residential",
    "commercial": "Commercial",
}

KNOWN_COMMUNITIES = [
    "DUBAI HILLS", "MUDON", "ARABELLA 2", "ARABELLA", "DUBAI LAND RESIDENCES",
    "TOWN SQUARE", "AKOYA OXYGEN", "DAMAC HILLS", "PALM JUMEIRAH", "DOWNTOWN DUBAI",
    "BUSINESS BAY", "DUBAI MARINA", "JBR", "JLT", "DUBAI CREEK HARBOUR"
]

KNOWN_BUILDINGS_TOWERS = [
    "PARK HORIZON", "TOWER 1", "TOWER 2", "TOWER 3", "QUEENS MEADOWS",
    "THE FLORA", "AKOYA-L1", "TRUMP ESTATES", "CRESCENT", "MARINA GATE"
]

KNOWN_DEVELOPERS = [
    "EMAAR", "DAMAC", "DUBAI PROPERTIES", "NAKHEEL", "SOBHA", "BINGHATTI", "MERAAS"
]

def normalize_text(text: str) -> str:
    """Lowercases and replaces known typo aliases."""
    text_clean = text.lower().strip()
    for alias, replacement in TYPO_ALIASES.items():
        text_clean = re.sub(r'\b' + re.escape(alias) + r'\b', replacement, text_clean)
    return text_clean

def parse_natural_language_query(query_str: str) -> Dict[str, Any]:
    """
    Parses a natural language property query into structured AI search intent.
    Extracts property_type, community, building_cluster, tower, unit_number,
    plot_number, owner_name, nationality, developer, size_condition, target_field.
    """
    if not query_str:
        return {}

    raw_query = query_str.strip()
    norm_query = normalize_text(raw_query)

    intent: Dict[str, Any] = {
        "raw_query": raw_query,
        "normalized_query": norm_query,
        "property_type": None,
        "community": None,
        "building_cluster": None,
        "tower": None,
        "unit_number": None,
        "plot_number": None,
        "owner_name": None,
        "nationality": None,
        "developer": None,
        "size_min": None,
        "size_max": None,
        "size_approx": None,
        "target_field": "all",
        "tokens": [],
        "confidence_level": "High"
    }

    # 1. Detect target intent field (e.g. "Who owns...", "Find owner of...", "Show me owner")
    if re.search(r'\b(who owns|owner of|find the owner|show owner|whose property)\b', norm_query):
        intent["target_field"] = "owner"
    elif re.search(r'\b(villas in|apartments in|show me properties|find all)\b', norm_query):
        intent["target_field"] = "properties"

    # 2. Extract Property Type
    for pkey, pval in PROPERTY_TYPE_MAP.items():
        if re.search(r'\b' + re.escape(pkey) + r'\b', norm_query):
            intent["property_type"] = pval
            break

    # 3. Extract Nationality (e.g. "from India", "Russian owners", "owners from Canada")
    for nkey, nval in NATIONALITY_MAP.items():
        if re.search(r'\b(from|of|belonging to|national|owners? from)?\s*' + re.escape(nkey) + r'\b', norm_query):
            intent["nationality"] = nval
            break

    # 4. Extract Unit Number (e.g. "Unit 507", "Unit 1804", "unit #507", "unit 1137")
    unit_match = re.search(r'\b(?:unit|apt)\s*#?\s*([0-9][a-z0-9\-]*)\b', norm_query)
    if unit_match:
        intent["unit_number"] = unit_match.group(1).upper()
    else:
        # Standalone numeric unit check e.g. "Unit 507"
        standalone_unit = re.search(r'\bunit\s+([0-9]{2,5}[a-z]?)\b', norm_query)
        if standalone_unit:
            intent["unit_number"] = standalone_unit.group(1).upper()

    # 5. Extract Plot Number (e.g. "plot number 304", "plot 304", "plot reg 304")
    plot_match = re.search(r'\b(?:plot|plot number|plot reg|plot no\.?)\s*#?\s*([a-z0-9\-]+)\b', norm_query)
    if plot_match:
        intent["plot_number"] = plot_match.group(1).upper()

    # 6. Extract Size Filters (e.g. "larger than 2,000 sqft", "around 60 sqm", "area around 60 sqm")
    size_gt_match = re.search(r'\b(?:larger than|greater than|more than|above|\>)\s*([\d,]+)\s*(?:sqft|sq ft|sqm|square feet|square meters)?\b', norm_query)
    if size_gt_match:
        intent["size_min"] = float(size_gt_match.group(1).replace(",", ""))

    size_approx_match = re.search(r'\b(?:around|approx|approximately|about|~)\s*([\d,]+)\s*(?:sqft|sq ft|sqm|square feet|square meters)?\b', norm_query)
    if size_approx_match:
        intent["size_approx"] = float(size_approx_match.group(1).replace(",", ""))

    # 7. Extract Tower e.g. "Tower 1", "Tower 2", "Tower 3"
    tower_match = re.search(r'\b(tower\s*[1-9][0-9]*)\b', norm_query)
    if tower_match:
        intent["tower"] = tower_match.group(1).title()

    # 8. Extract Building / Cluster e.g. "Park Horizon", "Queens Meadows", "The Flora"
    for bldg in KNOWN_BUILDINGS_TOWERS:
        if bldg.lower() in norm_query:
            intent["building_cluster"] = bldg
            break

    # 9. Extract Community e.g. "Dubai Hills", "Mudon", "Arabella 2", "Town Square"
    for comm in KNOWN_COMMUNITIES:
        if comm.lower() in norm_query:
            intent["community"] = comm
            break

    # 10. Extract Developer e.g. "Emaar", "Damac", "Nakheel", "Sobha"
    for dev in KNOWN_DEVELOPERS:
        if dev.lower() in norm_query:
            intent["developer"] = dev
            break

    # 11. Extract Owner Name (e.g. "owned by Mohammed Ibrahim", "owned by Tatiana", "named Mohammed")
    owner_match = re.search(r'\b(?:owned by|belonging to|owner named|named|owned by someone named)\s+([a-z\s]+?)(?:\s+in|\s+at|\s+with|\s+from|\.|$)', norm_query)
    if owner_match:
        intent["owner_name"] = owner_match.group(1).strip().title()
    else:
        # Check explicit names if mentioned e.g. "Mohammed Ibrahim", "Tatiana"
        # but skip words that are already matched to known entities
        already_matched = set()
        for entity_key in ["building_cluster", "community", "developer", "property_type", "nationality"]:
            val = intent.get(entity_key)
            if val:
                for w in str(val).lower().split():
                    already_matched.add(w)
        # Also exclude all known building/community/developer names
        known_lower = set()
        for name_list in [KNOWN_BUILDINGS_TOWERS, KNOWN_COMMUNITIES, KNOWN_DEVELOPERS]:
            for n in name_list:
                for w in n.lower().split():
                    known_lower.add(w)
        
        names_in_query = []
        for word in raw_query.split():
            clean_w = re.sub(r'[^a-zA-Z]', '', word)
            if len(clean_w) > 2 and clean_w.lower() not in [
                "who", "owns", "the", "in", "and", "show", "me", "find", "all", "owner",
                "apartment", "villas", "villa", "property", "tower", "unit", "plot",
                "building", "community", "from", "with", "around", "than", "this", "building",
                "someone", "named", "every", "larger", "square", "meters", "sqft", "sqm",
                "park", "horizon", "queens", "meadows", "hills", "dubai", "town",
                "llc", "ltd", "inc", "corp", "properties", "real", "estate", "company", "group", "holdings", "development"
            ] and clean_w.lower() not in already_matched and clean_w.lower() not in known_lower:
                names_in_query.append(clean_w.title())
        if names_in_query and not intent["owner_name"]:
            intent["owner_name"] = " ".join(names_in_query)

    # Clean extracted token list for highlighting & deduplicate core terms
    raw_tokens = [t.strip() for t in re.split(r'[\s,]+', norm_query) if len(t.strip()) > 1]
    stop_terms = {
        "who", "owns", "the", "in", "and", "show", "me", "find", "all", "owner",
        "apartment", "villas", "villa", "property", "tower", "unit", "plot",
        "building", "community", "from", "with", "around", "than", "this",
        "someone", "named", "every", "larger", "square", "meters", "sqft", "sqm",
        "llc", "ltd", "inc", "corp", "properties", "real", "estate", "company", "group", "holdings", "development"
    }
    seen_tokens = set()
    unique_tokens = []
    for tok in raw_tokens:
        if tok.lower() not in stop_terms and tok.lower() not in seen_tokens:
            seen_tokens.add(tok.lower())
            unique_tokens.append(tok)

    intent["tokens"] = unique_tokens[:5]  # Limit to max 5 core search terms

    return intent


def calculate_relevance_score(record: Any, intent: Dict[str, Any], query_str: str) -> Tuple[int, List[str]]:
    """
    Computes a relevance match score (0-100%) and a list of match reasons
    for a given ConsolidatedRecord based on extracted AI intent.
    """
    score = 50  # Base match score for matching overall query
    reasons: List[str] = []

    norm_query = normalize_text(query_str)
    tokens = intent.get("tokens", [])

    # Exact Unit Match
    unit_intent = intent.get("unit_number")
    rec_unit = str(getattr(record, "unit_number", "") or "").strip().upper()
    if unit_intent and rec_unit:
        if unit_intent == rec_unit:
            score += 35
            reasons.append(f"Exact Unit Match ({rec_unit})")
        elif unit_intent in rec_unit:
            score += 20
            reasons.append(f"Partial Unit Match ({rec_unit})")

    # Exact Plot Match
    plot_intent = intent.get("plot_number")
    rec_plot = str(getattr(record, "plot_number", "") or getattr(record, "plot_reg_no", "") or "").strip().upper()
    if plot_intent and rec_plot:
        if plot_intent in rec_plot:
            score += 30
            reasons.append(f"Plot Match ({rec_plot})")

    # Property Type Match
    type_intent = intent.get("property_type")
    rec_type = str(getattr(record, "property_type", "") or "").strip()
    if type_intent and rec_type:
        if type_intent.lower() in rec_type.lower():
            score += 20
            reasons.append(f"Property Type ({rec_type})")

    # Building / Cluster / Tower Match
    bldg_intent = intent.get("building_cluster")
    tower_intent = intent.get("tower")
    rec_bldg = str(getattr(record, "building_cluster", "") or getattr(record, "sub_community", "") or "").strip()
    if bldg_intent and rec_bldg and bldg_intent.lower() in rec_bldg.lower():
        score += 25
        reasons.append(f"Building/Cluster ({rec_bldg})")

    if tower_intent and rec_bldg and tower_intent.lower() in rec_bldg.lower():
        score += 20
        reasons.append(f"Tower Match ({tower_intent})")

    # Community Match
    comm_intent = intent.get("community")
    rec_comm = str(getattr(record, "community", "") or "").strip()
    if comm_intent and rec_comm and comm_intent.lower() in rec_comm.lower():
        score += 20
        reasons.append(f"Community ({rec_comm})")

    # Owner Name Match
    owner_intent = intent.get("owner_name")
    rec_name = str(getattr(record, "name", "") or getattr(record, "customer_name", "") or "").strip()
    if owner_intent and rec_name:
        if owner_intent.lower() in rec_name.lower():
            score += 30
            reasons.append(f"Owner Name Match ({rec_name})")

    # Nationality Match
    nat_intent = intent.get("nationality")
    rec_nat = str(getattr(record, "nationality", "") or "").strip()
    if nat_intent and rec_nat:
        if nat_intent.lower() in rec_nat.lower():
            score += 20
            reasons.append(f"Nationality ({rec_nat})")

    # Developer Match
    dev_intent = intent.get("developer")
    rec_dev = str(getattr(record, "developer", "") or "").strip()
    if dev_intent and rec_dev:
        if dev_intent.lower() in rec_dev.lower():
            score += 15
            reasons.append(f"Developer ({rec_dev})")

    # If no specific reasons triggered yet, match token occurrences across fields
    if not reasons:
        matched_tokens = 0
        searchable_blob = f"{rec_name} {rec_comm} {rec_bldg} {rec_unit} {rec_type} {rec_nat} {rec_dev}".lower()
        for token in tokens:
            if len(token) > 2 and token in searchable_blob:
                matched_tokens += 1
        if matched_tokens > 0:
            score += min(matched_tokens * 10, 30)
            reasons.append(f"Matched {matched_tokens} query terms across metadata")

    # Cap score at 99% unless exact unit + building or owner match
    final_score = min(score, 99)
    if "Exact Unit Match" in str(reasons) or "Owner Name Match" in str(reasons):
        final_score = min(score, 100)

    if not reasons:
        reasons.append("Semantic Context Match")

    return final_score, reasons
