document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('shinyButton');
    // const alphaValSpan = document.getElementById('alphaVal'); // Removed alpha/beta for this example
    // const betaValSpan = document.getElementById('betaVal');
    const gammaValSpan = document.getElementById('gammaVal');
    // const targetShineXValSpan = document.getElementById('targetShineXVal'); // Simplified debug
    const cssBgPosXValSpan = document.getElementById('cssBgPosXVal');

    if (!button) {
        console.error("Shiny button not found!");
        return;
    }

    let bgSizeXFactorBefore = 3.5; // Default for ::before (350%)
    let bgSizeXFactorAfter = 3.0;  // Default for ::after (300%)

    // Attempt to read from CSS, not strictly necessary if defaults are fine
    // but good practice if you want CSS to be the single source of truth for sizes.
    try {
        const btnComputedStyleBefore = window.getComputedStyle(button, '::before');
        const bgSizeBefore = btnComputedStyleBefore.getPropertyValue('background-size').split(' ')[0];
        if (bgSizeBefore.includes('%')) {
            const parsedFactor = parseFloat(bgSizeBefore) / 100;
            if (!isNaN(parsedFactor) && parsedFactor > 0) bgSizeXFactorBefore = parsedFactor;
        }

        const btnComputedStyleAfter = window.getComputedStyle(button, '::after');
        const bgSizeAfter = btnComputedStyleAfter.getPropertyValue('background-size').split(' ')[0];
        if (bgSizeAfter.includes('%')) {
            const parsedFactor = parseFloat(bgSizeAfter) / 100;
            if (!isNaN(parsedFactor) && parsedFactor > 0) bgSizeXFactorAfter = parsedFactor;
        }
        // console.log("Using bgSize factors Before/After:", bgSizeXFactorBefore, bgSizeXFactorAfter);
    } catch (e) {
        // console.warn("Could not compute ::before/::after styles for background-size, using defaults.");
    }


    function handleOrientation(event) {
        let { gamma } = event; // We only need gamma for horizontal shine

        if (gamma === null) {
            if (gammaValSpan) gammaValSpan.textContent = 'N/A';
            if (cssBgPosXValSpan) cssBgPosXValSpan.textContent = 'N/A';
            return;
        }
        
        if (gammaValSpan) gammaValSpan.textContent = gamma.toFixed(1);

        // --- Map GAMMA (left/right tilt) to where shine should appear on button ---
        const gammaRange = 90; // Effective range: -45 to +45 degrees
        let targetShineXPercent = (Math.max(-gammaRange / 2, Math.min(gammaRange / 2, gamma)) + (gammaRange / 2)) / gammaRange * 100;

        // --- Calculate CSS background-position-x ---
        // This calculation needs to be done for each pseudo-element if their bgSizeXFactor differs
        // or if we wanted them to move differently. For now, we use one common target.
        // Let's assume for simplicity the "targetShineXPercent" aims for the center of the shine
        // on the button, and both pseudo-elements use a variation of the formula.
        // For simplicity, we'll use one cssBgPosXPercent for both, derived from an average/representative factor.
        // A more precise approach would calculate two separate values if factors are very different.

        const s = targetShineXPercent / 100;
        const shineCenterInGradient = 0.5; // Shine is in middle of gradient definition

        // Using an average factor for simplicity in setting one CSS variable.
        // If precision is paramount, set two different CSS vars for ::before and ::after bg-pos.
        const avgBgSizeXFactor = (bgSizeXFactorBefore + bgSizeXFactorAfter) / 2;
        
        let cssBgPosXPercent;
        if (avgBgSizeXFactor <= 1) {
             cssBgPosXPercent = s * 100;
        } else {
            cssBgPosXPercent = ((s - shineCenterInGradient * avgBgSizeXFactor) / (1 - avgBgSizeXFactor)) * 100;
        }
        cssBgPosXPercent = Math.max(-250, Math.min(250, cssBgPosXPercent)); // Clamp for sanity

        button.style.setProperty('--shine-bg-pos-x', `${cssBgPosXPercent.toFixed(2)}%`);

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
        // Make it clear to the user they need to click
        const initialButtonText = button.textContent;
        button.textContent = "Click to Enable Tilt!";
        setTimeout(() => { // Revert text if they don't click quickly, or after permission granted
            if(button.textContent === "Click to Enable Tilt!") button.textContent = initialButtonText;
        }, 5000);
         DeviceOrientationEvent.requestPermission().then(state => {
            if (state === 'granted') {
                 button.textContent = initialButtonText; // Revert immediately if already granted
            }
        });


    } else if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', handleOrientation);
        console.log("Device orientation supported directly.");
    } else {
        console.warn('Device orientation not supported on this browser/device.');
        alert('Device orientation is not supported on this browser/device. The shine effect will not work.');
        button.textContent = "Tilt Not Supported";
        button.disabled = true;
    }
});