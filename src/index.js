function component() {
    const element = document.createElement('div');

    element.innerHTML = 'Hello World!';

    return element;
}

document.body.appendChild(component());

if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        window.location.href = supported ? '/vr' : '/desktop';
    });
} else {
    window.location.href = '/desktop';
}