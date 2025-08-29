// Use Supabase environment variables instead of DATABASE_URL
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment");
}

export default {
  out: "./migrations",
  schema: "./shared/schema.ts",
  dbCredentials: {
    url: process.env.SUPABASE_URL,
  },
};
