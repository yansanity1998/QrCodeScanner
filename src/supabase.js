import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cdkhnbvuksqaybtfqgvr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNka2huYnZ1a3NxYXlidGZxZ3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTExODAsImV4cCI6MjA3OTc4NzE4MH0.9R3jdfdDJ_JHY9W5XuC5A5simZ-J3SdDXMKKgZA7EnQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
