import { supabase } from '@/integrations/supabase/client';

export interface BlockchainRecord {
  block_hash: string;
  previous_hash: string | null;
  transaction_type: string;
  transaction_data: any;
  entity_id: string;
  timestamp: string;
  block_number: number;
  merkle_root: string;
}

// Generate a simple hash (in a real implementation, this would use proper cryptographic hashing)
export function generateHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Generate a QR code string (in a real implementation, this would be a proper QR code)
export function generateQRCode(data: any): string {
  const dataString = JSON.stringify(data);
  return `QR_${generateHash(dataString)}_${Date.now()}`;
}

// Create a new blockchain record
export async function createBlockchainRecord(
  transactionType: string,
  transactionData: any,
  entityId: string
): Promise<{ success: boolean; blockHash?: string; error?: string }> {
  try {
    // Get the latest block to get the previous hash
    const { data: latestBlock } = await supabase
      .from('blockchain_records')
      .select('block_hash, block_number')
      .order('block_number', { ascending: false })
      .limit(1)
      .single();

    const previousHash = latestBlock?.block_hash || null;
    const blockNumber = (latestBlock?.block_number || 0) + 1;

    // Create the transaction data string for hashing
    const transactionString = JSON.stringify({
      type: transactionType,
      data: transactionData,
      entity: entityId,
      timestamp: new Date().toISOString(),
      previous: previousHash,
      block: blockNumber
    });

    const blockHash = generateHash(transactionString);
    const merkleRoot = generateHash(`${blockHash}_${Date.now()}`);

    // Insert the new blockchain record
    const { error } = await supabase
      .from('blockchain_records')
      .insert({
        block_hash: blockHash,
        previous_hash: previousHash,
        transaction_type: transactionType,
        transaction_data: transactionData,
        entity_id: entityId,
        block_number: blockNumber,
        merkle_root: merkleRoot
      });

    if (error) throw error;

    return { success: true, blockHash };
  } catch (error: any) {
    console.error('Error creating blockchain record:', error);
    return { success: false, error: error.message };
  }
}

// Get blockchain history for an item
export async function getBlockchainHistory(entityId: string): Promise<BlockchainRecord[]> {
  try {
    const { data, error } = await supabase
      .from('blockchain_records')
      .select('*')
      .eq('entity_id', entityId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching blockchain history:', error);
    return [];
  }
}

// Validate blockchain integrity
export async function validateBlockchainIntegrity(): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  try {
    const { data: blocks, error } = await supabase
      .from('blockchain_records')
      .select('*')
      .order('block_number', { ascending: true });

    if (error) throw error;

    const errors: string[] = [];
    
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      // Check if previous hash matches
      if (currentBlock.previous_hash !== previousBlock.block_hash) {
        errors.push(`Block ${currentBlock.block_number}: Previous hash mismatch`);
      }

      // Check if block number is sequential
      if (currentBlock.block_number !== previousBlock.block_number + 1) {
        errors.push(`Block ${currentBlock.block_number}: Block number not sequential`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error: any) {
    return {
      isValid: false,
      errors: [`Validation error: ${error.message}`]
    };
  }
}

// Get QR code data for consumer scanning
export async function getQRCodeData(qrCode: string): Promise<{
  product?: any;
  batches?: any[];
  collections?: any[];
  qualityTests?: any[];
  processingSteps?: any[];
  error?: string;
}> {
  try {
    // Check if it's a product QR code
    const { data: product } = await supabase
      .from('products')
      .select(`
        *,
        manufacturer:profiles!products_manufacturer_id_fkey(*)
      `)
      .eq('qr_code', qrCode)
      .single();

    if (product) {
      // Get all related batch information
      const { data: batches } = await supabase
        .from('batches')
        .select(`
          *,
          herb:herbs(*),
          aggregator:profiles!batches_aggregator_id_fkey(*)
        `)
        .in('id', product.batch_ids);

      // Get collection events for these batches
      const batchIds = batches?.map(b => b.id) || [];
      const { data: batchCollections } = await supabase
        .from('batch_collections')
        .select(`
          *,
          collection_event:collection_events(
            *,
            collector:collectors(
              *,
              profile:profiles(*)
            ),
            herb:herbs(*)
          )
        `)
        .in('batch_id', batchIds);

      const collections = batchCollections?.map(bc => bc.collection_event) || [];

      // Get quality tests
      const { data: qualityTests } = await supabase
        .from('quality_tests')
        .select(`
          *,
          lab:profiles!quality_tests_lab_id_fkey(*)
        `)
        .in('batch_id', batchIds);

      // Get processing steps
      const { data: processingSteps } = await supabase
        .from('processing_steps')
        .select(`
          *,
          processor:profiles!processing_steps_processor_id_fkey(*)
        `)
        .in('batch_id', batchIds);

      return {
        product,
        batches,
        collections,
        qualityTests,
        processingSteps
      };
    }

    // Check if it's a batch QR code
    const { data: batch } = await supabase
      .from('batches')
      .select(`
        *,
        herb:herbs(*),
        aggregator:profiles!batches_aggregator_id_fkey(*)
      `)
      .eq('qr_code', qrCode)
      .single();

    if (batch) {
      // Get collection events for this batch
      const { data: batchCollections } = await supabase
        .from('batch_collections')
        .select(`
          *,
          collection_event:collection_events(
            *,
            collector:collectors(
              *,
              profile:profiles(*)
            ),
            herb:herbs(*)
          )
        `)
        .eq('batch_id', batch.id);

      const collections = batchCollections?.map(bc => bc.collection_event) || [];

      return {
        batches: [batch],
        collections
      };
    }

    return { error: 'QR code not found' };
  } catch (error: any) {
    console.error('Error fetching QR code data:', error);
    return { error: error.message };
  }
}