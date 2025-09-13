const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

let clients = {};
let groups = [];
let inputs = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/vr', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'vr.html'));
});

app.get('/desktop', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'desktop.html'));
});

app.get('/clients', (req, res) => {
    res.json(clients);
});

app.get('/groups', (req, res) => {
    res.json(groups);
});

app.get('/inputs', (req, res) => {
    res.json(inputs);
    inputs = [];
});

app.post('/register', (req, res) => {
    const { clientType, clientID } = req.body;
    if (clients[clientID]) {
        return res.status(404).json({
            error: 'DUPLICATE_ID',
            message: 'Client Already Registered'
        });
    }

    clients[clientID] = {
        clientType: clientType,
    }

    console.log('Client Registered:', clientID, clientType);
    console.log('All Clients:', clients);
    res.json({ success: true });
});

app.post('/unregister', (req, res) => {
    const { clientID } = req.body;
    if (clients[clientID]) {
        delete clients[clientID];
        for (let i = 0; i < groups.length; i++) {
            let { desktopID, vrID } = groups[i];
            if (desktopID == `${clientID}` || vrID == `${clientID}`) {
                groups.splice(i, 1);
                i--;
            }
        }
        console.log('Client Removed:', clientID);
        console.log('Remaining Clients:', clients);
        console.log('Remaining Groups:', groups);
        res.json({ success: true});
    } else {
        res.status(404).json({ error: 'CLIENT_NOT_FOUND' });
    }
});

app.post('/connect', (req, res) => {
    const { desktopID, vrID } = req.body;
    groups.push({ desktopID, vrID });
    console.log('Group Registered:', { desktopID, vrID });
    res.json({ success: true });
});

app.post('/input', (req, res) => {
    const { inputText } = req.body;
    inputs.push(inputText);
    console.log('Read Input:', inputText);
    res.json({ success: true });
})

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});