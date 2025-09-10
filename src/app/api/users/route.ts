import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * @openapi
 * /api/users?customer_id:
 *   get:
 *     summary: Get a users by using shopify customer id
 *     tags: ["Internal"]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

export async function GET(
  req: NextRequest
) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Fetch user details from Supabase
    let query = supabase
      .from('users')
      .select('id, name, email,shopify_customer_id, created_at')
      .eq('shopify_customer_id', customerId)
      .single();
    
    const { data: user, error } = await query;
      

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { user },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}