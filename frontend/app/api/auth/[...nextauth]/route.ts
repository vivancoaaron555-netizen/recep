import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile) {
        const { email, name, picture } = profile as any;
        try {
          const res = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, avatar: picture }),
          });
          if (res.ok) {
            const data = await res.json();
            token.backendToken = data.token;
            token.user = data.user;
            token.company = data.company;
          }
        } catch (err) {
          console.error('[nextauth] Error calling backend:', err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken;
      session.user = token.user as any;
      session.company = token.company as any;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
