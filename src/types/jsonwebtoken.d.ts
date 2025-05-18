declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: any;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: object
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: object
  ): string | JwtPayload;

  export function decode(
    token: string,
    options?: { complete?: boolean; json?: boolean }
  ): null | { [key: string]: any } | string;
} 