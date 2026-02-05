// Game constants
export const WORD_LENGTH = 5
export const MAX_GUESSES = 6
export const TURN_DURATION = 30 // seconds
export const COUNTDOWN_DURATION = 3 // seconds before game starts

// Wager options (in ETH)
export const WAGER_OPTIONS = [
  { label: '0.001 ETH', value: '0.001' },
  { label: '0.005 ETH', value: '0.005' },
  { label: '0.01 ETH', value: '0.01' },
  { label: '0.05 ETH', value: '0.05' },
  { label: '0.1 ETH', value: '0.1' },
]

// Keyboard layout
export const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
]

// Valid 5-letter words (sample - in production, fetch from server)
export const VALID_WORDS = new Set([
  'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
  'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIEN', 'ALIGN', 'ALIKE', 'ALIVE',
  'ALLOW', 'ALONE', 'ALONG', 'ALTER', 'AMONG', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY', 'APART',
  'APPLE', 'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARMOR', 'ARRAY', 'ARROW', 'ASSET', 'AVOID',
  'AWARD', 'AWARE', 'BEACH', 'BEGAN', 'BEGIN', 'BEING', 'BELOW', 'BENCH', 'BERRY', 'BLACK',
  'BLADE', 'BLAME', 'BLANK', 'BLAST', 'BLAZE', 'BLEED', 'BLEND', 'BLESS', 'BLIND', 'BLOCK',
  'BLOOD', 'BLOOM', 'BLOWN', 'BOARD', 'BOOST', 'BOOTH', 'BOUND', 'BRAIN', 'BRAND', 'BRASS',
  'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRICK', 'BRIDE', 'BRIEF', 'BRING', 'BROAD', 'BROKE',
  'BROWN', 'BRUSH', 'BUILD', 'BUILT', 'BUNCH', 'BURST', 'BUYER', 'CABIN', 'CABLE', 'CALIF',
  'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHAOS', 'CHARM', 'CHART', 'CHASE', 'CHEAP',
  'CHECK', 'CHEST', 'CHIEF', 'CHILD', 'CHINA', 'CHOSE', 'CIVIL', 'CLAIM', 'CLASS', 'CLEAN',
  'CLEAR', 'CLIMB', 'CLOCK', 'CLOSE', 'CLOUD', 'COACH', 'COAST', 'COULD', 'COUNT', 'COURT',
  'COVER', 'CRACK', 'CRAFT', 'CRANE', 'CRASH', 'CRAZY', 'CREAM', 'CRISP', 'CROSS', 'CROWD',
  'CROWN', 'CRUEL', 'CRUSH', 'CURVE', 'CYCLE', 'DAILY', 'DANCE', 'DATED', 'DEALT', 'DEATH',
  'DEBUT', 'DELAY', 'DEPTH', 'DOING', 'DOUBT', 'DOZEN', 'DRAFT', 'DRAIN', 'DRAMA', 'DRANK',
  'DRAWN', 'DREAM', 'DRESS', 'DRIED', 'DRIFT', 'DRILL', 'DRINK', 'DRIVE', 'DROIT', 'DROWN',
  'DRUGS', 'DRUNK', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EATEN', 'EIGHT', 'ELECT', 'ELITE',
  'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'ESSAY', 'EVENT', 'EVERY',
  'EXACT', 'EXIST', 'EXTRA', 'FAITH', 'FALSE', 'FANCY', 'FATAL', 'FAULT', 'FAVOR', 'FEAST',
  'FIELD', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FINDS', 'FIRST', 'FIXED', 'FLAME', 'FLASH',
  'FLEET', 'FLESH', 'FLOAT', 'FLOOD', 'FLOOR', 'FLUID', 'FOCUS', 'FORCE', 'FORTH', 'FORUM',
  'FOUND', 'FRAME', 'FRANK', 'FRAUD', 'FRESH', 'FRONT', 'FRUIT', 'FULLY', 'FUNNY', 'GHOST',
  'GIANT', 'GIVEN', 'GLASS', 'GLOBE', 'GLORY', 'GOING', 'GRACE', 'GRADE', 'GRAIN', 'GRAND',
  'GRANT', 'GRAPE', 'GRASP', 'GRASS', 'GRAVE', 'GREAT', 'GREEN', 'GREET', 'GRIEF', 'GROSS',
  'GROUP', 'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'GUILT', 'HAPPY', 'HARRY', 'HARSH',
  'HAVEN', 'HEART', 'HEAVY', 'HEDGE', 'HELLO', 'HENCE', 'HONOR', 'HORSE', 'HOTEL', 'HOUSE',
  'HUMAN', 'HUMOR', 'IDEAL', 'IMAGE', 'IMPLY', 'INDEX', 'INNER', 'INPUT', 'ISSUE', 'JAPAN',
  'JIMMY', 'JOINT', 'JONES', 'JUDGE', 'JUICE', 'JUICY', 'KNIFE', 'KNOCK', 'KNOWN', 'LABEL',
  'LABOR', 'LARGE', 'LASER', 'LATER', 'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE',
  'LEGAL', 'LEMON', 'LEVEL', 'LEWIS', 'LIGHT', 'LIMIT', 'LINKS', 'LIVES', 'LOCAL', 'LOGIC',
  'LOOSE', 'LOSER', 'LOWER', 'LUCKY', 'LUNCH', 'LYING', 'MAGIC', 'MAJOR', 'MAKER', 'MARCH',
  'MARIA', 'MARRY', 'MATCH', 'MAYBE', 'MAYOR', 'MEANT', 'MEDIA', 'MERCY', 'MERGE', 'MERIT',
  'METAL', 'MIGHT', 'MINOR', 'MINUS', 'MIXED', 'MODEL', 'MONEY', 'MONTH', 'MORAL', 'MOTOR',
  'MOUNT', 'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC', 'NAIVE', 'NAVAL', 'NERVE', 'NEVER', 'NEWLY',
  'NIGHT', 'NOISE', 'NORTH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER', 'OFTEN',
  'ORDER', 'OTHER', 'OUGHT', 'OUTER', 'OWNED', 'OWNER', 'PAINT', 'PANEL', 'PANIC', 'PAPER',
  'PARTY', 'PASTA', 'PATCH', 'PAUSE', 'PEACE', 'PENNY', 'PHASE', 'PHONE', 'PHOTO', 'PIANO',
  'PIECE', 'PILOT', 'PITCH', 'PIZZA', 'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'PLAZA',
  'PLUNG', 'POINT', 'POLAR', 'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME', 'PRINT',
  'PRIOR', 'PRIZE', 'PROOF', 'PROUD', 'PROVE', 'PROXY', 'QUEEN', 'QUEST', 'QUICK', 'QUIET',
  'QUITE', 'QUOTE', 'RADIO', 'RAISE', 'RALLY', 'RANCH', 'RANGE', 'RAPID', 'RATIO', 'REACH',
  'READY', 'REALM', 'REBEL', 'REFER', 'REIGN', 'RELAX', 'REPLY', 'RIDGE', 'RIFLE', 'RIGHT',
  'RIGID', 'RISKY', 'RIVAL', 'RIVER', 'ROBIN', 'ROBOT', 'ROCKY', 'ROGER', 'ROMAN', 'ROUGH',
  'ROUND', 'ROUTE', 'ROYAL', 'RURAL', 'SADLY', 'SAINT', 'SALAD', 'SALES', 'SANDY', 'SANTA',
  'SAUCE', 'SAVED', 'SCALE', 'SCENE', 'SCOPE', 'SCORE', 'SENSE', 'SERVE', 'SEVEN', 'SHALL',
  'SHAME', 'SHAPE', 'SHARE', 'SHARP', 'SHEEP', 'SHEER', 'SHEET', 'SHELF', 'SHELL', 'SHIFT',
  'SHINE', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORE', 'SHORT', 'SHOUT', 'SIGHT', 'SIGMA', 'SIGNS',
  'SILLY', 'SINCE', 'SIXTY', 'SIZED', 'SKILL', 'SLAVE', 'SLEEP', 'SLICE', 'SLIDE', 'SLOPE',
  'SMALL', 'SMART', 'SMELL', 'SMILE', 'SMITH', 'SMOKE', 'SNAKE', 'SOLID', 'SOLVE', 'SORRY',
  'SOUND', 'SOUTH', 'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPLIT', 'SPOKE',
  'SPORT', 'SPOTS', 'SPRAY', 'SQUAD', 'STACK', 'STAFF', 'STAGE', 'STAKE', 'STAMP', 'STAND',
  'START', 'STATE', 'STEAM', 'STEEL', 'STEEP', 'STERN', 'STICK', 'STILL', 'STOCK', 'STONE',
  'STOOD', 'STORE', 'STORM', 'STORY', 'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR',
  'SUITE', 'SUNNY', 'SUPER', 'SURGE', 'SWAMP', 'SWEAR', 'SWEET', 'SWEPT', 'SWIFT', 'SWING',
  'SWORD', 'TABLE', 'TAKEN', 'TASTE', 'TAXES', 'TEACH', 'TEETH', 'TERRY', 'TEXAS', 'THANK',
  'THEFT', 'THEIR', 'THEME', 'THERE', 'THESE', 'THICK', 'THING', 'THINK', 'THIRD', 'THOSE',
  'THREE', 'THREW', 'THROW', 'THUMB', 'TIGHT', 'TIMER', 'TIRED', 'TITLE', 'TODAY', 'TOKEN',
  'TOOTH', 'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TRACK', 'TRADE', 'TRAIL', 'TRAIN',
  'TRAIT', 'TRASH', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED', 'TROOP', 'TRUCK',
  'TRULY', 'TRUMP', 'TRUNK', 'TRUST', 'TRUTH', 'TWICE', 'TWIST', 'TYLER', 'ULTRA', 'UNCLE',
  'UNDER', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'URGED', 'USAGE', 'USUAL',
  'VALID', 'VALUE', 'VAULT', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VIVID', 'VOCAL', 'VOICE',
  'VOTER', 'WAGON', 'WASTE', 'WATCH', 'WATER', 'WEIGH', 'WEIRD', 'WHALE', 'WHEAT', 'WHEEL',
  'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WIDER', 'WIDTH', 'WITCH', 'WOMAN',
  'WOMEN', 'WORDS', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND', 'WRATH',
  'WRITE', 'WRONG', 'WROTE', 'YIELD', 'YOUNG', 'YOUTH', 'ZEBRA', 'ZONES',
])

// Sound file paths
export const SOUNDS = {
  correct: '/sounds/correct.mp3',
  present: '/sounds/present.mp3',
  absent: '/sounds/absent.mp3',
  win: '/sounds/win.mp3',
  lose: '/sounds/lose.mp3',
  tick: '/sounds/tick.mp3',
  submit: '/sounds/submit.mp3',
  invalid: '/sounds/invalid.mp3',
}

// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || ''
export const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`

// Contract addresses (Base mainnet)
export const CONTRACTS = {
  wordDuel: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Deploy contract
}
