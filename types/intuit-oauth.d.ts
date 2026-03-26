declare module "intuit-oauth" {
  interface OAuthClientConfig {
    clientId: string;
    clientSecret: string;
    environment: "sandbox" | "production";
    redirectUri: string;
  }

  interface AuthorizeUriConfig {
    scope: string[];
    state: string;
  }

  interface TokenResponse {
    token: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      realmId: string;
    };
  }

  class OAuthClient {
    constructor(config: OAuthClientConfig);

    static scopes: {
      Accounting: string;
      OpenId: string;
      Payment: string;
    };

    authorizeUri(config: AuthorizeUriConfig): string;
    createToken(code: string): Promise<TokenResponse>;
    refresh(): Promise<TokenResponse>;
    revoke(): Promise<void>;
    setToken(token: { access_token?: string; refresh_token?: string }): void;
  }

  export = OAuthClient;
}
