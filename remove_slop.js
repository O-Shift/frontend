const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('C:/dev/oshift/frontend/src/app');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const origContent = content;
    
    // Replace all AI slop backgrounds with transparent
    content = content.replace(/bg-\[var\(--accent\)\]\/\d+/g, 'bg-transparent');
    content = content.replace(/bg-(red|emerald|amber|gray)-500\/\d+/g, 'bg-transparent');
    
    // Also remove hover versions
    content = content.replace(/hover:bg-\[var\(--accent\)\]\/\d+/g, 'hover:bg-[var(--item-hover)]');
    content = content.replace(/hover:bg-(red|emerald|amber|gray)-500\/\d+/g, 'hover:bg-[var(--item-hover)]');
    
    if (content !== origContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated ' + file);
    }
});
