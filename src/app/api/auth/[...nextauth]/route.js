import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signUp: '/signup',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          await connectDB();
          // Check if user already exists
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            // Create new user with basic info from Google
            const newUser = new User({
              email: user.email,
              firstName: profile.given_name || '',
              lastName: profile.family_name || '',
              googleId: profile.sub,
              profilePicture: profile.picture,
              dateOfBirth: new Date('1990-01-01'),
              gender: 'prefer-not-to-say'
            });
            await newUser.save();
          }
          // Always allow sign in
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.googleId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.googleId = token.googleId;
        // Add MongoDB _id as user.id
        const userInDb = await User.findOne({ email: session.user.email });
        if (userInDb) {
          session.user.id = userInDb._id.toString();
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST } 