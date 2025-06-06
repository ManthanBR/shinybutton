document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('shinyButton');
    const gammaValSpan = document.getElementById('gammaVal');
    const betaValSpan = document.getElementById('betaVal');
    const shineXValSpan = document.getElementById('shineXVal');
    const shineYValSpan = document.getElementById('shineYVal');
    const rotateXValSpan = document.getElementById('rotateXVal');
    const rotateYValSpan = document.getElementById('rotateYVal');

    if (!button) {
        console.error("Shiny button not found!");
        return;
    }

    // --- Configuration ---
    const MAX_BUTTON_ROTATION = 8; // Max degrees for 3D tilt
    const SHINE_SENSITIVITY_RANGE = 90; // Degrees of device tilt for full shine travel (e.g., -45 to +45)
    const GRADIENT_SIZE_FACTOR = 3.5; // Matches background-size: 350%
    const SHINE_CENTER_IN_GRADIENT = 0.5; // Assume shine is in the middle of the gradient definition

    function calculateCssBackgroundPos(deviceTiltPercent) {
        // s: target shine position on button, normalized (0 to 1)
        const s = deviceTiltPercent / 100;
        let cssBgPosPercent;
        if (GRADIENT_SIZE_FACTOR <= 1) {
            cssBgPosPercent = s * 100;
        } else {
            // Formula: css_val = (s - shine_center_in_gradient * bg_factor) / (1 - bg_factor)
            cssBgPosPercent = ((s - SHINE_CENTER_IN_GRADIENT * GRADIENT_SIZE_FACTOR) / (1 - GRADIENT_SIZE_FACTOR)) * 100;
        }
        // Clamp to prevent extreme values if logic or factors are off
        return Math.max(-250, Math.min(250, cssBgPosPercent));
    }

    function handleOrientation(event) {
        let { beta, gamma } = event; // alpha (compass) not used

        if (beta === null || gamma === null) {
            gammaValSpan.textContent = betaValSpan.textContent = 'N/A';
            shineXValSpan.textContent = shineYValSpan.textContent = 'N/A';
            rotateXValSpan.textContent = rotateYValSpan.textContent = 'N/A';
            return;
        }

        // --- Update Debug Info ---
        gammaValSpan.textContent = gamma.toFixed(1);
        betaValSpan.textContent = beta.toFixed(1);

        // --- 1. Calculate Shine Position (X and Y) ---
        // GAMMA (left/right tilt) for X-axis of shine
        const gammaClamped = Math.max(-SHINE_SENSITIVITY_RANGE / 2, Math.min(SHINE_SENSITIVITY_RANGE / 2, gamma));
        const shineTargetXPercent = (gammaClamped + SHINE_SENSITIVITY_RANGE / 2) / SHINE_SENSITIVITY_RANGE * 100;

        // BETA (front/back tilt) for Y-axis of shine
        const betaClamped = Math.max(-SHINE_SENSITIVITY_RANGE / 2, Math.min(SHINE_SENSITIVITY_RANGE / 2, beta));
        const shineTargetYPercent = (betaClamped + SHINE_SENSITIVITY_RANGE / 2) / SHINE_SENSITIVITY_RANGE * 100;
        // Optional: Invert Y if natural tilt feels opposite: const shineTargetYPercent = 100 - (...);

        const cssShinePosX = calculateCssBackgroundPos(shineTargetXPercent);
        const cssShinePosY = calculateCssBackgroundPos(shineTargetYPercent);

        button.style.setProperty('--shine-bg-pos-x', `${cssShinePosX.toFixed(2)}%`);
        button.style.setProperty('--shine-bg-pos-y', `${cssShinePosY.toFixed(2)}%`);
        shineXValSpan.textContent = cssShinePosX.toFixed(1);
        shineYValSpan.textContent = cssShinePosY.toFixed(1);

        // --- 2. Calculate Button 3D Rotation ---
        // Map gamma to Y-axis rotation, beta to X-axis rotation
        // Normalize gamma/beta to -1 to 1 over a chosen range (e.g., -30 to 30 degrees)
        const rotationRange = 60; // Consider -30 to +30 degrees for full rotation effect

        let normGamma = Math.max(-rotationRange/2, Math.min(rotationRange/2, gamma)) / (rotationRange/2); // -1 to 1
        let normBeta = Math.max(-rotationRange/2, Math.min(rotationRange/2, beta)) / (rotationRange/2);  // -1 to 1

        // Apply max rotation. Invert if necessary for natural feel.
        // Tilting phone top away (beta positive) might feel like button top rotates away (positive rotateX)
        // Tilting phone right (gamma positive) might feel like button right rotates away (negative rotateY)
        const rotateX = normBeta * MAX_BUTTON_ROTATION;
        const rotateY = -normGamma * MAX_BUTTON_ROTATION; // Negative for more natural mapping

        button.style.setProperty('--button-rotate-x', `${rotateX.toFixed(2)}deg`);
        button.style.setProperty('--button-rotate-y', `${rotateY.toFixed(2)}deg`);
        rotateXValSpan.textContent = rotateX.toFixed(1);
        rotateYValSpan.textContent = rotateY.toFixed(1);
    }

    // --- Permission Handling for iOS 13+ ---
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const initialButtonText = button.textContent;
        button.textContent = "Enable Tilt FX"; // Prompt user

        button.addEventListener('click', function requestPerms() {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                        button.textContent = initialButtonText; // Restore text
                        console.log("Device orientation permission granted.");
                        // Remove this click listener if it was only for permission
                        button.removeEventListener('click', requestPerms);
                    } else {
                        button.textContent = "Tilt Denied";
                        console.warn('Device orientation permission not granted.');
                        alert('Device orientation permission was not granted. The effects will not work.');
                    }
                })
                .catch(error => {
                    button.textContent = "Tilt Error";
                    console.error("Error requesting device orientation permission:", error);
                    alert('Could not request device orientation permission.');
                });
        });
    } else if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', handleOrientation);
        console.log("Device orientation supported directly.");
    } else {
        button.textContent = "Tilt N/A";
        button.disabled = true;
        console.warn('Device orientation not supported on this browser/device.');
        alert('Device orientation is not supported. Effects will not work.');
        gammaValSpan.textContent = betaValSpan.textContent = 'Unsupported';
    }
});