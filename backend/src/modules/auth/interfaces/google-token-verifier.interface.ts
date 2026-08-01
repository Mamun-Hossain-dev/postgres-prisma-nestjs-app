export interface GoogleIdentity {
  subject: string;
  email: string;
  name: string;
}

export interface GoogleTokenVerifier {
  verify(idToken: string): Promise<GoogleIdentity>;
}
