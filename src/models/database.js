const sqlite3 = require(`sqlite3`);
const bcrypt = require(`bcrypt`);

class Database {

    constructor(database) {
        this.database = new sqlite3.Database(database);
    }

    async login(username, password) {
        return new Promise((resolve, reject) => {
            this.database.get(`SELECT * FROM users WHERE username = ?`, [username], (error, row) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!row) {
                    resolve(false);
                    return;
                }
    
                // pass
                bcrypt.compare(password, row.password, (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(result);
                });
            });
        });
    }

    async register_user(username, password, name, bio) {
        let encrypted = await bcrypt.hash(password, 10);

        return new Promise((resolve, reject) => {
            this.database.run(`INSERT INTO users (username, password, name, bio) VALUES (?, ?, ?, ?)`, [username, encrypted, name, bio], function (error) {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(this.lastID);
            });
        });
    }

    async get_users() {
        return new Promise((resolve, reject) => {
            this.database.all(`SELECT * FROM users`, (error, rows) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                resolve(rows);
            });
        });
    }

    async get_user(username) {
        return new Promise((resolve, reject) => {
            this.database.get(`SELECT * FROM users WHERE username = ?`, [username], (error, row) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!row) {
                    resolve(false);
                    return;
                }

                resolve(row);
            });
        });
    }

    async get_messages(sender, receiver) {
        return new Promise((resolve, reject) => {
            this.database.all(`SELECT * FROM messages WHERE ((sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)) AND deleted != 1`, [sender, receiver, receiver, sender], (error, rows) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(rows || []);
            });
        });
    }

    async get_last_message(sender, receiver) {
        return new Promise((resolve, reject) => {
            this.database.get(`SELECT * FROM messages WHERE ((sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)) AND deleted != 1 ORDER BY timestamp DESC LIMIT 1`, [sender, receiver, receiver, sender], (error, row) => {
                if (error) {
                    reject(error);
                    return;
                }
    
                if (!row) {
                    resolve(null);
                    return;
                }
    
                resolve(row);
            });
        });
    }

    async save_message(sender, receiver, message) {
        return new Promise((resolve, reject) => {
            this.database.run(`INSERT INTO messages (sender, receiver, message, timestamp, deleted) VALUES (?, ?, ?, datetime('now', 'localtime'), 0)`, [sender, receiver, message], function(error) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve({ id: this.lastID, sender, receiver, message });
                }
            );
        });
    }

    close() {
        this.database.close();
    }
}

module.exports = Database;
