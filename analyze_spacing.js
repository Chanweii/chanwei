const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'cultureroute.html',
    'index.html',
    'about.html',
    'energysaver.html',
    'workshop.html'
];

let totalMatches = 0;

htmlFiles.forEach(file => {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    // Basic regex to find text nodes roughly:
    // This is just for research, not for the final replacement.
    // Match Chinese char, space, English/Number
    const regex1 = /([\u4e00-\u9fa5])\s+([a-zA-Z0-9])/g;
    // Match English/Number, space, Chinese char
    const regex2 = /([a-zA-Z0-9])\s+([\u4e00-\u9fa5])/g;
    
    // To be safe, we shouldn't match inside tags.
    // A better way is to split by tags and only process text.
    let textNodes = [];
    let isInsideTag = false;
    let currentText = "";
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '<') {
            isInsideTag = true;
            if (currentText) {
                textNodes.push(currentText);
                currentText = "";
            }
        } else if (char === '>') {
            isInsideTag = false;
        } else if (!isInsideTag) {
            currentText += char;
        }
    }
    if (currentText) textNodes.push(currentText);

    let fileMatches = 0;
    textNodes.forEach(text => {
        const m1 = text.match(regex1);
        const m2 = text.match(regex2);
        if (m1) fileMatches += m1.length;
        if (m2) fileMatches += m2.length;
    });
    
    console.log(`${file}: ${fileMatches} potential matches`);
    totalMatches += fileMatches;
});

console.log(`Total: ${totalMatches} potential matches`);
