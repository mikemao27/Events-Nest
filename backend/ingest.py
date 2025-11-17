# Getting event data from events.rice.edu and OwlNest.
import sqlite3
from datetime import datetime, timezone
from bs4 import BeautifulSoup
import feedparser

DATABASE_PATH = "database/events.db"
EVENTS_RSS_URL = "https://events.rice.edu/live/rss/events/header/All%20Events"
OWL_NEST_RSS_URL = "https://owlnest.rice.edu/events.rss"

def get_connection():
    return sqlite3.connect(DATABASE_PATH)


# Rice Events Page Helper Methods.
def parse_events_description(html: str) -> str | None:
    if not html:
        return None
    parser = BeautifulSoup(html, "html.parser")
    text = parser.get_text(separator = " ", strip = True)
    return text or None

def get_events_times(entry):
    published = getattr(entry, "published_parsed", None)
    if not published:
        return None, None
    
    date = datetime(*published[:6], tzinfo = timezone.utc)
    start_time = date.isoformat()
    end_time = None
    return start_time, end_time

def get_event_location(entry):
    return getattr(entry, "georss_featurename", None)

# OwlNest Events Page Helper Methods.
def parse_owlnest_description(html):
    parser = BeautifulSoup(html, "html.parser")

    description_block = parser.select_one(".p-description.description")
    description = None
    if description_block:
        description = description_block.get_text(separator = " ", strip = True)

    start_tag = parser.select_one(".dt-start")
    end_tag = parser.select_one(".dt-end")

    start_time = None
    if start_tag and start_tag.has_attr("datetime"):
        start_time = start_tag["datetime"]
    end_time = None
    if end_tag and end_tag.has_attr("datetime"):
        end_time = end_tag["datetime"]

    location_tag = parser.select_one(".p-location.location")
    location = None
    if location_tag:
        location = location_tag.get_text(strip = True)

    return description, start_time, end_time, location

# Parse both feeds.
def parse_rss():
    events_feed = feedparser.parse(EVENTS_RSS_URL)
    owl_nest_feed = feedparser.parse(OWL_NEST_RSS_URL)
    events = []

    # Rice Events Page.
    for entry in events_feed.entries:
        title = entry.title
        link = entry.link

        raw_html = getattr(entry, "description", "")
        description = parse_events_description(raw_html)
        start_time, end_time = get_events_times(entry)
        location = get_event_location(entry)

        events.append({
            "source": "events.rice.edu",
            "source_id": link,
            "title": title,
            "event_description": description,
            "source_url": link,
            "start_time": start_time,
            "end_time": end_time,
            "event_location": location,
        })
    
    # OwlNest Events Page.
    for entry in owl_nest_feed.entries:
        title = entry.title
        link = entry.link

        raw_html = getattr(entry, "description", "")
        description, start_time, end_time, location = parse_owlnest_description(raw_html)

        events.append({
            "source": "owlnest.rice.edu",
            "source_id": link,
            "title": title,
            "event_description": description,
            "source_url": link,
            "start_time": start_time,
            "end_time": end_time,
            "event_location": location,
        })
    
    return events

# Insert events into the database.
def insert_events(events):
    connection = get_connection()
    cursor = connection.cursor()

    for event in events:
        cursor.execute(
            """
            INSERT INTO events
                (source, source_id, title, event_description, source_url,
                start_time, end_time, event_location)
            VALUES
                (:source, :source_id, :title, :event_description, :source_url,
                :start_time, :end_time, :event_location)
            ON CONFLICT(source, source_id) DO UPDATE SET
                title = excluded.title,
                event_description = excluded.event_description,
                source_url = excluded.source_url,
                start_time = excluded.start_time,
                end_time = excluded.end_time,
                event_location = excluded.event_location;
            """,
            event,
        )

    connection.commit()
    connection.close()

def insert_academic_fields():
    connection = get_connection()
    cursor = connection.cursor()

    academic_fields = [
        "Architecture", "Business", "Engineering", "Humanities and Arts",
        "Music", "Natural Sciences", "Socal Sciences", "Education", "Civic Leadership",
        "Naval Science"
    ]

    for academic_field in academic_fields:
        cursor.execute(
            "INSERT OR IGNORE INTO academic_fields (degree_name) VALUES (?)",
            (academic_field,)
        )
    
    connection.commit()
    connection.close()

if __name__ == "__main__":
    events = parse_rss()
    print(f"Fetched {len(events)} events from RSS!")
    insert_events(events)
    print("Events inserted into the database!")
    insert_academic_fields()
    print("Degrees inserted into the database!")