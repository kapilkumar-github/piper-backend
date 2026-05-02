import { google } from "googleapis";
import crypto from "crypto";

// 🔑 Fill these from your Google Cloud setup
const CLIENT_ID =
  "210347594102-g40le0lsfsnevi3gdetth7eqj8tt121n.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:3000/auth/google/callback";

// 🔥 This comes after OAuth login (store it in DB ideally)
const REFRESH_TOKEN =
  "1//0gljp6LkWunB2CgYIARAAGBASNwF-L9Irf8kT81RQHeLhluqDhLerVYGj66ZFoXrC__D4Tfpoweu74seNgyHPZ_XG10W-2gnZVqI";

export const sendEmail = async () => {
  console.log("Scheduling interview...");

  // ✅ OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
  );

  // ✅ Set saved token
  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
  });

  await oauth2Client.getAccessToken(); // ✅ Refresh access token

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  const response = await calendar.events.insert({
    calendarId: "primary", // 👈 MUST be "primary" (piper@gmail.com)
    resource: {
      summary: "Interview - Round 1",
      start: { dateTime: "2026-04-30T10:00:00+05:30" },
      end: { dateTime: "2026-04-30T11:00:00+05:30" },

      attendees: [
        { email: "kapil.kumar9395@gmail.com" },
        { email: "akashkmr516@gmail.com" },
        { email: "pihusingh1208@gmail.com", optional: true },
      ],

      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(), // 🔥 IMPORTANT
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
    conferenceDataVersion: 1,
    sendUpdates: "all",
  });

  console.log("Event created:", response.data.htmlLink);
};

sendEmail();
