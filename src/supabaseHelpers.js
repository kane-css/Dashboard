import { supabase } from '../supabase';
export async function logInteraction(partId, customerId, interactionType) {
  const { data, error } = await supabase.from('part_interactions').insert([
    {
      part_id: partId,
      customer_id: customerId, 
      interaction_type: interactionType,
    },
  ]);
  if (error) {
    console.error('Error logging interaction:', error);
  }
  return { data, error };
}
