export const getApiBaseUrl = () => {
    return localStorage.getItem('gestaoos_api_base_url') || '';
};

export const setApiBaseUrl = (url: string) => {
    localStorage.setItem('gestaoos_api_base_url', url);
};

export const clearApiBaseUrl = () => {
    localStorage.removeItem('gestaoos_api_base_url');
};

export async function safeFetch(url: string, options?: RequestInit): Promise<any> {
    const baseUrl = getApiBaseUrl();
    const finalUrl = baseUrl && url.startsWith('/') ? `${baseUrl}${url}` : url;

    // Use token if available
    const token = localStorage.getItem('gestaoos_token');
    const finalOptions = { ...options };
    if (token) {
       finalOptions.headers = {
           ...finalOptions.headers,
           'Authorization': `Bearer ${token}`
       };
    }

    const res = await fetch(finalUrl, finalOptions);
    
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!res.ok) {
        let errMessage = `Erro API: HTTP ${res.status}`;
        if (isJson) {
            try {
               const errData = await res.json();
               errMessage = errData.error || errData.message || errMessage;
            } catch(e) {}
        }
        throw new Error(errMessage);
    }

    if (!isJson) {
        throw new Error(`API Endpoint '${url}' retornou HTML ou conteúdo inválido ao invés de JSON.`);
    }

    return await res.json();
}
