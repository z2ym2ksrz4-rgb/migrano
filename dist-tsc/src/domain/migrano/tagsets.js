/** Migraine tag sets. Keys are stable identifiers; labels live in locales under diary.tags.<group>.<key>. */
export const migraineTagGroups = [
    {
        key: "trigger",
        kind: "trigger",
        tags: [
            "stress", "sleep_lack", "sleep_excess", "skipped_meal", "dehydration", "alcohol", "caffeine", "chocolate", "cheese",
            "menstruation", "weather", "bright_light", "noise", "smells", "screen_time", "exertion", "neck_tension", "travel",
        ],
    },
    {
        key: "symptom",
        kind: "symptom",
        tags: [
            "aura_visual", "aura_sensory", "throbbing", "one_sided", "nausea", "vomiting", "photophobia", "phonophobia",
            "osmophobia", "neck_pain", "concentration", "fatigue", "worse_movement",
        ],
    },
    {
        key: "relief",
        kind: "relief",
        tags: ["sleep", "dark_room", "cold", "heat", "water", "food", "caffeine", "fresh_air", "rest"],
    },
    {
        key: "location",
        kind: "location",
        tags: ["left", "right", "both", "forehead", "behind_eye", "neck", "top"],
    },
];
