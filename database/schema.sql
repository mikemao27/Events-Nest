/* Create a database table to store events data */
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    source_id TEXT NOT NULL,

    title TEXT NOT NULL,
    event_description TEXT,
    source_url TEXT NOT NULL,

    start_time DATE,
    end_time DATE,
    event_location TEXT,

    club_id INTEGER,
    FOREIGN KEY (club_id) REFERENCES clubs(id),

    UNIQUE(source, source_id)
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    netID TEXT NOT NULL,
    user_password TEXT NOT NULL,

    degree TEXT,

    UNIQUE(netID)
);

CREATE TABLE IF NOT EXISTS club_interests (
    user_id INTEGER NOT NULL,
    club_id INTEGER NOT NULL,

    PRIMARY KEY (user_id, club_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    club_description TEXT,

    field TEXT NOT NULL,

    UNIQUE(title)
);

CREATE TABLE IF NOT EXISTS academic_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    degree_name TEXT NOT NULL,

    UNIQUE(degree_name)
);

CREATE TABLE IF NOT EXISTS club_academic_fields (
    club_id INTEGER NOT NULL,
    academic_field_id INTEGER NOT NULL,

    PRIMARY KEY (club_id, academic_field_id),
    FOREIGN KEY (club_id) REFERENCES clubs(id),
    FOREIGN KEY (academic_field_id) REFERENCES academic_fields(id)
);