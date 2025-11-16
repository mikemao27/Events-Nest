import sqlite3

connection = sqlite3.connect("database/events.db")
cursor = connection.cursor()

with open("database/schema.sql") as file:
    cursor.executescript(file.read())

connection.commit()
connection.close()

print("Databases Initialized!")