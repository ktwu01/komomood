const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'mood_entries.db');

class Database {
    constructor() {
        this.db = null;
    }

    // Initialize database connection and create tables
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                    return;
                }
                console.log('Connected to SQLite database at:', DB_PATH);
                
                // Create mood_entries table
                this.createTables()
                    .then(() => {
                        console.log('Database tables initialized successfully');
                        resolve();
                    })
                    .catch(reject);
            });
        });
    }

    // Create required tables
    async createTables() {
        return new Promise((resolve, reject) => {
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS mood_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entry_date TEXT UNIQUE NOT NULL,
                    koko_mood INTEGER,
                    momo_mood INTEGER,
                    komo_score INTEGER,
                    note TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `;

            this.db.run(createTableSQL, (err) => {
                if (err) {
                    console.error('Error creating mood_entries table:', err.message);
                    reject(err);
                    return;
                }
                console.log('mood_entries table created or already exists');
                resolve();
            });
        });
    }

    // Get all mood entries
    async getAllEntries() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM mood_entries ORDER BY entry_date DESC', (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    // Insert a new mood entry
    async insertEntry(entryData) {
        return new Promise((resolve, reject) => {
            const { entry_date, koko_mood, momo_mood, komo_score, note } = entryData;
            
            const insertSQL = `
                INSERT INTO mood_entries (entry_date, koko_mood, momo_mood, komo_score, note)
                VALUES (?, ?, ?, ?, ?)
            `;

            this.db.run(insertSQL, [entry_date, koko_mood, momo_mood, komo_score, note], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({
                    id: this.lastID,
                    entry_date,
                    koko_mood,
                    momo_mood,
                    komo_score,
                    note
                });
            });
        });
    }

    // Get entry by date
    async getEntryByDate(entry_date) {
        return new Promise((resolve, reject) => {
            const selectSQL = 'SELECT * FROM mood_entries WHERE entry_date = ? LIMIT 1';
            this.db.get(selectSQL, [entry_date], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }

    // Update entry by date
    async updateEntryByDate(entryData) {
        return new Promise((resolve, reject) => {
            const { entry_date, koko_mood, momo_mood, komo_score, note } = entryData;
            const updateSQL = `
                UPDATE mood_entries
                SET koko_mood = ?, momo_mood = ?, komo_score = ?, note = ?
                WHERE entry_date = ?
            `;
            this.db.run(updateSQL, [koko_mood, momo_mood, komo_score, note, entry_date], async (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                try {
                    const updated = await this.getEntryByDate(entry_date);
                    resolve(updated);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                    return;
                }
                console.log('Database connection closed');
            });
        }
    }
}

module.exports = Database;
