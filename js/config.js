const SUPABASE_URL = "https://uzeemxmzzyfvqiuujgdw.supabase.co";
 const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6ZWVteG16enlmdnFpdXVqZ2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjg4NjQsImV4cCI6MjEwMTcwNDg2NH0.okgoc8xfzZydgiAqp7fqs_gn9t48L-io57iwHcaZbV8";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);