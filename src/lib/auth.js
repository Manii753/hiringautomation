import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import User from "./models/User";
import dbConnect from "./dbConnect";

async function refreshAccessToken(token) {
  try {
    const url = "https://oauth2.googleapis.com/token"
    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()
    
    if (!response.ok) throw refreshedTokens

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch (error) {
    console.error("Error refreshing access token", error)
    return { ...token, error: "RefreshAccessTokenError" }
  }
}

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
            params: {
            access_type: "offline",
            prompt: "consent",
            scope:
                "openid email profile https://www.googleapis.com/auth/drive.meet.readonly https://www.googleapis.com/auth/drive.metadata",
            },
        },
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (account && user) {
        console.log("Initial sign in. Storing new tokens.");
        
        // Store refresh token in database
        if (account.refresh_token) {
          const client = await clientPromise;
          const db = client.db();
          await db.collection("accounts").updateOne(
            { userId: user.id, provider: "google" },
            { 
              $set: { 
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: Math.floor(Date.now() / 1000) + account.expires_in
              } 
            }
          );
        }
        
        return {
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + account.expires_in * 1000,
          refreshToken: account.refresh_token,
          slackChannel: user.slackChannel,
          user,
        }
      }

      // If trigger is 'update', fetch fresh user data from database
      if (trigger === "update" && token.user?.id) {
        
        try {
          await dbConnect();
          const freshUser = await User.findById(token.user.id).lean();
          
          if (freshUser) {
            token.user = {
              ...token.user,
              ...freshUser,
              id: freshUser._id.toString(),
            };
            token.slackChannel = freshUser.slackChannel;
          }
        } catch (error) {
          console.error("Error fetching fresh user data:", error);
        }
      }

      // If we don't have a refresh token in the JWT, fetch it from the database
      if (!token.refreshToken && token.user?.id) {
        console.log("No refresh token in JWT. Fetching from database.");
        const client = await clientPromise;
        const db = client.db();
        const accountData = await db.collection("accounts").findOne({
          userId: token.user.id,
          provider: "google"
        });
        
        if (accountData?.refresh_token) {
          token.refreshToken = accountData.refresh_token;
        } else {
          console.error("No refresh token found in database. User needs to re-authenticate.");
          return { ...token, error: "RefreshTokenNotFound" };
        }
      }

      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token)
    },
    async session({ session, token  }) {
      session.user = token.user
      session.accessToken = token.accessToken
      session.error = token.error
      session.slackChannel = token.slackChannel
      
      return session
    }
  },
  
};