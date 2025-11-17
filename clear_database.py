import sqlite3

connection = sqlite3.connect("database/events.db")
cursor = connection.cursor()
cursor.execute("DELETE FROM events;")
connection.commit()
connection.close()