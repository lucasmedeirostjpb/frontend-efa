import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

/**
 * Guard funcional que protege rotas exclusivas para DIGOV.
 * Se o usuário não possuir a role, redireciona para /metas.
 */
export const digovGuard: CanActivateFn = () => {
    const auth = inject(Auth);
    const router = inject(Router);

    if (auth.isDigov()) {
        return true;
    }

    return router.createUrlTree(['/metas']);
};