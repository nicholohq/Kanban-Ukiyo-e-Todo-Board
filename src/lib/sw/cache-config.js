export const CACHE_SCHEMAS = {
	shell: { name: 'ukiyo-shell', version: 1 },
	static: { name: 'ukiyo-static', version: 1 },
	api: { name: 'ukiyo-api', version: 1 },
	googleFontsCss: { name: 'ukiyo-google-fonts-css', version: 1 },
	googleFontsFiles: { name: 'ukiyo-google-fonts-files', version: 1 }
};

const CACHE_SCHEMA_NAMES = Object.values(CACHE_SCHEMAS).map(
	(s) => `${s.name}-v${s.version}`
);

export function getCacheName(schema) {
	return `${schema.name}-v${schema.version}`;
}

export function isKnownCache(name) {
	return CACHE_SCHEMA_NAMES.some(
		(known) => name === known || name.startsWith('workbox-precache')
	);
}
