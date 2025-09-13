let connected = false;
let myID = Math.floor(Math.random() * 1000000000);
let connectedClient = null;
console.log('Client ID: ', myID);

if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        if (supported) window.location.href = '/vr';
    });
}

console.log('Desktop Page Loaded');

async function registerToServer() {
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientType: 'desktop',
                clientID: `${myID}`,
                connectedClients: {}
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }
        
        const data = await response.json();
        console.log('Success: ', data);
    } catch (error) {
        if (error.message == 'DUPLICATE_ID') {
            myID = Math.floor(Math.random() * 1000000000);
            console.log('duplicate id');
            await registerToServer();
        } else {
            console.log('Other Error:', error);
        }
    }
}

async function unregisterFromServer() {
    try {
        const response = await fetch('/unregister', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientID: myID }),
            keepalive: true
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }

        const data = await response.json();
        console.log('Success:', data);
    } catch (error) {
        console.log('Error:', error);
    }
}

async function displayClients() {
    try {
        const response = await fetch('/clients');
        if (!response.ok) {
            throw new Error('Request Failed');
        }
        const data = await response.json();
        console.log('Current Clients:', data);

        const existingClients = document.querySelectorAll('.client-display');
        existingClients.forEach(element => element.remove());

        Object.entries(data).forEach(([id, client]) => {
            if (client.clientType == 'vr') {
                const idDisplay = document.createElement('div');
                idDisplay.className = 'client-display';
                idDisplay.innerHTML = id;

                const connectButton = document.createElement('button');
                connectButton.className = 'client-display';
                connectButton.textContent = 'Connect to this VR';
                connectButton.addEventListener('click', async () => {
                    await connectToClient(id);
                })

                document.body.appendChild(idDisplay);
                document.body.appendChild(connectButton);
            }
        });
    } catch (error) {
        console.log('Error:', error);
    }
}

async function displayInputs() {
        try {
        const response = await fetch('/inputs');
        if (!response.ok) {
            throw new Error('Request Failed');
        }
        const data = await response.json();

        data.forEach((inputText) => {
            console.log(inputText);
            const inputDisplay = document.createElement('div');
            inputDisplay.innerHTML = inputText;
            document.body.appendChild(inputDisplay);
        });
    } catch (error) {
        console.log('Error:', error);
    }
}

async function connectToClient(otherID) {
    connected = true;
    connectedClient = otherID;
    document.body.innerHTML = '';
    const connectionDisplay = document.createElement('div');
    connectionDisplay.innerHTML = 'Connected to: ' + otherID;
    document.body.appendChild(connectionDisplay);

    try {
        const response = await fetch('/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                desktopID: `${myID}`,
                vrID: otherID
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }
        
        const data = await response.json();
        console.log('Success: ', data);
    } catch (error) {
        console.log('Error:', error);
    }
}

async function checkConnection() {
    try {
        const response = await fetch('/groups');
        if (!response.ok) {
            throw new Error('Request Failed');
        }
        const data = await response.json();
        console.log('Current Groups:', data);

        let foundConnection = false;
        data.forEach(({ desktopID, vrID }) => {
            if (desktopID == `${myID}`) {
                console.log('maintaining connection');
                foundConnection = true;
            }
        });
        if (!foundConnection) {
            connected = false;
            connectedClient = null;
            document.body.innerHTML = '';
        }
    } catch (error) {
        console.log('Error:', error);
    }
}

window.addEventListener('beforeunload', async () => {
    unregisterFromServer();
});

registerToServer();

window.addEventListener('load', () => {
    setInterval(async() => {
        if (!connected) {
            displayClients();
        } else {
            checkConnection();
            displayInputs();
        }
    }, 2000);
});