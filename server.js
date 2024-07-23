const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const cors = require('cors');  // Add this line

const app = express();
app.use(cors());  // Add this line
app.use(fileUpload());
app.use(express.static('public'));

const dataDirectory = path.join(__dirname, 'data');
if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory);
}

app.post('/api/upload', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const csvFile = req.files.csvFile;
    const data = JSON.parse(req.body.data);
    const uniqueId = uuid.v4();
    const filePath = path.join(dataDirectory, `${uniqueId}.json`);

    fs.writeFile(filePath, JSON.stringify(data), err => {
        if (err) {
            return res.status(500).send('Failed to save data.');
        }
        res.send({ url: `https://${process.env.VERCEL_URL}/api/mobile-check?id=${uniqueId}` });
    });
});

app.get('/api/mobile-check', (req, res) => {
    const id = req.query.id;
    const filePath = path.join(dataDirectory, `${id}.json`);

    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
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

                <script src="https://cdn.jsdelivr.net/npm/emailjs-com@2.6.4/dist/email.min.js"></script>
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

                            itemContainer.innerHTML = `
                                <label>
                                    <input type="checkbox" name="check${index}" value="checked"> ${item[1]} (${item[3]} - ${item[4]})
                                </label>
                                <textarea name="issue${index}" placeholder="Note any issues here..."></textarea>
                            `;
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
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
