/**
 * @title GenerateMerkleTree
 * @notice Generates Merkle tree for the 2,309 Wordle word list
 * @dev Run with: node script/GenerateMerkleTree.js
 * 
 * Output: merkle-data.json containing:
 * - root: The Merkle root to deploy with
 * - proofs: Map of word -> proof for each word
 */

const { keccak256 } = require("@ethersproject/keccak256");
const { defaultAbiCoder } = require("@ethersproject/abi");
const { MerkleTree } = require("merkletreejs");
const fs = require("fs");
const path = require("path");

// Standard Wordle answer list (2,309 words)
// This is a subset - full list should be loaded from file
const WORDLE_WORDS = [
    "aback", "abase", "abate", "abbey", "abbot", "abhor", "abide", "abled", "abode", "abort",
    "about", "above", "abuse", "abyss", "acorn", "acrid", "actor", "acute", "adage", "adapt",
    "admit", "adobe", "adopt", "adult", "affix", "afire", "afoot", "afoul", "after", "again",
    "agape", "agate", "agent", "agile", "aging", "aglow", "agony", "agree", "ahead", "aider",
    "aisle", "alarm", "album", "alert", "algae", "alibi", "alien", "align", "alike", "alive",
    "allay", "alley", "allot", "allow", "alloy", "aloft", "alone", "along", "aloof", "aloud",
    "alpha", "altar", "alter", "amass", "amaze", "amber", "amble", "amend", "amiss", "amity",
    "among", "ample", "amply", "amuse", "angel", "anger", "angle", "angry", "angst", "anime",
    "ankle", "annex", "annoy", "annul", "anode", "antic", "anvil", "aorta", "apart", "aphid",
    "aping", "apnea", "apple", "apply", "apron", "aptly", "arbor", "ardor", "arena", "argue",
    "arise", "armor", "aroma", "arose", "array", "arrow", "arson", "artsy", "ascot", "ashen",
    "aside", "askew", "asset", "atoll", "atone", "attic", "audio", "audit", "augur", "aunty",
    "avail", "avert", "avoid", "await", "awake", "award", "aware", "awash", "awful", "awoke",
    "axial", "axiom", "azure", "bacon", "badge", "badly", "bagel", "baggy", "baker", "baler",
    "balmy", "banal", "banjo", "barge", "baron", "basal", "basic", "basil", "basin", "basis",
    "baste", "batch", "bathe", "baton", "batty", "bawdy", "bayou", "beach", "beady", "beard",
    "beast", "beech", "beefy", "befit", "began", "begat", "beget", "begin", "begun", "being",
    "belch", "belie", "belle", "belly", "below", "bench", "beret", "berry", "berth", "beset",
    "betel", "bevel", "bezel", "bible", "bicep", "biddy", "bigot", "bilge", "billy", "binge",
    "bingo", "biome", "birch", "birth", "bison", "bitty", "black", "blade", "blame", "bland",
    "blank", "blare", "blast", "blaze", "bleak", "bleat", "bleed", "bleep", "blend", "bless",
    "blimp", "blind", "blink", "bliss", "blitz", "bloat", "block", "bloke", "blond", "blood",
    "bloom", "blown", "blues", "bluff", "blunt", "blurb", "blurt", "blush", "board", "boast",
    "bobby", "boded", "bogey", "boggy", "bogie", "bolts", "boney", "bonus", "booby", "boost",
    "booth", "booty", "booze", "boozy", "borax", "borne", "bosom", "bossy", "botch", "bough",
    "boule", "bound", "bowel", "boxer", "brace", "brain", "brake", "brand", "brash", "brass",
    "brave", "bravo", "brawl", "brawn", "bread", "break", "breed", "briar", "bribe", "brick",
    "bride", "brief", "brine", "bring", "brink", "briny", "brisk", "broad", "broil", "broke",
    "brood", "brook", "broom", "broth", "brown", "brunt", "brush", "brute", "buddy", "budge",
    "buggy", "bugle", "build", "built", "bulge", "bulky", "bully", "bunch", "bunny", "burly",
    "burnt", "burst", "bused", "bushy", "busty", "butch", "butte", "buxom", "buyer", "bylaw",
    "cabal", "cabby", "cabin", "cable", "cacao", "cache", "cacti", "caddy", "cadet", "cagey",
    "cairn", "camel", "cameo", "campo", "canal", "candy", "canny", "canoe", "canon", "caper",
    "caput", "carat", "cargo", "carol", "carry", "carve", "caste", "catch", "cater", "catty",
    "caulk", "cause", "cavil", "cease", "cedar", "cello", "chafe", "chaff", "chain", "chair",
    "chalk", "champ", "chant", "chaos", "chard", "charm", "chart", "chase", "chasm", "cheap",
    "cheat", "check", "cheek", "cheer", "chess", "chest", "chick", "chide", "chief", "child",
    "chili", "chill", "chimp", "china", "chirp", "chock", "choir", "choke", "chord", "chore",
    "chose", "chuck", "chump", "chunk", "churn", "chute", "cider", "cigar", "cinch", "circa",
    "civic", "civil", "clack", "claim", "clamp", "clang", "clank", "clash", "clasp", "class",
    "clean", "clear", "cleat", "cleft", "clerk", "click", "cliff", "climb", "cling", "cloak",
    "clock", "clone", "close", "cloth", "cloud", "clout", "clove", "clown", "clubs", "cluck",
    "clued", "clump", "clung", "coach", "coast", "cobra", "cocoa", "colon", "color", "comet",
    "comfy", "comic", "comma", "conch", "condo", "conic", "copse", "coral", "cords", "corer",
    "corny", "couch", "cough", "could", "count", "coupe", "court", "coven", "cover", "covet",
    "covey", "cower", "coyly", "crack", "craft", "cramp", "crane", "crank", "crash", "crass",
    "crate", "crave", "crawl", "craze", "crazy", "creak", "cream", "credo", "creed", "creek",
    "creep", "creme", "crepe", "crept", "cress", "crest", "crick", "cried", "crier", "crime",
    "crimp", "crisp", "croak", "crock", "crone", "crony", "crook", "cross", "croup", "crowd",
    "crown", "crude", "cruel", "crumb", "crush", "crust", "crypt", "cubic", "cumin", "cupid",
    "curly", "curry", "curse", "curve", "curvy", "cutie", "cyber", "cycle", "cynic", "daddy",
    "daily", "dairy", "daisy", "dally", "dance", "dandy", "datum", "daunt", "dealt", "death",
    "debit", "debut", "decal", "decay", "decor", "decoy", "decry", "defer", "deity", "delay",
    "delta", "delve", "demon", "demur", "denim", "dense", "depot", "depth", "derby", "deter",
    "detox", "deuce", "devil", "diary", "dicey", "digit", "dilly", "dimly", "diner", "dingo",
    "dingy", "diode", "dirty", "disco", "ditch", "ditto", "ditty", "diver", "dizzy", "dodge",
    "dodgy", "dogma", "doing", "dolly", "donor", "donut", "dopey", "doubt", "dough", "dowdy",
    "dowel", "downy", "dowry", "dozen", "draft", "drain", "drake", "drama", "drank", "drape",
    "drawl", "drawn", "dread", "dream", "dress", "dried", "drier", "drift", "drill", "drink",
    "drive", "droit", "droll", "drone", "drool", "droop", "dross", "drove", "drown", "drugs",
    "druid", "drunk", "dryer", "dryly", "duchy", "dully", "dumbo", "dummy", "dumpy", "dunce",
    "dunes", "dungy", "duped", "dusty", "dutch", "duvet", "dwarf", "dwell", "dwelt", "dying",
    // ... Add all 2,309 words here
    // For brevity, this is a sample. Full list at: https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b
    "eager", "eagle", "early", "earth", "easel", "eaten", "eater", "ebony", "eclat", "edict",
    "edify", "eerie", "egret", "eight", "eject", "eking", "elate", "elbow", "elder", "elect",
    "elite", "elope", "elude", "email", "embed", "ember", "emcee", "empty", "enact", "endow",
    "enemy", "enjoy", "ennui", "ensue", "enter", "entry", "envoy", "epoch", "epoxy", "equal",
    "equip", "erase", "erect", "erode", "error", "erupt", "essay", "ether", "ethic", "ethos",
    "evade", "event", "every", "evict", "evoke", "exact", "exalt", "excel", "exert", "exile",
    "exist", "expat", "extol", "extra", "exude", "exult", "fable", "facet", "faint", "fairy",
    "faith", "false", "fancy", "fanny", "farce", "fatal", "fatty", "fault", "fauna", "favor",
    "feast", "feign", "fella", "felon", "femur", "fence", "feral", "ferry", "fetal", "fetch",
    "fetid", "fetus", "fever", "fewer", "fiber", "fibre", "ficus", "field", "fiend", "fiery",
    "fifth", "fifty", "fight", "filmy", "filth", "final", "finch", "finer", "first", "fishy",
    "fixer", "fizzy", "fjord", "flack", "flail", "flair", "flake", "flaky", "flame", "flank",
    "flare", "flash", "flask", "fleek", "fleet", "flesh", "flick", "flier", "fling", "flint",
    "flirt", "float", "flock", "flood", "floor", "flora", "floss", "flour", "flout", "flown",
    "fluid", "fluke", "flung", "flunk", "flush", "flute", "foamy", "focal", "focus", "foggy",
    "foist", "folio", "folly", "foray", "force", "forge", "forgo", "forte", "forth", "forty",
    "forum", "fossil","found", "fount", "foxes", "foyer", "frail", "frame", "frank", "fraud",
    "freak", "freed", "fresh", "friar", "fried", "frill", "frisk", "fritz", "frizz", "frock",
    "frond", "front", "frost", "froth", "frown", "froze", "fruit", "fudge", "fugue", "fully",
    "fungi", "funky", "funny", "fuzzy", "gaudy", "gauge", "gaunt", "gauze", "gavel", "gawky",
    "gayer", "gayly", "gazer", "gecko", "geeky", "geese", "genie", "genre", "ghost", "giant",
    "giddy", "gills", "girly", "girth", "given", "giver", "glade", "gland", "glare", "glass",
    "glaze", "gleam", "glean", "glide", "glint", "gloat", "globe", "gloom", "glory", "gloss",
    "glove", "glyph", "gnarly","gnash", "gnome", "goaty", "godly", "going", "golem", "golly",
    "goner", "gooey", "goofy", "goose", "gorge", "gouge", "gourd", "grace", "grade", "graft",
    "grail", "grain", "grand", "grant", "grape", "graph", "grasp", "grass", "grate", "grave",
    "gravy", "graze", "great", "greed", "green", "greet", "grief", "grill", "grime", "grimy",
    "grind", "gripe", "groan", "groom", "grope", "gross", "group", "grout", "grove", "growl",
    "grown", "gruel", "gruff", "grunt", "guard", "guava", "guess", "guest", "guide", "guild",
    "guilt", "guise", "gulch", "gully", "gumbo", "gummy", "guppy", "gusto", "gusty", "gypsy",
    "habit", "hairy", "halve", "handy", "happy", "hardy", "haste", "hasty", "hatch", "haunt",
    "haven", "havoc", "hazel", "heady", "heard", "heart", "heath", "heavy", "hedge", "hefty",
    "heist", "helix", "hello", "hence", "heron", "hilly", "hinge", "hippo", "hippy", "hitch",
    "hoard", "hobby", "hoist", "holly", "homer", "honey", "honor", "hooey", "horde", "horny",
    "horse", "hotel", "hotly", "hound", "house", "hovel", "hover", "howdy", "human", "humid",
    "humor", "humph", "humus", "hunch", "hunky", "hurry", "husky", "hussy", "hydra", "hyena",
    "hymen", "hyper", "icier", "icily", "icing", "ideal", "idiom", "idiot", "idler", "idyll",
    "igloo", "iliac", "image", "imbue", "impel", "imply", "inane", "inbox", "incur", "index",
    "inept", "inert", "infer", "ingot", "inlay", "inlet", "inner", "input", "inter", "intro",
    "ionic", "irate", "irony", "islet", "issue", "itchy", "ivory", "jaunt", "jazzy", "jelly",
    "jerky", "jetty", "jewel", "jiffy", "joint", "joist", "joker", "jolly", "joust", "judge",
    "juice", "juicy", "jumbo", "jumpy", "juror", "kappa", "karma", "kayak", "kebab", "khaki",
    "kinky", "kiosk", "kitty", "knack", "knead", "kneed", "kneel", "knelt", "knife", "knock",
    "knoll", "known", "koala", "krill", "label", "labor", "laden", "ladle", "lager", "lance",
    "lanky", "lapel", "lapse", "large", "larva", "lasso", "latch", "later", "lathe", "latte",
    "laugh", "layer", "leach", "leafy", "leaky", "leant", "leapt", "learn", "lease", "leash",
    "least", "leave", "ledge", "leech", "leery", "lefty", "legal", "leggy", "lemon", "lemur",
    "leper", "level", "lever", "libel", "liege", "light", "liken", "lilac", "limbo", "limit",
    "linen", "liner", "lingo", "lipid", "lithe", "liver", "livid", "llama", "loamy", "loath",
    "lobby", "local", "locus", "lodge", "lofty", "logic", "login", "loopy", "loose", "lorry",
    "loser", "louse", "lousy", "lover", "lower", "lowly", "loyal", "lucid", "lucky", "lumen",
    "lumpy", "lunar", "lunch", "lunge", "lupus", "lurch", "lurid", "lusty", "lying", "lymph",
    "lyric", "macaw", "macho", "macro", "madam", "madly", "mafia", "magic", "magma", "maize",
    "major", "maker", "mambo", "mamma", "mammy", "manga", "mange", "mango", "mangy", "mania",
    "manic", "manly", "manor", "maple", "march", "marry", "marsh", "mason", "masse", "match",
    "matey", "mauve", "maxim", "maybe", "mayor", "mealy", "meant", "meaty", "mecca", "medal",
    "media", "medic", "melee", "melon", "mercy", "merge", "merit", "merry", "metal", "meter",
    "metro", "micro", "midge", "midst", "might", "milky", "mimic", "mince", "miner", "minor",
    "minty", "minus", "mirth", "miser", "missy", "mocha", "modal", "model", "modem", "mogul",
    "moist", "molar", "moldy", "money", "month", "moody", "moose", "moral", "moron", "morph",
    "mossy", "motel", "motif", "motor", "motto", "moult", "mound", "mount", "mourn", "mouse",
    "mousy", "mouth", "mover", "movie", "mower", "mucky", "mucus", "muddy", "mulch", "mummy",
    "munch", "mural", "murky", "mushy", "music", "musky", "musty", "myrrh", "nadir", "naive",
    "nanny", "nasal", "nasty", "natal", "naval", "navel", "needy", "neigh", "nerdy", "nerve",
    "never", "newer", "newly", "nicer", "niche", "niece", "night", "nimbi", "ninja", "ninny",
    "ninth", "noble", "nobly", "noise", "noisy", "nomad", "noose", "north", "nosey", "notch",
    "novel", "nudge", "nurse", "nutty", "nylon", "nymph", "oaken", "oakum", "oasis", "occur",
    "ocean", "octal", "octet", "odder", "oddly", "offal", "offer", "often", "olden", "older",
    "olive", "ombre", "omega", "onion", "onset", "opera", "opine", "opium", "optic", "orbit",
    "order", "organ", "other", "otter", "ought", "ounce", "outdo", "outer", "outgo", "ovary",
    "ovate", "overt", "ovine", "ovoid", "owing", "owner", "oxide", "ozone", "paddy", "pagan",
    "paint", "paler", "palsy", "panel", "panic", "pansy", "papal", "papaw", "paper", "parer",
    "party", "pasta", "paste", "pasty", "patch", "patio", "patsy", "patty", "pause", "payee",
    "payer", "peace", "peach", "pearl", "pecan", "pedal", "penal", "pence", "penny", "perch",
    "peril", "perky", "pesky", "pesto", "petal", "petty", "phase", "phone", "phony", "photo",
    "piano", "picky", "piece", "piety", "piggy", "pilot", "pinch", "piney", "pinky", "pinto",
    "piper", "pique", "pitch", "pithy", "piton", "pivot", "pixel", "pixie", "pizza", "place",
    "plaid", "plain", "plait", "plane", "plank", "plant", "plate", "plaza", "plead", "pleat",
    "plied", "plier", "pluck", "plumb", "plume", "plump", "plunk", "plush", "poesy", "point",
    "poise", "poker", "polar", "polka", "polyp", "pooch", "poppy", "porch", "poser", "posit",
    "posse", "pouch", "pound", "pouty", "power", "prank", "prawn", "preen", "press", "price",
    "prick", "pride", "pried", "prime", "primo", "print", "prior", "prism", "privy", "prize",
    "probe", "promo", "prone", "prong", "proof", "prose", "proud", "prove", "prowl", "proxy",
    "prude", "prune", "psalm", "pubic", "pudgy", "pulse", "punch", "pupal", "pupil", "puppy",
    "puree", "purer", "purge", "purse", "pushy", "putty", "pygmy", "quack", "quaff", "quail",
    "quake", "qualm", "quark", "quart", "quasi", "queen", "queer", "quell", "query", "quest",
    "queue", "quick", "quiet", "quill", "quilt", "quirk", "quota", "quote", "rabbi", "rabid",
    "racer", "radar", "radii", "radio", "radon", "rafts", "rainy", "raise", "rajah", "rally",
    "ralph", "ramen", "ranch", "randy", "range", "rapid", "rarer", "raspy", "ratio", "ratty",
    "raven", "rayon", "razor", "reach", "react", "ready", "realm", "reams", "rebel", "rebut",
    "recap", "recur", "redux", "reedy", "refer", "rehab", "reign", "relax", "relay", "relic",
    "remit", "renal", "renew", "repay", "repel", "reply", "rerun", "reset", "resin", "retch",
    "retro", "retry", "reuse", "revel", "revue", "rhino", "rhyme", "rider", "ridge", "rifle",
    "right", "rigid", "rigor", "rinse", "ripen", "riper", "risen", "riser", "risky", "ritzy",
    "rival", "river", "rivet", "roach", "roast", "robin", "robot", "rocky", "rodeo", "roger",
    "rogue", "roomy", "roost", "rotor", "rouge", "rough", "round", "rouse", "route", "rover",
    "rowdy", "rower", "royal", "ruddy", "ruder", "rugby", "ruin", "ruler", "rumba", "rumor",
    "rupee", "rural", "rusty", "sadly", "safer", "saint", "salad", "sally", "salon", "salsa",
    "salty", "salve", "salvo", "sandy", "saner", "sapid", "sappy", "sassy", "satay", "satin",
    "satyr", "sauce", "saucy", "sauna", "saute", "savor", "savoy", "savvy", "scald", "scale",
    "scalp", "scaly", "scamp", "scant", "scare", "scarf", "scary", "scene", "scent", "scion",
    "scoff", "scold", "scone", "scoop", "scoot", "scope", "score", "scorn", "scour", "scout",
    "scowl", "scram", "scrap", "scree", "screw", "scrub", "seamy", "sedan", "seedy", "segue",
    "seize", "semen", "sense", "sepia", "serif", "serum", "serve", "setup", "seven", "sever",
    "sewer", "shack", "shade", "shady", "shaft", "shake", "shaky", "shale", "shall", "shame",
    "shank", "shape", "shard", "share", "shark", "sharp", "shave", "shawl", "shear", "sheen",
    "sheep", "sheer", "sheet", "sheik", "shelf", "shell", "shied", "shift", "shine", "shiny",
    "shire", "shirk", "shirt", "shock", "shone", "shook", "shoot", "shore", "shorn", "short",
    "shout", "shove", "shown", "showy", "shrew", "shrub", "shrug", "shuck", "shunt", "shush",
    "sight", "sigma", "silky", "silly", "since", "sinew", "singe", "siren", "sissy", "sixth",
    "sixty", "skate", "skier", "skies", "skill", "skimp", "skirt", "skulk", "skull", "skunk",
    "slack", "slain", "slang", "slant", "slash", "slate", "slave", "sleek", "sleep", "sleet",
    "slept", "slice", "slick", "slide", "slime", "slimy", "sling", "slink", "slope", "slosh",
    "sloth", "slump", "slung", "slunk", "slurp", "slush", "slyly", "smack", "small", "smart",
    "smash", "smear", "smell", "smelt", "smile", "smirk", "smite", "smith", "smock", "smoke",
    "smoky", "snack", "snafu", "snail", "snake", "snaky", "snare", "snarl", "sneak", "sneer",
    "snide", "sniff", "snipe", "snoop", "snore", "snort", "snout", "snowy", "snuck", "snuff",
    "soapy", "sober", "soggy", "solar", "solid", "solve", "sonar", "sonic", "sooth", "sooty",
    "sorry", "sound", "south", "space", "spade", "spank", "spare", "spark", "spasm", "spawn",
    "speak", "spear", "speck", "speed", "spell", "spend", "spent", "sperm", "spice", "spicy",
    "spied", "spiel", "spike", "spiky", "spill", "spine", "spiny", "spire", "spite", "splat",
    "split", "spoil", "spoke", "spoof", "spook", "spool", "spoon", "spore", "sport", "spout",
    "spray", "spree", "sprig", "spunk", "spurn", "spurt", "squad", "squat", "squib", "stack",
    "staff", "stage", "staid", "stain", "stair", "stake", "stale", "stalk", "stall", "stamp",
    "stand", "stank", "stare", "stark", "start", "stash", "state", "stave", "stead", "steak",
    "steal", "steam", "steel", "steep", "steer", "stein", "stern", "stick", "stiff", "still",
    "stilt", "sting", "stink", "stint", "stock", "stoic", "stomp", "stone", "stony", "stood",
    "stool", "stoop", "store", "stork", "storm", "story", "stout", "stove", "strap", "straw",
    "stray", "strip", "strut", "stuck", "study", "stuff", "stump", "stung", "stunk", "stunt",
    "style", "suave", "sugar", "suing", "suite", "sulky", "sunny", "super", "surer", "surge",
    "surly", "sushi", "swamp", "swank", "swarm", "swash", "swath", "swear", "sweat", "sweep",
    "sweet", "swell", "swept", "swift", "swill", "swine", "swing", "swipe", "swirl", "swish",
    "swoon", "swoop", "sword", "swore", "sworn", "swung", "synod", "syrup", "tabby", "table",
    "taboo", "tacit", "tacky", "taffy", "taint", "taken", "taker", "tally", "talon", "tamer",
    "tango", "tangy", "taper", "tapir", "tardy", "tarot", "taste", "tasty", "tatty", "taunt",
    "tawny", "teach", "teary", "tease", "teddy", "teeth", "tempo", "tenet", "tenor", "tense",
    "tenth", "tepee", "tepid", "terra", "terse", "testy", "thank", "theft", "their", "theme",
    "there", "these", "thick", "thief", "thigh", "thing", "think", "third", "thong", "thorn",
    "those", "three", "threw", "throb", "throw", "thrum", "thumb", "thump", "thyme", "tiara",
    "tibia", "tidal", "tiger", "tight", "tilde", "timer", "timid", "tipsy", "titan", "title",
    "toast", "today", "toddy", "token", "tonal", "toner", "tongs", "tonic", "tooth", "topaz",
    "topic", "torch", "torso", "torus", "total", "totem", "touch", "tough", "towel", "tower",
    "toxic", "trace", "track", "tract", "trade", "trail", "train", "trait", "tramp", "trash",
    "trawl", "tread", "treat", "trend", "tress", "trial", "tribe", "trick", "tried", "trier",
    "trill", "trite", "troll", "tromp", "troop", "trope", "troth", "trout", "trove", "truce",
    "truck", "truly", "trump", "trunk", "truss", "trust", "truth", "tryst", "tubal", "tuber",
    "tulip", "tumid", "tummy", "tumor", "tuner", "tunic", "turbo", "tutor", "tutu", "tuxed",
    "twain", "twang", "tweak", "tweed", "tweet", "twice", "twigs", "twine", "twirl", "twist",
    "tying", "udder", "ulcer", "ultra", "umbra", "uncle", "uncut", "under", "undid", "undue",
    "unfed", "unfit", "unify", "union", "unite", "unity", "unlit", "unmet", "unset", "untie",
    "until", "unwed", "unzip", "upper", "upset", "urban", "urine", "usage", "usher", "using",
    "usual", "usurp", "utile", "utter", "vague", "valet", "valid", "valor", "value", "valve",
    "vapid", "vapor", "vault", "vaunt", "vegan", "venue", "verge", "verse", "verso", "verve",
    "vicar", "video", "vigor", "villa", "vinyl", "viola", "viper", "viral", "virus", "visit",
    "visor", "vista", "vital", "vivid", "vixen", "vocal", "vodka", "vogue", "voice", "voila",
    "vomit", "voter", "vouch", "vowel", "vying", "wacky", "wafer", "wager", "wagon", "waist",
    "waive", "waltz", "warty", "waste", "watch", "water", "waver", "waxen", "weary", "weave",
    "wedge", "weedy", "weigh", "weird", "welch", "welsh", "wench", "whack", "whale", "wharf",
    "wheat", "wheel", "whelp", "where", "which", "whiff", "while", "whine", "whiny", "whip",
    "whirl", "whisk", "white", "whole", "whoop", "whose", "widen", "wider", "widow", "width",
    "wield", "wight", "willy", "wimpy", "wince", "winch", "windy", "wiper", "witch", "witty",
    "woken", "woman", "women", "woody", "wooer", "wooly", "woozy", "wordy", "world", "worry",
    "worse", "worst", "worth", "would", "wound", "woven", "wrack", "wrath", "wreak", "wreath",
    "wreck", "wrest", "wring", "wrist", "write", "wrong", "wrote", "wrung", "wryly", "yacht",
    "yearn", "yeast", "yield", "young", "youth", "zebra", "zesty", "zippy", "zonal", "zoned"
];

