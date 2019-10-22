import { decode } from 'base64-arraybuffer';
import { GridProto } from '../gen/grid';

declare var self: ServiceWorkerGlobalScope;

self.addEventListener('fetch', (event: FetchEvent) => {
    event.respondWith(handleRequest(event.request))
});

async function handleRequest(request: Request) {

    if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { Allow: "GET" } });

    const url = new URL(request.url);

    // Rewrite /abcd to use the api endpoint
    if(/^\/[a-z0-9]+$/.test(url.pathname)) {
        url.pathname = "/_/thing" + url.pathname;
    }

    // Check for an api url
    if (url.pathname.startsWith("/_/thing/")) {

        // Update the request url
        url.host = "windmill.thefifthmatt.com";

        // Fetch the puzzle
        const response = await fetch(url.toString());

        // If the response has an error, return the error 
        if (!response.ok) return response;

        // Parse the response json
        const responseData = await response.json();

        // Replace the response data contents with the decoded value
        responseData.contents = decodePackedContent(responseData.contents);

        // Return a new response with the data 
        return new Response(JSON.stringify(responseData), {
            headers: { 'content-type': 'application/json' },
        });

    }
    
    // Check for a build url
    if (url.pathname.startsWith("/build/")) {

        // Extract the packed data
        const data = url.pathname.slice(7);

        // Replace the response data contents with the decoded value
        const decodedData = decodePackedContent(data);

        // Return a new response with the data 
        return new Response(JSON.stringify(decodedData), {
            headers: { 'content-type': 'application/json' },
        });

    }
    
    // Anything else is a 404
    return new Response('Not Found', { status: 404 });

}

function decodePackedContent(value: string) {

    // Decode the content value
    const urlSafeBase64 = value.slice(0, -2);
    const base64 = urlSafeBase64.replace(/\-/g, '+').replace(/\_/g, '/');
    const rawData = decode(base64);

    // Deserialize the content value
    return GridProto.Storage.decode(new Uint8Array(rawData));

}