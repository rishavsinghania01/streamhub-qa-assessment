import csv
import html
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SQL = ROOT / 'sql'
REPORTS = ROOT / 'reports' / 'sql'


def query(connection, filename):
    cursor = connection.execute((SQL / filename).read_text())
    columns = [column[0] for column in cursor.description]
    return columns, cursor.fetchall()


def check_equal(actual, expected, label):
    if actual != expected:
        raise AssertionError(f'{label}: expected {expected}, got {actual}')


def save_output(name, columns, rows):
    with (REPORTS / f'{name}.csv').open('w', newline='') as stream:
        writer = csv.writer(stream)
        writer.writerow(columns)
        writer.writerows(rows)
    head = ''.join(f'<th>{html.escape(column)}</th>' for column in columns)
    body = ''.join('<tr>' + ''.join(f'<td>{html.escape(str(value))}</td>' for value in row) + '</tr>' for row in rows)
    page = f'''<!doctype html><html lang="en"><meta charset="utf-8"><title>{name} query output</title>
<style>body{{font:15px system-ui;padding:32px;color:#18332e;background:#f6f7f2}}h1{{font-size:24px}}table{{border-collapse:collapse;background:white}}td,th{{padding:14px;border:1px solid #dce3d9;text-align:left}}th{{background:#e8f0e7}}code{{font-size:12px}}</style>
<h1>{name.replace('_', ' ').title()}</h1><p>SQLite {sqlite3.sqlite_version} · Synthetic fixtures · Executed {datetime.now(timezone.utc).isoformat()}</p>
<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table><p>Source: <code>sql/{name}.sql</code></p></html>'''
    (REPORTS / f'{name}.html').write_text(page)


def main():
    REPORTS.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(':memory:') as connection:
        connection.executescript((SQL / 'schema.sql').read_text())
        connection.executescript((SQL / 'fixtures.sql').read_text())
        transfers_columns, transfers = query(connection, 'round_trips.sql')
        check_equal([(row[0], row[1]) for row in transfers], [(1, 2), (1, 3), (7, 8), (12, 11)], 'round-trip pairs')
        streak_columns, streaks = query(connection, 'player_streaks.sql')
        check_equal(streaks, [
            ('Arjun Rao', '2024-04-01', 3),
            ('Arjun Rao', '2024-04-13', 4),
            ('Dev Mehta', '2024-04-04', 3),
            ('Ishan Sen', '2024-04-04', 3),
        ], 'maximal scoring streaks')
        save_output('round_trips', transfers_columns, transfers)
        save_output('player_streaks', streak_columns, streaks)

        checks = ['exact fixture outputs', 'inclusive 10% bounds', 'inclusive 24 hours', 'reject 24 hours + 1 second', 'same currency only', 'deterministic simultaneous pair', 'low scores break streaks', 'runs = 30 qualifies', '2023 excluded', 'consecutive player appearances']
        with connection:
            connection.execute("INSERT INTO transfers VALUES (20, 'X', 'Y', 10000, 'INR', '2024-05-01T12:00:00Z')")
            connection.execute("INSERT INTO transfers VALUES (21, 'Y', 'X', 10000, 'INR', '2024-05-02T12:00:01Z')")
            _, extra = query(connection, 'round_trips.sql')
            check_equal([(row[0], row[1]) for row in extra], [(1, 2), (1, 3), (7, 8), (12, 11)], 'late return excluded')
            connection.execute('UPDATE player_scores SET runs = 29 WHERE player_id = 1 AND match_id = 2')
            _, broken = query(connection, 'player_streaks.sql')
            check_equal(broken, [
                ('Arjun Rao', '2024-04-13', 4),
                ('Dev Mehta', '2024-04-04', 3),
                ('Ishan Sen', '2024-04-04', 3),
            ], '29-run innings breaks a streak')
        checks.extend(['extra late return stays excluded', 'mutation from 45 to 29 breaks the first streak'])
        evidence = {'recorded_at': datetime.now(timezone.utc).isoformat(), 'sqlite_version': sqlite3.sqlite_version, 'checks': checks, 'status': 'passed', 'round_trip_rows': len(transfers), 'streak_rows': len(streaks)}
        (REPORTS / 'results.json').write_text(json.dumps(evidence, indent=2) + '\n')
        log = f'SQL checks passed ({len(checks)} checks)\nRound trips: {transfers}\nPlayer streaks: {streaks}\n'
        (REPORTS / 'execution.log').write_text(log)
        print(log)


if __name__ == '__main__':
    main()
