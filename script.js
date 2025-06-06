document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('shinyButton');
    const alphaValSpan = document.getElementById('alphaVal');
    const betaValSpan = document.getElementById('betaVal');
    const gammaValSpan = document.getElementById('gammaVal');
    const targetShineXValSpan = document.getElementById('targetShineXVal');
    const cssBgPosXValSpan = document.getElementById('cssBgPosXVal');

    if (!button) {
        console.error("Shiny button not found!");
        return;
    }

    // Get background-size-x from CSS to make the formula adaptive
    // Default to 2.5 (250%) if not found or parsing fails
    let bgSizeXFactor = 2.5;
    try {
        const btnComputedStyle = window.getComputedStyle(button, '::before');
        const bgSize = btnComputedStyle.getPropertyValue('background-size');
        const bgSizeParts = bgSize.split(' ');
        if (bgSizeParts[0].includes('%')) {
            const parsedFactor = parseFloat(bgSizeParts[0]) / 100;
            if (!isNaN(parsedFactor) && parsedFactor > 0) {
                bgSizeXFactor = parsedFactor;
            }
        }
        console.log("Using background-size-x factor:", bgSizeXFactor);
    } catch (e) {
        console.warn("Could not compute ::before styles for background-size, defaulting to 2.5. Error:", e);
    }


    function handleOrientation(event) {
        let { beta, gamma, alpha } = event;

        if (beta === null || gamma === null) {
            if (alphaValSpan) alphaValSpan.textContent = 'N/A';
            if (betaValSpan) betaValSpan.textContent = 'N/A';
            if (gammaValSpan) gammaValSpan.textContent = 'N/A';
            return;
        }
        
        if (alphaValSpan) alphaValSpan.textContent = alpha ? alpha.toFixed(1) : 'N/A';
        if (betaValSpan) betaValSpan.textContent = beta.toFixed(1);
        if (gammaValSpan) gammaValSpan.textContent = gamma.toFixed(1);

        // --- Map GAMMA (left/right tilt) to where shine should appear on button ---
        const gammaRange = 90; // Effective range: -45 to +45 degrees
        // targetShineXPercent: 0% (shine on button left) to 100% (shine on button right)
        let targetShineXPercent = (Math.max(-gammaRange / 2, Math.min(gammaRange / 2, gamma)) + (gammaRange / 2)) / gammaRange * 100;

        // --- Calculate CSS background-position-x ---
        // s: target shine position on button, normalized (0 to 1)
        const s = targetShineXPercent / 100;
        // shine_center_in_gradient: typically 0.5 (50%) if shine is in middle of gradient definition
        const shineCenterInGradient = 0.5;

        let cssBgPosXPercent;
        if (bgSizeXFactor === 1) { // If background is same size as button
             cssBgPosXPercent = s * 100; // Direct mapping, though shine won't move
        } else {
            // Formula: css_val = (s - shine_center_in_gradient * bg_factor) / (1 - bg_factor)
            cssBgPosXPercent = ((s - shineCenterInGradient * bgSizeXFactor) / (1 - bgSizeXFactor)) * 100;
        }
        
        // Ensure cssBgPosXPercent stays within reasonable bounds (e.g. 0-100 or what's visually good)
        // For typical sweeping effects, it might go outside 0-100, but the formula handles it.
        // Clamp it just in case of extreme bgSizeXFactor values to avoid huge numbers.
        cssBgPosXPercent = Math.max(-200, Math.min(200, cssBgPosXPercent));


        button.style.setProperty('--shine-bg-pos-x', `${cssBgPosXPercent.toFixed(2)}%`);

        if (targetShineXValSpan) targetShineXValSpan.textContent = targetShineXPercent.toFixed(1) + '%';
        if (cssBgPosXValSpan) cssBgPosXValSpan.textContent = cssBgPosXPercent.toFixed(1) + '%';
    }

    // --- Permission Handling for iOS 13+ ---
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        button.addEventListener('click', () => {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
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
        }, { once: true });
        alert("Please click the button once to enable device orientation for the shiny effect (iOS).");
    } else if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', handleOrientation);
        console.log("Device orientation supported directly.");
    } else {
        console.warn('Device orientation not supported on this browser/device.');
        alert('Device orientation is not supported on this browser/device. The shine effect will not work.');
    }
});