const mongoose = require('mongoose');

const db = mongoose.connect(process.env.DB, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
});

mongoose.connection.on("error", err => {
    console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
});

// Добавляем обработчик события для закрытия соединения перед завершением процесса
process.on('SIGINT', async () => {
    try {
        await mongoose.disconnect();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
    }
});

module.exports = db;

//require("./location")