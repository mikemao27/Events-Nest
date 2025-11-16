# Getting event data from events.rice.edu and OwlNest.
import sqlite3
from datetime import datetime, timezone
import feedparser

DATABASE_PATH = "database/events.db"
RSS_URL = "https://events.rice.edu/live/rss/events/header/All%20Events"

def get_connection():
    return sqlite3.connect(DATABASE_PATH)

def parse_rss():
    feed = feedparser.parse(RSS_URL)
    events = []

    for entry in feed.entries:
        title = entry.title
        link = entry.link
        description = getattr(entry, "description", "")
        published = getattr(entry, "published_parsed", None)

        if published:
            published_date = datetime(*published[:6], tzinfo = timezone.utc)
            date_string = published_date.isoformat()
        else:
            date_string = None
        
        events.append({
            "source": "events.rice.rss",
            "source_id": link,
            "title": title,
            "event_description": description,
            "source_url": link,
            "start_time": None,
            "end_time": None,
            "event_location": None,
        })
    
    return events

def insert_events(events):
    connection = get_connection()
    cursor = connection.cursor()

    for event in events:
        cursor.execute(
            """
            INSERT INTO events
                (source, source_id, title, event_description,
                source_url, start_time, end_time, event_location)
            VALUES
                (:source, :source_id, :title, :event_description,
                :source_url, :start_time, :end_time, :event_location)
            ON CONFLICT(source, source_id) DO UPDATE SET
                title = excluded.title,
                event_description = excluded.event_description,
                source_url = excluded.source_url;
            """,
            event,
        )

    connection.commit()
    connection.close()

if __name__ == "__main__":
    events = parse_rss()
    print(f"Fetched {len(events)} events from RSS!")
    insert_events(events)
    print("Events inserted into the database")