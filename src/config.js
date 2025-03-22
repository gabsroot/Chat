const PORT = 80;

const TIME = {
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000
};

const SESSION = {
    secret: `secret_key`,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: `lax`,
        maxAge: TIME.WEEK
    }
};

module.exports = { PORT, SESSION };
