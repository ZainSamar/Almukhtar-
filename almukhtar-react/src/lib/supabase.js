import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gxnwrgzwxjwmgmftauoq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4bndyZ3p3eGp3bWdtZnRhdW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjcyNjUsImV4cCI6MjA5NzMwMzI2NX0.FJSPUlX45E7iScHZW8fVLlHOM5kMiLPg1wX8xFURhnM'

export const supabase = createClient(supabaseUrl, supabaseKey)
