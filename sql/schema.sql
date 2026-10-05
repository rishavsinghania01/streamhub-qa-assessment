PRAGMA foreign_keys = ON;

CREATE TABLE transfers (
    id INTEGER PRIMARY KEY,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL,
    sent_at TEXT NOT NULL,
    CHECK (sender <> receiver)
);
CREATE INDEX transfers_return_lookup ON transfers (sender, receiver, currency, sent_at);

CREATE TABLE players (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);
CREATE TABLE matches (
    id INTEGER PRIMARY KEY,
    season INTEGER NOT NULL,
    played_on TEXT NOT NULL
);
CREATE TABLE player_scores (
    player_id INTEGER NOT NULL REFERENCES players(id),
    match_id INTEGER NOT NULL REFERENCES matches(id),
    runs INTEGER NOT NULL CHECK (runs >= 0),
    PRIMARY KEY (player_id, match_id)
);
