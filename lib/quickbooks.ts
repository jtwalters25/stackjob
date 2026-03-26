import OAuthClient from "intuit-oauth";

// QuickBooks OAuth configuration
const QB_CONFIG = {
  clientId: process.env.QUICKBOOKS_CLIENT_ID || "",
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || "",
  environment: (process.env.QUICKBOOKS_ENVIRONMENT || "sandbox") as "sandbox" | "production",
  redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || "",
};

/**
 * Create a new QuickBooks OAuth client
 */
export function createQuickBooksClient() {
  if (!QB_CONFIG.clientId || !QB_CONFIG.clientSecret) {
    throw new Error("QuickBooks credentials not configured");
  }

  return new OAuthClient({
    clientId: QB_CONFIG.clientId,
    clientSecret: QB_CONFIG.clientSecret,
    environment: QB_CONFIG.environment,
    redirectUri: QB_CONFIG.redirectUri,
  });
}

/**
 * Get authorization URI for OAuth flow
 */
export function getAuthUri() {
  const oauthClient = createQuickBooksClient();
  return oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
    state: crypto.randomUUID(),
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const oauthClient = createQuickBooksClient();
  const authResponse = await oauthClient.createToken(code);

  return {
    accessToken: authResponse.token.access_token,
    refreshToken: authResponse.token.refresh_token,
    expiresAt: new Date(Date.now() + authResponse.token.expires_in * 1000),
    realmId: authResponse.token.realmId,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauthClient = createQuickBooksClient();
  oauthClient.setToken({
    refresh_token: refreshToken,
  });

  const authResponse = await oauthClient.refresh();

  return {
    accessToken: authResponse.token.access_token,
    refreshToken: authResponse.token.refresh_token,
    expiresAt: new Date(Date.now() + authResponse.token.expires_in * 1000),
  };
}

/**
 * Revoke tokens
 */
export async function revokeToken(accessToken: string) {
  const oauthClient = createQuickBooksClient();
  oauthClient.setToken({
    access_token: accessToken,
  });

  await oauthClient.revoke();
}

/**
 * Make an authenticated API request to QuickBooks
 */
export async function makeQuickBooksRequest<T>(
  accessToken: string,
  realmId: string,
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: unknown
): Promise<T> {
  const baseUrl =
    QB_CONFIG.environment === "production"
      ? "https://quickbooks.api.intuit.com"
      : "https://sandbox-quickbooks.api.intuit.com";

  const url = `${baseUrl}/v3/company/${realmId}/${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QuickBooks API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Create a customer in QuickBooks
 */
export async function createCustomer(
  accessToken: string,
  realmId: string,
  customerData: {
    displayName: string;
    companyName?: string;
    billAddr?: {
      line1?: string;
      city?: string;
      countrySubDivisionCode?: string;
      postalCode?: string;
    };
  }
) {
  return makeQuickBooksRequest(
    accessToken,
    realmId,
    "customer",
    "POST",
    {
      DisplayName: customerData.displayName,
      CompanyName: customerData.companyName,
      BillAddr: customerData.billAddr,
    }
  );
}

/**
 * Create an invoice in QuickBooks
 */
export async function createInvoice(
  accessToken: string,
  realmId: string,
  invoiceData: {
    customerId: string;
    lineItems: Array<{
      amount: number;
      description: string;
      detailType: "SalesItemLineDetail";
      salesItemLineDetail?: {
        itemRef?: { value: string };
      };
    }>;
    docNumber?: string;
  }
) {
  return makeQuickBooksRequest(
    accessToken,
    realmId,
    "invoice",
    "POST",
    {
      CustomerRef: { value: invoiceData.customerId },
      Line: invoiceData.lineItems.map((item) => ({
        Amount: item.amount,
        Description: item.description,
        DetailType: item.detailType,
        SalesItemLineDetail: item.salesItemLineDetail,
      })),
      DocNumber: invoiceData.docNumber,
    }
  );
}

/**
 * Query QuickBooks for entities (customers, invoices, etc.)
 */
export async function queryQuickBooks<T>(
  accessToken: string,
  realmId: string,
  query: string
): Promise<T> {
  const endpoint = `query?query=${encodeURIComponent(query)}`;
  return makeQuickBooksRequest<T>(accessToken, realmId, endpoint);
}

// TypeScript interfaces for QuickBooks entities
export interface QuickBooksConnection {
  id: string;
  user_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  connected_at: string;
  last_sync_at: string | null;
  is_active: boolean;
}

export interface SyncJob {
  id: string;
  user_id: string;
  job_id: string | null;
  entity_type: "invoice" | "customer" | "payment";
  direction: "to_qb" | "from_qb";
  status: "pending" | "processing" | "completed" | "failed";
  qb_id: string | null;
  error_message: string | null;
  retry_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
