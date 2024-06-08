const express = require('express');
const http = require('http');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;
const BASE_URL = 'http://20.244.56.144/test';

const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzE3ODIxMTgwLCJpYXQiOjE3MTc4MjA4ODAsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjY4ZmNiNGI5LWM0MWQtNGQ5ZC1hMTE3LTc4NmU4NDFlYjBiYSIsInN1YiI6ImFyanVuamFpbjI4OTIwMDNAZ21haWwuY29tIn0sImNvbXBhbnlOYW1lIjoiQWpheSBLdW1hciBHYXJnIEVuZ2luZWVyaW5nIENvbGxlZ2UiLCJjbGllbnRJRCI6IjY4ZmNiNGI5LWM0MWQtNGQ5ZC1hMTE3LTc4NmU4NDFlYjBiYSIsImNsaWVudFNlY3JldCI6IlhxSGlwSGlrbHF3anNJTlMiLCJvd25lck5hbWUiOiJBcmp1biBKYWluIiwib3duZXJFbWFpbCI6ImFyanVuamFpbjI4OTIwMDNAZ21haWwuY29tIiwicm9sbE5vIjoiMjEwMDI3MTUzMDAyMCJ9.F6OUM6WiU152VEDnYLMhKzefeGm-ok0nXum1yazlNjY";

let storedNumbers = [];

const fetchNumbers = (type) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '20.244.56.144',
            path: `/test/${type}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            timeout: 500
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData.numbers);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.abort();
            reject(new Error('Request timed out'));
        });

        req.end();
    });
};

const getAverage = (numbers) => {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return (sum / numbers.length).toFixed(2);
};

app.get('/numbers/:type', async (req, res) => {
    const type = req.params.type;
    const validTypes = ['primes', 'fibo', 'even', 'rand'];

    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid number type' });
    }

    try {
        const newNumbers = await fetchNumbers(type);
        const uniqueNewNumbers = newNumbers.filter(num => !storedNumbers.includes(num));

        const windowPrevState = [...storedNumbers];
        storedNumbers = [...storedNumbers, ...uniqueNewNumbers].slice(-WINDOW_SIZE);
        const windowCurrState = [...storedNumbers];

        const avg = getAverage(storedNumbers);

        res.json({
            windowPrevState,
            windowCurrState,
            numbers: newNumbers,
            avg
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
