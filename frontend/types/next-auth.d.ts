import 'next-auth';

declare module 'next-auth' {
  interface Session {
    backendToken?: string;
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    company?: {
      id: string;
      name: string;
      onboarding_completed: boolean;
    } | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken?: string;
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    company?: {
      id: string;
      name: string;
      onboarding_completed: boolean;
    } | null;
  }
}