/**
 * Converts a word to bytes5 format (lowercase)
 */
function wordToBytes5(word) {
    const bytes = Buffer.from(word.toLowerCase().padEnd(5, '\0'), 'ascii');
    return '0x' + bytes.slice(0, 5).toString('hex');
}

/**
 * Generates leaf hash for a word
 */
function generateLeaf(word) {
    const bytes5 = wordToBytes5(word);
    // keccak256(abi.encodePacked(bytes5))
    const packed = defaultAbiCoder.encode(['bytes5'], [bytes5]);
    // Remove padding for packed encoding
    const packedBytes = packed.slice(0, 2 + 10); // 0x + 5 bytes = 12 chars
    return keccak256(packedBytes);
}

/**
 * Main function
 */
async function main() {
    console.log("Generating Merkle tree for", WORDLE_WORDS.length, "words...");
    
    // Generate leaves
    const leaves = WORDLE_WORDS.map(word => generateLeaf(word));
    
    // Create Merkle tree
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();
    
    console.log("\nMerkle Root:", root);
    
    // Generate proofs for each word
    const proofs = {};
    for (let i = 0; i < WORDLE_WORDS.length; i++) {
        const word = WORDLE_WORDS[i];
        const leaf = leaves[i];
        const proof = tree.getHexProof(leaf);
        proofs[word] = {
            bytes5: wordToBytes5(word),
            proof: proof
        };
    }
    
    // Write output
    const output = {
        root: root,
        wordCount: WORDLE_WORDS.length,
        words: proofs
    };
    
    const outputPath = path.join(__dirname, '../merkle-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log("\nOutput written to:", outputPath);
    console.log("\nExample proof for 'crane':");
    console.log(JSON.stringify(proofs['crane'], null, 2));
    
    // Verify a proof
    const testWord = 'crane';
    const testLeaf = generateLeaf(testWord);
    const testProof = tree.getProof(testLeaf);
    const verified = tree.verify(testProof, testLeaf, root);
    console.log("\nVerification for 'crane':", verified);
    
    // Output Solidity constant
    console.log("\n// Solidity constant for deployment:");
    console.log(`bytes32 public constant WORD_LIST_MERKLE_ROOT = ${root};`);
}

main().catch(console.error);
