const fs = require('fs');

const cx = 500;
const cy = 1550;
const seatW = 21;
const seatH = 24;

function calcBlock(id, cols, rows, angleDeg, radius) {
    const width = cols * seatW;
    const height = rows * seatH;
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    
    // centerX, centerY is the BOTTOM-CENTER of the block
    const centerX = cx + radius * Math.cos(angleRad);
    const centerY = cy + radius * Math.sin(angleRad);
    
    const a = angleDeg * Math.PI / 180;
    // top-left corner
    const left = centerX - (width/2)*Math.cos(a) + height*Math.sin(a);
    const top = centerY - (width/2)*Math.sin(a) - height*Math.cos(a);
    
    return `{ id: '${id}', position: { top: ${Math.round(top)}, left: ${Math.round(left)} }, rotation: ${angleDeg} },`;
}

let out = [];
out.push('// Front Tier (radius 1000)');
out.push(calcBlock('FLW', 7, 5, -16, 1000));
out.push(calcBlock('FC', 18, 5, 0, 1000));
out.push(calcBlock('FRW', 7, 5, 16, 1000));

out.push('// Middle Tier (radius 1150)');
out.push(calcBlock('MLW', 6, 8, -13, 1150));
out.push(calcBlock('MCL', 8, 8, -4.5, 1150));
out.push(calcBlock('MCR', 8, 8, 4.5, 1150));
out.push(calcBlock('MRW', 6, 8, 13, 1150));

out.push('// Balcony Tier (radius 1400)');
out.push(calcBlock('BLW', 10, 5, -13, 1400));
out.push(calcBlock('BC', 20, 5, 0, 1400));
out.push(calcBlock('BRW', 10, 5, 13, 1400));

fs.writeFileSync('layout_calc.txt', out.join('\n'));
