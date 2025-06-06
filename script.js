document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('shinyButton');
    const alphaValSpan = document.getElementById('alphaVal');
    const betaValSpan = document.getElementById('betaVal');
    const gammaValSpan = document.getElementById('gammaVal');
    const shineXValSpan = document.getElementById('shineXVal');
    const shineYValSpan = document.getElementById('shineYVal');

    if (!button) {
        console.error("Shiny button not found!");
        return;
    }

    function handleOrientation(event) {
        // beta: front-back tilt (-180 to 180, typically -90 to 90 usable)
        // gamma: left-right tilt (-90 to 90)
        // alpha: compass direction (0-360) - not used for this shine effect

        let { beta, gamma, alpha } = event;

        if (beta === null || gamma === null) {
            // console.warn("Device orientation data not available or incomplete.");
            if (alphaValSpan) alphaValSpan.textContent = 'N/A';
            if (betaValSpan) betaValSpan.textContent = 'N/A';
            if (gammaValSpan) gammaValSpan.textContent = 'N/A';
            return;
        }
        
        if (alphaValSpan) alphaValSpan.textContent = alpha ? alpha.toFixed(1) : 'N/A';
        if (betaValSpan) betaValSpan.textContent = beta.toFixed(1);
        if (gammaValSpan) gammaValSpan.textContent = gamma.toFixed(1);


        // --- Map tilt values to shine position (0% to 100%) ---

        // GAMMA (left/right tilt) for X-axis:
        // Gamma range: -90 (left) to +90 (right)
        // We'll map a smaller, more sensitive range, e.g., -45 to 45 degrees
        const gammaRange = 90; // Effective range: -45 to +45
        let shineX = (Math.max(-gammaRange / 2, Math.min(gammaRange / 2, gamma)) + (gammaRange / 2)) / gammaRange * 100;
        // shineX will be 0% when gamma is -45 (or less), 100% when gamma is +45 (or more)

        // BETA (front/back tilt) for Y-axis:
        // Beta range: e.g., -90 (top towards you) to +90 (bottom towards you)
        // Or on some devices, 0 (flat) to 180 (upside down), or -180 to 180
        // Let's assume a usable range like gamma for simplicity and sensitivity.
        const betaRange = 90; // Effective range: -45 to +45
        let shineY = (Math.max(-betaRange / 2, Math.min(betaRange / 2, beta)) + (betaRange / 2)) / betaRange * 100;
        // shineY will be 0% when beta is -45 (or less), 100% when beta is +45 (or more)
        
        // Optional: Invert Y if the natural tilt feels opposite to the shine movement
        // shineY = 100 - shineY;


        button.style.setProperty('--shine-x', `${shineX.toFixed(2)}%`);
        button.style.setProperty('--shine-y', `${shineY.toFixed(2)}%`);

        if (shineXValSpan) shineXValSpan.textContent = shineX.toFixed(1) + '%';
        if (shineYValSpan) shineYValSpan.textContent = shineY.toFixed(1) + '%';
    }

    // --- Permission Handling for iOS 13+ ---
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // This is likely an iOS 13+ device
        button.addEventListener('click', () => { // Request permission on a user gesture
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                        // Optional: Remove the click listener after permission granted if it was just for this
                        // button.onclick = null; // Or use removeEventListener
                        console.log("Device orientation permission granted.");
                    } else {
                        console.warn('Device orientation permission not granted.');
                        alert('Device orientation permission was not granted. The shine effect will not work.');
                    }
                })
                .catch(error => {
                    console.error("Error requesting device orientation permission:", error);
                    alert('Could not request device orientation permission.');
                });
        }, { once: true }); // Only try to request permission once on click
        alert("Please click the button once to enable device orientation for the shiny effect (iOS).");

    } else if ('DeviceOrientationEvent' in window) {
        // For non-iOS 13+ browsers that support it directly
        window.addEventListener('deviceorientation', handleOrientation);
        console.log("Device orientation supported directly.");
    } else {
        console.warn('Device orientation not supported on this browser/device.');
        alert('Device orientation is not supported on this browser/device. The shine effect will not work.');
    }
});