import express from "express";
import axios from "axios";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";

const app = express();
app.use(cors());
const port = 5000;

dotenv.config(); //loading env var from .env file
const apiKey = process.env.API_KEY;

const stocks = [
    "AAPL", "MSFT", "AMZN", "GOOGL", "TSLA",
    "FB", "NVDA", "JPM", "V", "DIS",
    "BABA", "PYPL", "HD", "NFLX", "ADBE",
    "CRM", "VZ", "WMT", "CMCSA", "INTC"
];

// Function to fetch and update stock prices
const updateStockPrices = async (symbol, interval) => {
    setInterval(async () => {
        try {
            const today = new Date();
            today.setDate(today.getDate() - 1);
            const yesterday = today.toISOString().slice(0, 10); 

            const response = await axios.get(
                `https://api.polygon.io/v1/open-close/${symbol}/${yesterday}`,
                {
                    params: {
                        apiKey,
                    },
                }
            );
            const newPrice = response.data.open + Math.random();
            const data = {
                symbol,
                open: newPrice,
                details: response.data
            };

            let fileData = fs.readFileSync('stockData.txt', 'utf8');
            let lines = fileData.trim().split('\n');
            let found = false;

            lines.forEach((line, index) => {
                const jsonData = JSON.parse(line);
                if (jsonData.symbol === symbol) {
                    lines[index] = JSON.stringify(data);
                    found = true;
                }
            });

            if (!found) {
                lines.push(JSON.stringify(data));
            }

            fs.writeFileSync('stockData.txt', lines.join('\n'));

            console.log(`Updated ${symbol} price to ${newPrice}`);
        } catch (error) {
            console.error(`Error updating stock ${symbol}:`, error);
        }
    }, interval * 1000);
};


const addInitialStockData = async () => {
    try {
        const fileData = fs.readFileSync('stockData.txt', 'utf8').trim();
        if (fileData === '') {
            console.log("No initial stock data found. Adding stocks...");
            stocks.forEach(symbol => {
                fs.appendFileSync('stockData.txt', JSON.stringify({ symbol, open: 0 }) + '\n');
            });
            console.log("Initial stocks added.");
        }
    } catch (error) {
        console.error('Error adding initial stock data:', error);
    }
};

const initializeStockData = async () => {
    try {
        const data = fs.readFileSync('stockData.txt', 'utf8');
        if (data.trim() === '') {
            await addInitialStockData();
            return;
        }
        const lines = data.trim().split('\n');
        lines.forEach((line) => {
            const jsonData = JSON.parse(line);
            updateStockPrices(jsonData.symbol, 5);
        });
        console.log("Initial stock data loaded.");
    } catch (error) {
        console.error('Error reading stock data file:', error);
    }
};

app.get("/", (req, res) => {
    res.send("<h1>This Shit Is Working!!!</h1>");
});

app.get("/stockdata", async (req, res) => {
    try {
        stocks.forEach((symbol) => {
            const refreshInterval = Math.floor(Math.random() * 5) + 1;
            updateStockPrices(symbol, refreshInterval);
        });

        res.send("Stock prices are being updated.");
    } catch (error) {
        console.error('Error fetching stock data:', error);
        res.status(500).send('Error fetching stock data');
    }
});

app.get("/stockdatafile", (req, res) => {
    try {
        const data = fs.readFileSync('stockData.txt', 'utf8');
        if (data.trim() === '') {
            res.json([]);
            return;
        }
        const lines = data.trim().split('\n');
        const jsonData = lines.map(line => JSON.parse(line));
        res.json(jsonData);
    } catch (error) {
        console.error('Error reading stock data file:', error);
        res.status(500).send('Error reading stock data file');
    }
});

initializeStockData();

app.listen(port, () => {
    console.log(`Server listening on ${port}`);
});
