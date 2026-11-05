/* ==========================================
   MASS CONVERTER
   JavaScript Functionality
========================================== */


/* ==========================================
   1. MASS UNIT DEFINITIONS
========================================== */

// All conversion factors are expressed in grams.

const units = {

    mg: {
        name: "Milligram",
        symbol: "mg",
        factor: 0.001
    },

    cg: {
        name: "Centigram",
        symbol: "cg",
        factor: 0.01
    },

    dg: {
        name: "Decigram",
        symbol: "dg",
        factor: 0.1
    },

    g: {
        name: "Gram",
        symbol: "g",
        factor: 1
    },

    kg: {
        name: "Kilogram",
        symbol: "kg",
        factor: 1000
    },

    tonne: {
        name: "Metric Tonne",
        symbol: "t",
        factor: 1000000
    },

    oz: {
        name: "Ounce",
        symbol: "oz",
        factor: 28.349523125
    },

    lb: {
        name: "Pound",
        symbol: "lb",
        factor: 453.59237
    },

    stone: {
        name: "Stone",
        symbol: "st",
        factor: 6350.29318
    },

    shortTon: {
        name: "US Short Ton",
        symbol: "short ton",
        factor: 907184.74
    },

    longTon: {
        name: "UK Long Ton",
        symbol: "long ton",
        factor: 1016046.9088
    },

    carat: {
        name: "Carat",
        symbol: "ct",
        factor: 0.2
    },

    grain: {
        name: "Grain",
        symbol: "gr",
        factor: 0.06479891
    },

    troyOunce: {
        name: "Troy Ounce",
        symbol: "ozt",
        factor: 31.1034768
    }

};


/* ==========================================
   2. GET HTML ELEMENTS
========================================== */

const massValue = document.getElementById("massValue");

const fromUnit = document.getElementById("fromUnit");

const toUnit = document.getElementById("toUnit");

const convertButton = document.getElementById("convertButton");

const swapButton = document.getElementById("swapButton");

const clearButton = document.getElementById("clearButton");

const resultValue = document.getElementById("resultValue");

const conversionFormula = document.getElementById("conversionFormula");

const inputError = document.getElementById("inputError");


/* ==========================================
   3. FORMAT NUMBERS
========================================== */

function formatNumber(number) {

    if (!Number.isFinite(number)) {
        return "Invalid result";
    }

    if (number === 0) {
        return "0";
    }

    if (
        Math.abs(number) >= 1e15 ||
        Math.abs(number) < 1e-7
    ) {
        return number.toExponential(6);
    }

    return Number(number.toPrecision(10)).toLocaleString("en-US", {
        maximumFractionDigits: 10
    });

}


/* ==========================================
   4. MASS CONVERSION FUNCTION
========================================== */

function convertMass(value, from, to) {

    // Check that both units exist.

    if (!units[from] || !units[to]) {
        return NaN;
    }

    // Convert the original value into grams.

    const valueInGrams = value * units[from].factor;

    // Convert grams into the target unit.

    const result = valueInGrams / units[to].factor;

    return result;

}


/* ==========================================
   5. MAIN CONVERSION FUNCTION
========================================== */

function performConversion() {

    // Clear previous errors.

    inputError.textContent = "";

    // Get the input value.

    const value = massValue.value.trim();

    // Check for empty input.

    if (value === "") {

        inputError.textContent = "Please enter a mass value.";

        resultValue.textContent = "Your result will appear here.";

        conversionFormula.textContent =
            "The conversion formula will appear here.";

        return;

    }

    // Convert input into a number.

    const number = Number(value);

    // Validate the input.

    if (!Number.isFinite(number) || number < 0) {

        inputError.textContent =
            "Please enter a valid non-negative number.";

        resultValue.textContent = "Invalid input";

        conversionFormula.textContent = "";

        return;

    }

    // Get selected units.

    const from = fromUnit.value;

    const to = toUnit.value;

    // Perform conversion.

    const result = convertMass(number, from, to);

    // Check conversion result.

    if (!Number.isFinite(result)) {

        inputError.textContent =
            "Unable to perform this conversion.";

        resultValue.textContent = "Conversion error";

        conversionFormula.textContent = "";

        return;

    }

    // Display conversion result.

    resultValue.textContent =
        `${formatNumber(result)} ${units[to].symbol}`;

    // Display conversion formula.

    displayFormula(number, from, to, result);

}


/* ==========================================
   6. DISPLAY CONVERSION FORMULA
========================================== */

function displayFormula(value, from, to, result) {

    // Convert original value into grams.

    const grams = value * units[from].factor;

    // Build the conversion explanation.

    const formula =
        `${formatNumber(value)} ${units[from].symbol} × ` +
        `${units[from].factor} = ${formatNumber(grams)} g\n\n` +

        `${formatNumber(grams)} g ÷ ${units[to].factor} = ` +
        `${formatNumber(result)} ${units[to].symbol}`;

    // Display the formula.

    conversionFormula.textContent = formula;

}


/* ==========================================
   7. SWAP MASS UNITS
========================================== */

swapButton.addEventListener("click", function() {

    // Store previously selected units.

    const previousFrom = fromUnit.value;

    const previousTo = toUnit.value;

    // Get current input.

    const value = Number(massValue.value);

    // Check for valid input.

    const hasValidInput =
        massValue.value.trim() !== "" &&
        Number.isFinite(value) &&
        value >= 0;

    // Calculate the previous result.

    if (hasValidInput) {

        const previousResult = convertMass(
            value,
            previousFrom,
            previousTo
        );

        massValue.value = previousResult;

    }

    // Exchange the selected units.

    fromUnit.value = previousTo;

    toUnit.value = previousFrom;

    // Update the result.

    performConversion();

});


/* ==========================================
   8. CLEAR CONVERTER
========================================== */

clearButton.addEventListener("click", function() {

    // Clear input.

    massValue.value = "";

    // Reset result.

    resultValue.textContent =
        "Your result will appear here.";

    // Reset formula.

    conversionFormula.textContent =
        "The conversion formula will appear here.";

    // Clear error messages.

    inputError.textContent = "";

    // Focus input field.

    massValue.focus();

});


/* ==========================================
   9. CONVERT BUTTON EVENT
========================================== */

convertButton.addEventListener("click", function() {

    performConversion();

});


/* ==========================================
   10. KEYBOARD SUPPORT
========================================== */

// Press Enter to perform conversion.

massValue.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        performConversion();

    }

});


/* ==========================================
   11. INITIALIZE CONVERTER
========================================== */

// Set the initial state when the page loads.

document.addEventListener("DOMContentLoaded", function() {

    massValue.focus();

});