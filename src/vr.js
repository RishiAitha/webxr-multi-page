import * as THREE from 'three';
import { init } from './init.js';
import { XR_BUTTONS } from 'gamepad-wrapper';

let connected = false;
let connectedClient = null;
let myID = Math.floor(Math.random() * 1000000000);
console.log('Client ID: ', myID);

console.log('VR Page Loaded');

if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        if (!supported) window.location.href = '/desktop';
    });
} else {
    window.location.href = '/desktop';
}

async function registerToServer() {
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientType: 'vr',
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
            if (!connected && vrID == `${myID}`) {
                connected = true;
                connectedClient = desktopID;
                console.log('Connected to:', desktopID);
            } else if (vrID == `${myID}`) {
                console.log('maintaining connection');
                foundConnection = true;
            }
        });
        if (!foundConnection) {
            connected = false;
            connectedClient = null;
        }
    } catch (error) {
        console.log('Error:', error);
    }
}

async function sendInput(inputText) {
    try {
        const response = await fetch('/input', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputText })
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
let floor;
function setupScene({ scene, camera, renderer, player, controllers }) {
    const floorGeometry = new THREE.PlaneGeometry(6, 6);
    const floorMaterial = new THREE.MeshStandardMaterial({color: 'white'});
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotateX(-Math.PI / 2);
    scene.add(floor);
}

async function onFrame(delta, time, {scene, camera, renderer, player, controllers}) {
    const controllerConfigs = [controllers.right, controllers.left];
    for (let i = 0; i < 2; i++) {
        const controller = controllerConfigs[i];
        if (controller) {
            const {gamepad, raySpace, mesh} = controller;
            if (gamepad.getButtonClick(XR_BUTTONS.TRIGGER)) {
                const inputText = i == 0 ? 'Pushed Right Trigger' : 'Pushed Left Trigger';
                console.log(inputText);
                await sendInput(inputText);
            }
        }
    }
}

window.addEventListener('beforeunload', async () => {
    unregisterFromServer();
});

registerToServer();
init(setupScene, onFrame);

window.addEventListener('load', () => {
    setInterval(async() => {
        checkConnection();
    }, 2000);
});