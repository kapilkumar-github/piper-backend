import express from "express";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  "210347594102-g40le0lsfsnevi3gdetth7eqj8tt121n.apps.googleusercontent.com", // CLIENT_ID
  "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", // CLIENT_SECRET
  "http://localhost:3000/auth/google/callback",
);

const app = express();
// Step 1: redirect user to Google
app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    prompt: "consent",
  });

  res.redirect(url);
});

// Step 2: Google redirects here
app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 🔥 SAVE THIS in DB
    console.log("TOKENS:", tokens);

    res.send("OAuth successful! You can close this tab.");
  } catch (err) {
    console.error(err);
    res.send("OAuth failed");
  }
});

app.listen(3000, () => console.log("Server running on 3000"));

//
/*
TOKENS: {
  access_token: 'ya29.a0AQvPyIOfnfi-aLQBSIDivq-RSdC7wVUaTfYpH_0mcCjUBQxEIhPgWH3mP6uqzU668bRnsyGV-OQUjQE-mib_wZSZaABu1TrPei_LyPYs4gkwOCS_ghvK5VJgCzzGiRCv_HQXbhFkAl8qk31_zjeIKVdxMsvuiWFx6GnpWVZyZqN3OH5riNcAMg3umeOf8HB8YA69uHEaCgYKAfUSARQSFQHGX2MiZKz1qGTgHPaDUTsrn_JD5w0206',
  refresh_token: '1//0gljp6LkWunB2CgYIARAAGBASNwF-L9Irf8kT81RQHeLhluqDhLerVYGj66ZFoXrC__D4Tfpoweu74seNgyHPZ_XG10W-2gnZVqI',
  scope: 'https://www.googleapis.com/auth/calendar.events',
  token_type: 'Bearer',
  refresh_token_expires_in: 604799,
  expiry_date: 1777439649403
}*/
