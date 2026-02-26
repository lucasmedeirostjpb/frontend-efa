import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(Auth);

    if (!authService.isLoggedIn()) {
        return next(req);
    }

    return from(authService.updateToken(30)).pipe(
        switchMap((token) => {
            if (token) {
                const authReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                return next(authReq);
            }
            return next(req);
        })
    );
};
