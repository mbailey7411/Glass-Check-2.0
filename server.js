const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const uuid = require('uuid');

const app = express();
app.use(cors());
app.use(fileUpload());
app.use(express.static('public')); // Serve static files from the 'public' directory

// In-memory storage
const dataStorage = {};

// Root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Serve the index.html file
});

app.post('/api/upload', (req, res) => {
    try {
        const data = req.body.data; // Extract data from the request body
        const uniqueId = uuid.v4();

        // Store data in-memory
        dataStorage[uniqueId] = data;

        res.send({ url: `https://${process.env.VERCEL_URL}/api/mobile-check?id=${uniqueId}` });
    } catch (error) {
        console.error('Error in /api/upload:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/mobile-check', (req, res) => {
    try {
        const id = req.query.id;

        // Retrieve data from in-memory storage
        if (dataStorage[id]) {
            const data = JSON.stringify(dataStorage[id]);
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Mobile Check</title>
                    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Roboto', sans-serif;
                            margin: 0;
                            padding: 20px;
                            background-color: #f5f5f5;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                        }
                        h1 {
                            color: #2c3e50;
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .item {
                            background-color: white;
                            border-radius: 8px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            padding: 15px;
                            margin-bottom: 20px;
                        }
                        .item label {
                            display: block;
                            font-weight: bold;
                            margin-bottom: 5px;
                        }
                        .item input[type="checkbox"] {
                            margin-right: 10px;
                        }
                        .item textarea {
                            width: 100%;
                            padding: 10px;
                            margin-top: 10px;
                            border-radius: 5px;
                            border: 1px solid #ddd;
                            resize: vertical;
                        }
                        .btn {
                            display: block;
                            width: 100%;
                            padding: 15px;
                            background-color: #3498db;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                            text-align: center;
                            margin-top: 20px;
                            transition: background-color 0.3s;
                        }
                        .btn:hover {
                            background-color: #2980b9;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Mobile Check</h1>
                        <form id="checklistForm"></form>
                        <button class="btn" onclick="submitChecklist()">Submit</button>
                    </div>

                    <script>
                        document.addEventListener('DOMContentLoaded', () => {
                            const data = ${data};
                            generateForm(data);
                        });

                        function generateForm(data) {
                            const form = document.getElementById('checklistForm');
                            data.forEach((item, index) => {
                                const itemContainer = document.createElement('div');
                                itemContainer.className = 'item';

                                itemContainer.innerHTML = \`
                                    <label>
                                        <input type="checkbox" name="check\${index}" value="checked"> \${item[1]} (\${item[3]} - \${item[4]})
                                    </label>
                                    <textarea name="issue\${index}" placeholder="Note any issues here..."></textarea>
                                \`;
                                form.appendChild(itemContainer);
                            });
                        }

                        function submitChecklist() {
                            const form = document.getElementById('checklistForm');
                            const formData = new FormData(form);
                            const resultData = [];

                            for (let entry of formData.entries()) {
                                const [key, value] = entry;
                                const index = key.match(/\\d+/)[0];

                                if (!resultData[index]) {
                                    resultData[index] = { checked: false, issues: '' };
                                }

                                if (key.startsWith('check')) {
                                    resultData[index].checked = value === 'checked';
                                } else if (key.startsWith('issue')) {
                                    resultData[index].issues = value;
                                }
                            }

                            const incompleteItems = resultData
                                .map((item, index) => {
                                    return !item.checked || item.issues ? { ...item, index } : null;
                                })
                                .filter(item => item !== null);

                            if (incompleteItems.length > 0) {
                                sendEmail(incompleteItems);
                            } else {
                                alert('All items checked off with no issues.');
                            }
                        }

                        function sendEmail(data) {
                            const email = 'support@2020glass.com';
                            const subject = 'Checklist Results';
                            const body = encodeURIComponent('Incomplete Items:\\n\\n' + JSON.stringify(data, null, 2));
                            window.location.href = \`mailto:\${email}?subject=\${subject}&body=\${body}\`;
                        }
                    </script>
                </body>
                </html>
            `);
        } else {
            res.status(404).send('Data not found');
        }
    } catch (error) {
        console.error('Error in /api/mobile-check:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
