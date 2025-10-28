import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Crear decorador para obtener el usuario actual
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
