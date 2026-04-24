const fs = require('fs');
const path = require('path');

const suits = [
    { id: 'bells', color: '#ffc107', symbol: 'kule' },
    { id: 'hearts', color: '#e91e63', symbol: 'srdce' },
    { id: 'leaves', color: '#4caf50', symbol: 'listy' },
    { id: 'acorns', color: '#795548', symbol: 'zaludy' }
];

const values = ['7', '8', '9', '10', 'spodek', 'svrsek', 'king', 'ace'];

const outputDir = path.join(__dirname, 'assets', 'cards');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function getSuitSvg(suit, x, y, size = 40) {
    const color = suit.color;
    switch (suit.id) {
        case 'hearts':
            return `<path d="M${x},${y+size/4} c0,-${size/2} -${size/1.5},-${size/2} -${size/1.5},0 c0,${size/2} ${size/1.5},${size/1.2} ${size/1.5},${size/1.2} s${size/1.5},-${size/3.2} ${size/1.5},-${size/1.2} c0,-${size/2} -${size/1.5},-${size/2} -${size/1.5},0" fill="${color}" />`;
        case 'bells':
            return `
                <circle cx="${x}" cy="${y}" r="${size/2}" fill="${color}" stroke="#000" stroke-width="1"/>
                <line x1="${x-size/2}" y1="${y}" x2="${x+size/2}" y2="${y}" stroke="#000" stroke-width="1"/>
                <path d="M${x-size/3},${y-size/3} Q${x},${y-size/2} ${x+size/3},${y-size/3}" fill="none" stroke="#000" stroke-width="1"/>
            `;
        case 'leaves':
            return `<path d="M${x},${y+size/2} Q${x-size/2},${y} ${x},${y-size/2} Q${x+size/2},${y} ${x},${y+size/2} Z M${x},${y-size/2} L${x},${y+size/2}" fill="${color}" stroke="#000" stroke-width="1"/>`;
        case 'acorns':
            return `
                <path d="M${x-size/3},${y} Q${x-size/3},${y+size/2} ${x},${y+size/2} Q${x+size/3},${y+size/2} ${x+size/3},${y} Z" fill="${color}" stroke="#000" stroke-width="1"/>
                <path d="M${x-size/2.5},${y} Q${x},${y-size/2} ${x+size/2.5},${y} Z" fill="#5d4037" stroke="#000" stroke-width="1"/>
                <line x1="${x}" y1="${y-size/2}" x2="${x}" y2="${y-size/1.5}" stroke="#5d4037" stroke-width="2"/>
            `;
    }
}

function generateCard(suit, value) {
    const width = 120;
    const height = 180;
    let content = '';

    // Card background & border
    content += `<rect x="2" y="2" width="${width-4}" height="${height-4}" rx="10" fill="white" stroke="#ccc" stroke-width="2"/>`;

    // Value text in corners
    const label = value === 'spodek' ? 'S' : (value === 'svrsek' ? 'Sv' : (value === 'king' ? 'K' : (value === 'ace' ? 'A' : value)));
    content += `<text x="10" y="25" font-family="Arial" font-weight="bold" font-size="18" fill="${suit.color}">${label}</text>`;
    content += `<text x="${width-10}" y="${height-10}" font-family="Arial" font-weight="bold" font-size="18" fill="${suit.color}" text-anchor="end" transform="rotate(180, ${width-10}, ${height-10})">${label}</text>`;

    // Main content
    if (['7', '8', '9', '10'].includes(value)) {
        const count = parseInt(value);
        const positions = {
            '7': [[30,40], [90,40], [30,90], [90,90], [30,140], [90,140], [60,90]],
            '8': [[30,40], [90,40], [30,73], [90,73], [30,106], [90,106], [30,140], [90,140]],
            '9': [[30,40], [90,40], [30,73], [90,73], [30,106], [90,106], [30,140], [90,140], [60,90]],
            '10': [[30,40], [90,40], [30,65], [90,65], [30,90], [90,90], [30,115], [90,115], [30,140], [90,140]]
        };
        positions[value].forEach(pos => {
            content += getSuitSvg(suit, pos[0], pos[1], 25);
        });
    } else if (value === 'spodek' || value === 'svrsek' || value === 'king') {
        // Character placeholder
        const charColor = value === 'king' ? '#ff9800' : (value === 'svrsek' ? '#03a9f4' : '#9c27b0');
        content += `<circle cx="60" cy="90" r="30" fill="${charColor}" opacity="0.2" />`;
        content += `<text x="60" y="100" font-family="Arial" font-size="40" text-anchor="middle" fill="${charColor}">${label}</text>`;
        content += getSuitSvg(suit, 60, 45, 30);
        content += getSuitSvg(suit, 60, 135, 30);
    } else if (value === 'ace') {
        content += getSuitSvg(suit, 60, 90, 60);
    }

    const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
    fs.writeFileSync(path.join(outputDir, `${suit.id}_${value}.svg`), svg);
}

suits.forEach(suit => {
    values.forEach(value => {
        generateCard(suit, value);
    });
});

console.log('Cards generated successfully!');
