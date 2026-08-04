import adapter from '@sveltejs/adapter-vercel';

const config = {
	kit: {
		adapter: adapter(),
		serviceWorker: {
			register: false
		}
	}
};

export default config;
