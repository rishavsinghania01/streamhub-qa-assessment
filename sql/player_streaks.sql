WITH appearances AS (
    SELECT
        scores.player_id,
        matches.id AS match_id,
        matches.played_on,
        scores.runs,
        ROW_NUMBER() OVER (
            PARTITION BY scores.player_id
            ORDER BY matches.played_on, matches.id
        ) AS appearance_no
    FROM player_scores AS scores
    JOIN matches ON matches.id = scores.match_id
    WHERE matches.season = 2024
), qualifying AS (
    SELECT
        player_id,
        played_on,
        appearance_no - ROW_NUMBER() OVER (
            PARTITION BY player_id ORDER BY appearance_no
        ) AS streak_group
    FROM appearances
    WHERE runs >= 30
), streaks AS (
    SELECT player_id, MIN(played_on) AS streak_started, COUNT(*) AS matches_in_streak
    FROM qualifying
    GROUP BY player_id, streak_group
    HAVING COUNT(*) >= 3
)
SELECT players.name AS player_name, streaks.streak_started, streaks.matches_in_streak
FROM streaks
JOIN players ON players.id = streaks.player_id
ORDER BY players.name, streaks.streak_started;
