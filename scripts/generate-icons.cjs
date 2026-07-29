const sharp = require('sharp');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const svg = readFileSync(join(__dirname, '..', 'static', 'favicon.svg'), 'utf-8');

const sizes = [
	{ name: 'icon-192.png', width: 192, height: 192 },
	{ name: 'icon-512.png', width: 512, height: 512 },
	{ name: 'apple-touch-icon.png', width: 180, height: 180 }
];

async function generate() {
	for (const { name, width, height } of sizes) {
		await sharp(Buffer.from(svg))
			.resize(width, height)
			.png()
			.toFile(join(__dirname, '..', 'static', 'icons', name));
		console.log(`Generated ${name} (${width}x${height})`);
	}

	// Maskable icon: same as 512x512 but with padding (safe zone)
	const maskableSvg = svg.replace(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"',
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"'
	);
	// For maskable, add padding by scaling down the sakura within a larger viewport
	const scaledSvg = svg.replace(
		'viewBox="0 0 64 64" width="64" height="64"',
		'viewBox="-8 -8 80 80" width="64" height="64"'
	);
	await sharp(Buffer.from(scaledSvg))
		.resize(512, 512)
		.png()
		.toFile(join(__dirname, '..', 'static', 'icons', 'icon-maskable.png'));
	console.log('Generated icon-maskable.png (512x512)');
}

generate().catch(console.error);
