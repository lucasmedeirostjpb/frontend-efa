export const environment = {
    production: true,
    // Same-origin em produção: mantenha vazio e use reverse proxy para /api.
    apiUrl: '',
    keycloak: {
        // Defina a URL pública do Keycloak no ambiente de produção.
        url: '',
        realm: 'tjpb-polvo',
        clientId: 'polvo-app'
    }
};
