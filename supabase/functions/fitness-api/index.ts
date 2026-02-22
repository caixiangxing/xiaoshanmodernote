import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface FitnessPayload {
  steps?: number;
  calories?: number;
  workout_minutes?: number;
  source?: string;
  date?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'POST') {
      const payload: FitnessPayload = await req.json();

      const date = payload.date || new Date().toISOString().split('T')[0];
      const steps = payload.steps || 0;
      const calories = payload.calories || 0;
      const workout_minutes = payload.workout_minutes || 0;
      const source = payload.source || 'api';

      const { data: existing, error: checkError } = await supabase
        .from('fitness_data')
        .select('id, steps, calories, workout_minutes')
        .eq('user_id', user.id)
        .eq('date', date)
        .eq('source', source)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('fitness_data')
          .update({
            steps: existing.steps + steps,
            calories: existing.calories + calories,
            workout_minutes: existing.workout_minutes + workout_minutes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('fitness_data')
          .insert({
            user_id: user.id,
            date,
            steps,
            calories,
            workout_minutes,
            source,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Fitness data recorded successfully',
          data: result,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '30');
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');

      let query = supabase
        .from('fitness_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          data,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fitness-api:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
