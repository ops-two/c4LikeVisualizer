// MINIMAL DEBUG VERSION - Copy this into Bubble plugin update function
console.log('=== PLUGIN UPDATE CALLED ===');
console.log('Instance:', instance);
console.log('Properties:', properties);
console.log('Context:', context);

// Test if we can write to canvas
try {
    instance.canvas.html('<div style="background: red; color: white; padding: 20px; font-size: 18px; font-weight: bold;">🚨 PLUGIN UPDATE FUNCTION IS WORKING!</div>');
    console.log('✅ Canvas write successful');
} catch (err) {
    console.error('❌ Canvas write failed:', err);
}

// Log all available properties
if (properties) {
    console.log('Available properties:');
    for (var key in properties) {
        console.log('- ' + key + ':', properties[key]);
    }
} else {
    console.log('❌ No properties object');
}

console.log('=== END PLUGIN UPDATE ===');
